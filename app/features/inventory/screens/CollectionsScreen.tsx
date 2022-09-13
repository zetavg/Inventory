import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import { useFocusEffect } from '@react-navigation/native';

import commonStyles from '@app/utils/commonStyles';
import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';
import Icon, { IconColor, IconName } from '@app/components/Icon';
import EditingListView from '@app/components/EditingListView/EditingListView';

import useDB from '@app/hooks/useDB';
import { useRelationalData } from '@app/db';
import { DataTypeWithID } from '@app/db/relationalUtils';
import useOrderedData from '@app/hooks/useOrderedData';

import moveItemInArray from '@app/utils/moveItemInArray';

function CollectionsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Collections'>) {
  const rootNavigation = useRootNavigation();

  const { data, reloadData } = useRelationalData('collection');
  const { orderedData, reloadOrder, updateOrder } = useOrderedData({
    data,
    settingName: 'collections',
  });

  useFocusEffect(
    useCallback(() => {
      reloadOrder();
      reloadData();
    }, [reloadData, reloadOrder]),
  );

  const [editing, setEditing] = useState(false);
  const [editingWithDelayOn, setEditingWithDelayOn] = useState(false);
  useEffect(() => {
    if (!editing) {
      setEditingWithDelayOn(false);
      return;
    }

    const timer = setTimeout(() => setEditingWithDelayOn(true), 10);
    return () => clearTimeout(timer);
  }, [editing]);
  const [editingWithDelayOff, setEditingWithDelayOff] = useState(false);
  useEffect(() => {
    if (editing) {
      setEditingWithDelayOff(true);
      return;
    }

    const timer = setTimeout(() => setEditingWithDelayOff(false), 300);
    return () => clearTimeout(timer);
  }, [editing]);
  const [newOrder, setNewOrder] = useState<string[]>([]);
  const startEdit = useCallback(() => {
    if (!orderedData) return null;
    setEditing(true);
    setNewOrder(orderedData.map(d => d.id || ''));
  }, [orderedData]);
  const endEdit = useCallback(() => {
    setEditing(false);
  }, []);
  const handleItemMove = useCallback(
    ({ from, to }: { from: number; to: number }) => {
      if (!editing) return;
      const newNewOrder = moveItemInArray(newOrder, from, to);
      setNewOrder(newNewOrder);
      updateOrder(newNewOrder);
    },
    [editing, newOrder, updateOrder],
  );
  const [editingListViewKey, setEditingListViewKey] = useState(0);
  const handleItemDelete = useCallback((_index: number) => {
    setEditingListViewKey(v => v + 1);
  }, []);

  return (
    <ScreenContent
      navigation={navigation}
      title="Collections"
      action1Label={editing ? 'Done' : 'Add'}
      action1SFSymbolName={editing ? undefined : 'rectangle.stack.badge.plus'}
      action1MaterialIconName={editing ? undefined : 'plus'}
      onAction1Press={() =>
        editing ? endEdit() : rootNavigation?.navigate('SaveCollection', {})
      }
      action2SFSymbolName={
        orderedData && !editing ? 'list.bullet.indent' : undefined
      }
      onAction2Press={orderedData && !editing ? () => startEdit() : undefined}
    >
      {(() => {
        if (orderedData && (editing || editingWithDelayOff)) {
          return (
            <EditingListView
              style={commonStyles.flex1}
              editing={editingWithDelayOn}
              onItemMove={handleItemMove}
              onItemDelete={handleItemDelete}
              key={editingListViewKey}
            >
              {orderedData.map(collection => (
                <EditingListView.Item
                  key={collection.id}
                  label={collection.name}
                />
              ))}
            </EditingListView>
          );
        }

        return (
          <ScrollView keyboardDismissMode="interactive">
            <InsetGroup loading={!orderedData}>
              {orderedData &&
                orderedData
                  .flatMap(collection => [
                    <CollectionItem
                      key={collection.id}
                      collection={collection}
                      onPress={() =>
                        navigation.push('Collection', {
                          id: collection.id || '',
                          initialTitle: collection.name,
                        })
                      }
                    />,
                    <InsetGroup.ItemSeperator
                      key={`s-${collection.id}`}
                      leftInset={50}
                    />,
                  ])
                  .slice(0, -1)}
            </InsetGroup>
          </ScrollView>
        );
      })()}
    </ScreenContent>
  );
}

function CollectionItem({
  collection,
  onPress,
}: {
  collection: DataTypeWithID<'collection'>;
  onPress: () => void;
}) {
  const { db } = useDB();
  const [itemsCount, setItemsCount] = useState<number | null>(null);
  const loadItemsCount = useCallback(async () => {
    const results = await db.query(
      function (doc: any, emit: any) {
        emit(doc?.data?.collection);
      },
      { startkey: collection.id, endkey: collection.id, include_docs: false },
    );
    setItemsCount(results.rows.length);
  }, [collection.id, db]);

  useEffect(() => {
    loadItemsCount();
  }, [loadItemsCount]);

  return (
    <InsetGroup.Item
      key={collection.id}
      arrow
      vertical
      label={collection.name}
      leftElement={
        <Icon
          name={collection.iconName as IconName}
          color={collection.iconColor as IconColor}
          size={20}
        />
      }
      labelTextStyle={styles.collectionItemLabelText}
      detailTextStyle={styles.collectionItemDetailText}
      onPress={onPress}
      detail={[
        collection.collectionReferenceNumber,
        itemsCount !== null && `${itemsCount} items`,
      ]
        .filter(s => s)
        .join(' | ')}
    />
  );
}

const styles = StyleSheet.create({
  collectionItemLabelText: { fontSize: 16 },
  collectionItemDetailText: { fontSize: 12 },
});

export default CollectionsScreen;
