import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

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
  hideCollectionDetails,
  hideDedicatedContainerDetails,
  reloadCounter,
  ...props
}: {
  item: DataTypeWithID<'item'>;
  onPress: () => void;
  hideDetails?: boolean;
  hideCollectionDetails?: boolean;
  hideDedicatedContainerDetails?: boolean;
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

  const [dedicatedItemsCount, setDedicatedItemsCount] = useState<number | null>(
    null,
  );
  const loadDedicatedItemsCount = useCallback(async () => {
    if (!item.isContainer) {
      setDedicatedItemsCount(null);
      return;
    }

    const results = await db.query(
      'relational_data_index/item_by_dedicatedContainer',
      {
        startkey: item.id,
        endkey: item.id,
        include_docs: false,
      },
    );
    setDedicatedItemsCount(results.rows.length);
  }, [item.isContainer, item.id, db]);

  const [dedicatedContainerData, setDedicatedContainerData] =
    useState<DataType<'collection'> | null>(null);
  const loadDedicatedContainerData = useCallback(async () => {
    if (!item.dedicatedContainer) {
      item._dedicatedContainerData = null;
      setDedicatedContainerData(null);
      return;
    }
    const results: any = await db.get(`item-2-${item.dedicatedContainer}`);
    item._dedicatedContainerData = results.data;
    setDedicatedContainerData(results.data);
  }, [db, item]);

  useEffect(() => {
    reloadCounter;

    if (hideDetails) return;

    if (!hideCollectionDetails) loadCollectionData();
    if (!hideDedicatedContainerDetails) loadDedicatedContainerData();
    loadDedicatedItemsCount();
  }, [
    hideCollectionDetails,
    hideDedicatedContainerDetails,
    hideDetails,
    loadCollectionData,
    loadDedicatedContainerData,
    loadDedicatedItemsCount,
    reloadCounter,
  ]);

  const detailElements = useMemo(() => {
    return hideDetails
      ? undefined
      : [
          dedicatedItemsCount !== null &&
            (() => {
              switch (item.isContainerType) {
                case 'item-with-parts':
                  return `+${dedicatedItemsCount} parts`;

                default:
                  return `${dedicatedItemsCount} items`;
              }
            })(),
          !hideCollectionDetails && collectionData && (
            <Text key="collectionData">
              <Icon
                name={collectionData.iconName as IconName}
                color={contentSecondaryTextColor}
                size={11}
                style={styles.itemDetailCollectionIcon}
              />{' '}
              {collectionData.name}
            </Text>
          ),
          !hideDedicatedContainerDetails && dedicatedContainerData && (
            <Text key="dedicatedContainerData">
              <Icon
                name={dedicatedContainerData.iconName as IconName}
                color={contentSecondaryTextColor}
                size={11}
                style={styles.itemDetailCollectionIcon}
              />{' '}
              {dedicatedContainerData.name}
            </Text>
          ),
          item.individualAssetReference,
          // itemsCount !== null && `${itemsCount} items`,
        ]
          .filter(s => s)
          .flatMap(element => [element, ' | '])
          .slice(0, -1);
  }, [
    collectionData,
    contentSecondaryTextColor,
    dedicatedContainerData,
    dedicatedItemsCount,
    hideCollectionDetails,
    hideDedicatedContainerDetails,
    hideDetails,
    item.individualAssetReference,
    item.isContainerType,
  ]);

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
          : (detailElements?.length || 0) > 0
          ? detailElements
          : '-'
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
    marginBottom: -1.5,
  },
});
