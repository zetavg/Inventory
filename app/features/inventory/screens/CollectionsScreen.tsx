import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';

import LoadingOverlay from '@app/components/LoadingOverlay';
import EditingListView from '@app/components/EditingListView/EditingListView';
import commonStyles from '@app/utils/commonStyles';
import useOrderedData from '@app/hooks/useOrderedData';
import { useRelationalData } from '@app/db';
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
      action1MaterialIconName={editing ? undefined : 'square-edit-outline'}
      onAction1Press={() =>
        editing
          ? endEdit()
          : rootNavigation?.navigate('RelationalPouchDBSave', {
              type: 'collection',
            })
      }
      action2SFSymbolName={
        orderedData && !editing ? 'square.and.pencil' : undefined
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
                    <InsetGroup.Item
                      key={collection.id}
                      arrow
                      vertical
                      label={collection.name}
                      detail={collection.id}
                      onPress={() =>
                        navigation.push('RelationalPouchDBTypeDataDetail', {
                          type: 'collection',
                          id: collection.id || '',
                          initialTitle: collection.name,
                        })
                      }
                    />,
                    <InsetGroup.ItemSeperator key={`s-${collection.id}`} />,
                  ])
                  .slice(0, -1)}
            </InsetGroup>
          </ScrollView>
        );
      })()}
    </ScreenContent>
  );
}

export default CollectionsScreen;
