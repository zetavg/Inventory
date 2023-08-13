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
  onLongPress,
  hideDetails,
  reloadCounter,
  additionalDetails,
  hideCollectionDetails,
  hideContainerDetails,
  hideContentDetails,
  ...props
}: {
  item: DataTypeWithAdditionalInfo<'item'>;
  onPress: () => void;
  onLongPress?: () => void;
  hideDetails?: boolean;
  /** Can be used to reload the data in this component. Set this to a different value that isn't 0 to trigger an reload. */
  reloadCounter?: number;
  hideCollectionDetails?: boolean;
  hideContainerDetails?: boolean;
  hideContentDetails?: boolean;
  additionalDetails?: React.ComponentProps<typeof UIGroup.ListItem>['detail'];
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
    { disable: hideContentDetails || disableAdditionalDataLoading },
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
      onLongPress={onLongPress}
      navigable={!!onPress}
      detail={
        hideDetails
          ? undefined
          : // eslint-disable-next-line react/no-unstable-nested-components
            ({ textProps, iconProps }) => {
              const detailElements = [
                !!additionalDetails && (
                  <React.Fragment key="additionalDetails">
                    {typeof additionalDetails === 'function'
                      ? additionalDetails({ textProps, iconProps })
                      : additionalDetails}
                  </React.Fragment>
                ),
                !hideContentDetails &&
                  itemsCount !== null &&
                  // eslint-disable-next-line react/no-unstable-nested-components
                  (() => {
                    switch (item.item_type) {
                      case 'item_with_parts':
                        return (
                          <React.Fragment key="containerInfo">
                            {itemsCount === 1
                              ? `+${itemsCount} part`
                              : `+${itemsCount} parts`}
                          </React.Fragment>
                        );

                      case 'container':
                        return (
                          <React.Fragment key="containerInfo">
                            {itemsCount === 1
                              ? `${itemsCount} item`
                              : `${itemsCount} items`}
                          </React.Fragment>
                        );

                      default:
                        return null;
                    }
                  })(),
                !hideCollectionDetails && !!validatedCollection && (
                  <React.Fragment key="collection">
                    <Icon
                      name={verifyIconNameWithDefault(
                        validatedCollection.icon_name,
                      )}
                      {...iconProps}
                    />{' '}
                    {validatedCollection.name}
                  </React.Fragment>
                ),
                !hideContainerDetails && !!validatedContainer && (
                  <React.Fragment key="container">
                    <Icon
                      name={verifyIconNameWithDefault(
                        validatedContainer.icon_name,
                      )}
                      {...iconProps}
                    />{' '}
                    {validatedContainer.name}
                  </React.Fragment>
                ),
                item._individual_asset_reference && (
                  <React.Fragment key="itemReference">
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
                  </React.Fragment>
                ),
              ].filter(n => n);
              return (
                <Text {...textProps} numberOfLines={1}>
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
                </Text>
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
