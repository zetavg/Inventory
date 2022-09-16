import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

import useColors from '@app/hooks/useColors';
import commonStyles from '@app/utils/commonStyles';
import InsetGroup from '@app/components/InsetGroup';
import Icon, { IconName } from '@app/components/Icon';

import useDB from '@app/hooks/useDB';
import { DataType } from '@app/db/schema';
import { DataTypeWithID } from '@app/db/relationalUtils';

export default function ItemItem({
  item,
  onPress,
  hideDetails,
  reloadCounter,
  ...props
}: {
  item: DataTypeWithID<'item'>;
  onPress: () => void;
  hideDetails?: boolean;
  reloadCounter?: number;
} & React.ComponentProps<typeof InsetGroup.Item>) {
  const { contentSecondaryTextColor } = useColors();
  const { db } = useDB();
  const [collectionData, setCollectionData] =
    useState<DataType<'collection'> | null>(null);
  const loadCollectionData = useCallback(async () => {
    const results: any = await db.get(`collection-2-${item.collection}`);
    item._collectionData = results.data;
    setCollectionData(results.data);
  }, [db, item]);

  useEffect(() => {
    reloadCounter;
    if (hideDetails) return;

    loadCollectionData();
  }, [hideDetails, loadCollectionData, reloadCounter]);

  return (
    <InsetGroup.Item
      key={item.id}
      arrow
      vertical={!hideDetails}
      label={item.name}
      leftElement={
        <Icon
          name={item.iconName as IconName}
          color={item.iconColor}
          style={styles.itemItemIcon}
          // size={20}
          size={30}
          showBackground
          backgroundPadding={4}
        />
      }
      labelTextStyle={styles.itemItemLabelText}
      detailTextStyle={styles.itemItemDetailText}
      onPress={onPress}
      detailAsText
      detail={
        hideDetails
          ? undefined
          : [
              collectionData && (
                <React.Fragment key="collection">
                  <Icon
                    name={collectionData.iconName as IconName}
                    color={contentSecondaryTextColor}
                    size={11}
                    style={styles.itemDetailCollectionIcon}
                  />{' '}
                  {collectionData.name}
                </React.Fragment>
              ),
              item.individualAssetReference,
              // itemsCount !== null && `${itemsCount} items`,
            ]
              .filter(s => s)
              .flatMap(element => [element, ' | '])
              .slice(0, -1)
      }
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  itemItemIcon: { marginRight: -2 },
  itemItemLabelText: { fontSize: 16 },
  itemItemDetailText: { fontSize: 12 },
  itemDetailCollectionIcon: {
    opacity: 0.7,
  },
});
