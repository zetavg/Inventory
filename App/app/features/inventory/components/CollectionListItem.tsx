import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { DataTypeWithAdditionalInfo, useDataCount } from '@app/data';

import useDB from '@app/hooks/useDB';

import { IconName } from '@app/components/Icon';
import UIGroup from '@app/components/UIGroup';

export default function CollectionListItem({
  collection,
  onPress,
  hideDetails,
  reloadCounter,
  ...props
}: {
  collection: DataTypeWithAdditionalInfo<'collection'>;
  onPress: () => void;
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
      key={collection.id}
      verticalArrangedIOS={!hideDetails}
      label={collection.name}
      icon={collection.icon_name as IconName}
      iconColor={collection.icon_color}
      labelTextStyle={styles.collectionListItemLabelText}
      detailTextStyle={styles.collectionListItemDetailText}
      onPress={onPress}
      navigable={!!onPress}
      detail={
        hideDetails
          ? undefined
          : [
              collection.collection_reference_number,
              itemsCount !== null && `${itemsCount} items`,
            ]
              .filter(s => s)
              .join(' | ')
      }
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  collectionListItemIcon: { marginRight: -2 },
  collectionListItemLabelText: { fontSize: 16 },
  collectionListItemDetailText: { fontSize: 12 },
});
