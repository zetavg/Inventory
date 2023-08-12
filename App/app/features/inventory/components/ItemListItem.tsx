import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import {
  verifyIconColorWithDefault,
  verifyIconNameWithDefault,
} from '@app/consts/icons';

import {
  DataTypeWithAdditionalInfo,
  onlyValid,
  useDataCount,
  useRelated,
} from '@app/data';

import commonStyles from '@app/utils/commonStyles';

import Icon from '@app/components/Icon';
import UIGroup from '@app/components/UIGroup';

export default function ItemListItem({
  item,
  onPress,
  hideDetails,
  reloadCounter,
  additionalDetails,
  hideCollectionDetails,
  hideContainerDetails,
  ...props
}: {
  item: DataTypeWithAdditionalInfo<'item'>;
  onPress: () => void;
  hideDetails?: boolean;
  /** Can be used to reload the data in this component. Set this to a different value that isn't 0 to trigger an reload. */
  reloadCounter?: number;
  hideCollectionDetails?: boolean;
  hideContainerDetails?: boolean;
  additionalDetails?: string;
} & React.ComponentProps<typeof UIGroup.ListItem>) {
  const [disableAdditionalDataLoading, setDisableAdditionalDataLoading] =
    useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisableAdditionalDataLoading(false);
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const { count: itemsCount, reload: reloadItemsCount } = useDataCount(
    'item',
    {
      container_id: item.__id,
    },
    { disable: disableAdditionalDataLoading },
  );

  const { data: collection, refresh: refreshCollection } = useRelated(
    item,
    'collection',
    {
      disable: hideCollectionDetails || disableAdditionalDataLoading,
    },
  );
  const validatedCollection = collection?.__valid ? collection : null;

  const { data: container, refresh: refreshContainer } = useRelated(
    item,
    'container',
    {
      disable: hideContainerDetails || disableAdditionalDataLoading,
    },
  );
  const validatedContainer = container?.__valid ? container : null;

  useEffect(() => {
    reloadCounter;
    if (hideDetails) return;
    if (!reloadCounter) return;

    reloadItemsCount();
    refreshCollection();
    refreshContainer();
  }, [
    hideDetails,
    reloadItemsCount,
    reloadCounter,
    refreshCollection,
    refreshContainer,
  ]);

  return (
    <UIGroup.ListItem
      key={item.__id}
      verticalArrangedNormalLabelIOS={!hideDetails}
      label={item.name}
      icon={verifyIconNameWithDefault(item.icon_name)}
      iconColor={verifyIconColorWithDefault(item.icon_color)}
      onPress={onPress}
      navigable={!!onPress}
      detail={
        hideDetails
          ? undefined
          : // eslint-disable-next-line react/no-unstable-nested-components
            ({ textProps, iconProps }) => {
              const detailElements = [
                !!additionalDetails && (
                  <Text {...textProps}>{additionalDetails}</Text>
                ),
                itemsCount !== null &&
                  // eslint-disable-next-line react/no-unstable-nested-components
                  (() => {
                    switch (item.item_type) {
                      case 'item_with_parts':
                        return (
                          <Text
                            key="containerInfo"
                            {...textProps}
                          >{`+${itemsCount} parts`}</Text>
                        );

                      case 'container':
                        return (
                          <Text
                            key="containerInfo"
                            {...textProps}
                          >{`${itemsCount} items`}</Text>
                        );

                      default:
                        return null;
                    }
                  })(),
                !hideCollectionDetails && !!validatedCollection && (
                  <Text key="collection" {...textProps}>
                    <Icon
                      name={verifyIconNameWithDefault(
                        validatedCollection.icon_name,
                      )}
                      {...iconProps}
                    />{' '}
                    {validatedCollection.name}
                  </Text>
                ),
                !hideContainerDetails && !!validatedContainer && (
                  <Text key="container" {...textProps}>
                    <Icon
                      name={verifyIconNameWithDefault(
                        validatedContainer.icon_name,
                      )}
                      {...iconProps}
                    />{' '}
                    {validatedContainer.name}
                  </Text>
                ),
                item._individual_asset_reference && (
                  <Text key="itemReference" {...textProps}>
                    {item.rfid_tag_epc_memory_bank_contents &&
                      item.rfid_tag_epc_memory_bank_contents !==
                        item.actual_rfid_tag_epc_memory_bank_contents && (
                        <>
                          <Icon name="app-exclamation" {...iconProps} />{' '}
                        </>
                      )}
                    {item._individual_asset_reference
                      .split('.')
                      .slice(1)
                      .join('.')}
                  </Text>
                ),
              ].filter(n => n);
              return (
                <View style={commonStyles.row}>
                  {(detailElements.length
                    ? detailElements
                    : [
                        <Text key="N" {...textProps}>
                          {' '}
                          -{' '}
                        </Text>,
                      ]
                  )
                    .flatMap((node, i) => [
                      node,
                      <Text key={`s-${i}`} {...textProps}>
                        {' '}
                        |{' '}
                      </Text>,
                    ])
                    .slice(0, -1)}
                </View>
              );
            }
        // hideDetails
        //   ? undefined
        //   : [
        //       'This is an item',
        //       // item.item_reference_number,
        //       // itemsCount !== null && itemsCount === 1
        //       //   ? `${itemsCount} item`
        //       //   : `${itemsCount} items`,
        //     ]
        //       .filter(s => s)
        //       .join(' | ')
      }
      {...props}
    />
  );
}
