import React, { useCallback, useEffect, useState } from 'react';
import { Alert, LayoutAnimation, RefreshControl } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { ZodError } from 'zod';

import { DEFAULT_LAYOUT_ANIMATION_CONFIG } from '@app/consts/animations';

import { onlyValid, useConfig, useData, useSave } from '@app/data';

import moveItemInArray from '@app/utils/moveItemInArray';

import type { StackParamList } from '@app/navigation';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useLogger from '@app/hooks/useLogger';
import useOrdered from '@app/hooks/useOrdered';

import EditingListView from '@app/components/EditingListView';
import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

import CollectionListItem from '../components/CollectionListItem';

function CollectionsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Collections'>) {
  const logger = useLogger('CollectionsScreen');
  const {
    data,
    reload,
    refresh: refreshData,
    refreshing: dataRefreshing,
  } = useData('collection', {}, { sort: [{ __created_at: 'asc' }] });
  const {
    config,
    updateConfig,
    refresh: refreshConfig,
    refreshing: configRefreshing,
  } = useConfig();
  const { save } = useSave();
  const [orderedData] = useOrdered(
    data && onlyValid(data),
    config?.collections_order || [],
  );

  const [editing, setEditing] = useState(false);
  const [editingWithDelay, setEditingWithDelay] = useState(false);
  useEffect(() => {
    if (!editing) {
      setEditingWithDelay(false);
      return;
    }

    const timer = setTimeout(() => setEditingWithDelay(true), 10);
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

  const startEdit = useCallback(() => {
    if (!orderedData) return null;
    setEditing(true);
  }, [orderedData]);
  const endEdit = useCallback(() => {
    setEditing(false);
  }, []);
  const [editingListViewKey, setEditingListViewKey] = useState(0);
  const handleItemMove = useCallback(
    ({ from, to }: { from: number; to: number }) => {
      if (!editing) return;
      if (!orderedData) return;
      const newOrder = moveItemInArray(
        orderedData.map(d => d.__id || ''),
        from,
        to,
      );
      updateConfig({ collections_order: newOrder });
    },
    [editing, orderedData, updateConfig],
  );
  const handleItemDelete = useCallback(
    async (index: number) => {
      if (!orderedData) return;
      const d = orderedData[index];
      const deleted = await save({
        ...d,
        __deleted: true,
      });
      if (deleted) {
        reload();
      } else {
        // Re-render to make the item appear back in the list
        setEditingListViewKey(n => n + 1);
      }
    },
    [orderedData, reload, save],
  );

  const [searchText, setSearchText] = useState('');
  const dataToShow = searchText
    ? orderedData &&
      orderedData.filter(
        d =>
          d.name.toLowerCase().match(searchText.toLowerCase()) ||
          d.collection_reference_number.match(searchText),
      )
    : orderedData;

  const [refreshCounter, setRefreshCounter] = useState(0);
  const refresh = useCallback(() => {
    refreshData();
    refreshConfig();
    setRefreshCounter(n => n + 1);
  }, [refreshConfig, refreshData]);
  const refreshing = dataRefreshing || configRefreshing;

  const rootNavigation = useRootNavigation();

  return (
    <ScreenContent
      navigation={navigation}
      title="Collections"
      showSearch={!editing}
      searchPlaceholder="Find Collection..."
      onSearchChangeText={text => {
        LayoutAnimation.configureNext(DEFAULT_LAYOUT_ANIMATION_CONFIG);
        setSearchText(text);
      }}
      action1Label={editing ? 'Done' : 'Add'}
      action1SFSymbolName={editing ? undefined : 'plus.square'}
      action1MaterialIconName={editing ? 'check' : 'plus'}
      onAction1Press={() =>
        editing ? endEdit() : rootNavigation?.navigate('SaveCollection', {})
      }
      // TODO: Not supported on Android yet, still need to implement the EditingListView
      // on Android
      action2SFSymbolName={
        orderedData && orderedData.length && !editing
          ? 'pencil.circle'
          : undefined
      }
      action2MaterialIconName={
        orderedData && orderedData.length && !editing
          ? 'circle-edit-outline'
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
              withIOSLargeTitle
              canMove
              canDelete
              editing={editingWithDelay}
              onItemMove={handleItemMove}
              onItemDelete={handleItemDelete}
              key={editingListViewKey}
            >
              {orderedData.map(collection => (
                <EditingListView.Item
                  key={collection.__id}
                  label={collection.name}
                />
              ))}
            </EditingListView>
          );
        }

        return (
          <ScreenContent.ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} />
            }
            automaticallyAdjustKeyboardInsets={false}
          >
            <UIGroup.FirstGroupSpacing iosLargeTitle />
            <UIGroup
              placeholder={
                searchText ? 'No Matched Collections' : 'No Collections'
              }
            >
              {!!dataToShow &&
                dataToShow.length > 0 &&
                UIGroup.ListItemSeparator.insertBetween(
                  dataToShow
                    .map(collection =>
                      collection ? (
                        <CollectionListItem
                          key={collection.__id}
                          collection={collection}
                          reloadCounter={refreshCounter}
                          onPress={() =>
                            navigation.push('Collection', {
                              id: collection.__id || '',
                              preloadedTitle: collection.name,
                            })
                          }
                        />
                      ) : null,
                    )
                    .filter((elem): elem is JSX.Element => !!elem),
                  { forItemWithIcon: true },
                )}
            </UIGroup>
          </ScreenContent.ScrollView>
        );
      })()}
    </ScreenContent>
  );
}

export default CollectionsScreen;
