import React, { useEffect } from 'react';
import { Text } from 'react-native';

import { DataTypeWithID, useDataCount } from '@app/data';

import { IconName } from '@app/components/Icon';
import UIGroup from '@app/components/UIGroup';

export default function CollectionListItem({
  collection,
  onPress,
  hideDetails,
  reloadCounter,
  additionalDetails,
  ...props
}: {
  collection: DataTypeWithID<'collection'>;
  onPress: () => void;
  additionalDetails?: React.ComponentProps<typeof UIGroup.ListItem>['detail'];
  hideDetails?: boolean;
  /** Can be used to reload the data in this component. Set this to a different value that isn't 0 to trigger an reload. */
  reloadCounter?: number;
} & React.ComponentProps<typeof UIGroup.ListItem>) {
  const { count: itemsCount, refresh: refreshItemsCount } = useDataCount(
    'item',
    {
      collection_id: collection.__id,
    },
  );

  useEffect(() => {
    reloadCounter;
    if (hideDetails) return;
    if (!reloadCounter) return;

    refreshItemsCount();
  }, [hideDetails, refreshItemsCount, reloadCounter]);

  return (
    <UIGroup.ListItem
      key={collection.__id}
      verticalArrangedNormalLabelIOS={!hideDetails}
      label={collection.name}
      icon={collection.icon_name as IconName}
      iconColor={collection.icon_color}
      onPress={onPress}
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
                <React.Fragment key="collectionReferenceNumber">
                  {collection.collection_reference_number}
                </React.Fragment>,
                itemsCount !== null && (
                  <React.Fragment key="itemsCount">
                    {itemsCount === 1
                      ? `${itemsCount} item`
                      : `${itemsCount} items`}
                  </React.Fragment>
                ),
              ].filter(s => s);
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
      }
      {...props}
    />
  );
}
