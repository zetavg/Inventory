import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import InsetGroup from '@app/components/InsetGroup';
import Icon, { IconName } from '@app/components/Icon';

import useDB from '@app/hooks/useDB';
import { DataTypeWithID } from '@app/db/old_relationalUtils';

export default function CollectionItem({
  collection,
  onPress,
  hideDetails,
  reloadCounter,
  ...props
}: {
  collection: DataTypeWithID<'collection'>;
  onPress: () => void;
  hideDetails?: boolean;
  reloadCounter: number;
} & React.ComponentProps<typeof InsetGroup.Item>) {
  const { db } = useDB();
  const [itemsCount, setItemsCount] = useState<number | null>(null);
  const loadItemsCount = useCallback(async () => {
    const results = await db.query('relational_data_index/item_by_collection', {
      startkey: collection.id,
      endkey: collection.id,
      include_docs: false,
    });
    setItemsCount(results.rows.length);
  }, [collection.id, db]);

  useEffect(() => {
    reloadCounter;
    if (hideDetails) return;

    loadItemsCount();
  }, [hideDetails, loadItemsCount, reloadCounter]);

  return (
    <InsetGroup.Item
      key={collection.id}
      arrow
      vertical={!hideDetails}
      label={collection.name}
      leftElement={
        <Icon
          name={collection.iconName as IconName}
          color={collection.iconColor}
          style={styles.collectionItemIcon}
          // size={20}
          size={30}
          showBackground
          backgroundPadding={4}
        />
      }
      labelTextStyle={styles.collectionItemLabelText}
      detailTextStyle={styles.collectionItemDetailText}
      onPress={onPress}
      detail={
        hideDetails
          ? undefined
          : [
              collection.collectionReferenceNumber,
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
  collectionItemIcon: { marginRight: -2 },
  collectionItemLabelText: { fontSize: 16 },
  collectionItemDetailText: { fontSize: 12 },
});
