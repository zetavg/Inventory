import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import { useFocusEffect } from '@react-navigation/native';

import commonStyles from '@app/utils/commonStyles';
import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';
import EditingListView from '@app/components/EditingListView';
import Text from '@app/components/Text';

import useDB from '@app/hooks/useDB';
import { useRelationalData } from '@app/db';
import { del } from '@app/db/old_relationalUtils';
import useOrderedData from '@app/hooks/useOrderedData';

import moveItemInArray from '@app/utils/moveItemInArray';

import CollectionItem from '../components/CollectionItem';

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

  const [searchText, setSearchText] = useState('');
  const filteredAndOrderedData = useMemo(() => {
    if (!orderedData) return orderedData;
    if (!searchText) return orderedData;

    return orderedData.filter(d =>
      `${d.name} ${d.collectionReferenceNumber}`.match(searchText),
    );
  }, [searchText, orderedData]);

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
      showSearch
      onSearchChangeText={setSearchText}
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
                  filteredAndOrderedData &&
                  filteredAndOrderedData.length > 0 ? (
                    filteredAndOrderedData
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
                        <InsetGroup.ItemSeparator
                          key={`s-${collection.id}`}
                          // leftInset={50}
                          leftInset={60}
                        />,
                      ])
                      .slice(0, -1)
                  ) : (
                    <Text style={styles.emptyText}>
                      No matching collection.
                    </Text>
                  )
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

const styles = StyleSheet.create({
  emptyText: {
    padding: 32,
    paddingVertical: 64,
    opacity: 0.5,
    textAlign: 'center',
  },
});

export default CollectionsScreen;
