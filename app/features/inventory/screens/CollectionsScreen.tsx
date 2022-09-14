import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import { useFocusEffect } from '@react-navigation/native';

import commonStyles from '@app/utils/commonStyles';
import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';
import Icon, { IconColor, IconName } from '@app/components/Icon';
import EditingListView from '@app/components/EditingListView';
import Text from '@app/components/Text';

import useDB from '@app/hooks/useDB';
import { useRelationalData } from '@app/db';
import { DataTypeWithID, del } from '@app/db/relationalUtils';
import useOrderedData from '@app/hooks/useOrderedData';

import moveItemInArray from '@app/utils/moveItemInArray';

function CollectionsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Collections'>) {
  const rootNavigation = useRootNavigation();

  const { db } = useDB();
  const { data, reloadData } = useRelationalData('collection');
  const { orderedData, reloadOrder, updateOrder } = useOrderedData({
    data,
    settingName: 'collections',
  });

  const [reloadCounter, setReloadCounter] = useState(0);
  useFocusEffect(
    useCallback(() => {
      reloadOrder();
      reloadData();
      setReloadCounter(v => v + 1);
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
  const handleItemDelete = useCallback(
    async (index: number) => {
      const id = newOrder[index];
      try {
        await del(db, 'collection', id);
      } catch (e: any) {
        Alert.alert('Alert', e.message);
      } finally {
        await reloadData();
        setEditingListViewKey(v => v + 1);
      }
    },
    [db, newOrder, reloadData],
  );

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
      // TODO: Not supported on Android yet, still need to implement the EditingListView
      // on Android
      action2SFSymbolName={
        orderedData && orderedData.length && !editing
          ? 'list.bullet.indent'
          : undefined
      }
      onAction2Press={
        orderedData && orderedData.length > 0 && !editing
          ? () => startEdit()
          : undefined
      }
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
                (orderedData.length > 0 ? (
                  orderedData
                    .flatMap(collection => [
                      <CollectionItem
                        key={collection.id}
                        reloadCounter={reloadCounter}
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
                        // leftInset={50}
                        leftInset={60}
                      />,
                    ])
                    .slice(0, -1)
                ) : (
                  <Text style={styles.emptyText}>
                    You do not have any collections yet.
                    {'\n'}
                    Press the add button on the top right to add one.
                  </Text>
                ))}
            </InsetGroup>
          </ScrollView>
        );
      })()}
    </ScreenContent>
  );
}

export function CollectionItem({
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
    const results = await db.query('relational_data_index/by_collection', {
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
          color={collection.iconColor as IconColor}
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
  emptyText: {
    padding: 32,
    paddingVertical: 64,
    opacity: 0.5,
    textAlign: 'center',
  },
  collectionItemIcon: { marginRight: -2 },
  collectionItemLabelText: { fontSize: 16 },
  collectionItemDetailText: { fontSize: 12 },
});

export default CollectionsScreen;
