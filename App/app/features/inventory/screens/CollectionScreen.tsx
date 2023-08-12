import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  RefreshControl,
  Text,
  TouchableWithoutFeedback,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

import {
  verifyIconColorWithDefault,
  verifyIconNameWithDefault,
} from '@app/consts/icons';

import {
  DataTypeWithAdditionalInfo,
  onlyValid,
  useData,
  useRelated,
  useSave,
} from '@app/data';
import { getDatumFromDoc } from '@app/data/pouchdb-utils';

import { useDB } from '@app/db';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useLogger from '@app/hooks/useLogger';
import useOrdered from '@app/hooks/useOrdered';

import Icon from '@app/components/Icon';
import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

import ItemListItem from '../components/ItemListItem';
import SEARCH_OPTIONS from '../consts/SEARCH_OPTIONS';

const LAYOUT_ANIMATION_CONFIG = {
  ...LayoutAnimation.Presets.easeInEaseOut,
  duration: 100,
};

const LAYOUT_ANIMATION_CONFIG_S = {
  ...LayoutAnimation.Presets.easeInEaseOut,
  duration: 200,
};

function CollectionScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'Collection'>) {
  const rootNavigation = useRootNavigation();
  const { id, preloadedTitle } = route.params;

  const logger = useLogger('CollectionScreen');
  const { db } = useDB();

  const {
    data,
    loading: dataLoading,
    reload: reloadData,
    refresh: refreshData,
    refreshing: dataRefreshing,
  } = useData('collection', id);
  // const {
  //   data: items,
  //   loading: itemsLoading,
  //   refresh: refreshItems,
  //   refreshing: itemsRefreshing,
  // } = useRelated(data, 'items', { sort: [{ __created_at: 'asc' }] });
  const [d1, setD1] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setD1(false);
    }, 2);

    return () => {
      clearTimeout(timer);
    };
  }, []);
  const {
    data: items,
    loading: itemsLoading,
    refresh: refreshItems,
    refreshing: itemsRefreshing,
  } = useData(
    'item',
    { collection_id: id, _show_in_collection: true },
    { sort: [{ __created_at: 'asc' }], disable: d1 },
  );
  // const {
  //   data: items,
  //   loading: itemsLoading,
  //   refresh: refreshItems,
  //   refreshing: itemsRefreshing,
  // } = useData(
  //   'item',
  //   { collection_id: id },
  //   { sort: [{ __created_at: 'asc' }] },
  // );

  const [searchText, setSearchText] = useState('');
  const searchTextRef = useRef(searchText);
  searchTextRef.current = searchText;
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<
    Array<DataTypeWithAdditionalInfo<'item'>>
  >([]);
  const loadSearchResults = useCallback(async () => {
    if (!db) return;

    setSearchLoading(true);
    try {
      const results = await (searchText
        ? (db as any).search({
            query: searchText,
            ...SEARCH_OPTIONS,
            filter: function (doc: any) {
              return doc?.type === 'item' && doc?.data?.collection_id === id;
            },
            include_docs: true,
            // highlighting: true,
            // highlighting_pre: '<|\x1fsearch_match\x1f|><|\x1fmatch\x1f|>',
            // highlighting_post: '<|\x1fsearch_match\x1f|>',
            skip: 0,
            limit: 50,
          })
        : { rows: [] });
      if (searchTextRef.current === searchText) {
        const dd = results.rows.map(
          (r: any): DataTypeWithAdditionalInfo<'item'> | null => {
            switch (true) {
              case r.id.startsWith('item'): {
                const d = getDatumFromDoc('item', r.doc, logger, {});
                if (d.__valid) return d;
                return null;
              }
              default:
                return null;
            }
          },
        );

        LayoutAnimation.configureNext(LAYOUT_ANIMATION_CONFIG);
        setSearchResults(dd.filter((d: any) => !!d));
      }
    } catch (e: any) {
      Alert.alert(e?.message, JSON.stringify(e?.stack));
    } finally {
      if (searchTextRef.current === searchText) {
        setSearchLoading(false);
      }
    }
  }, [db, id, logger, searchText]);
  useEffect(() => {
    loadSearchResults();
  }, [loadSearchResults]);
  useFocusEffect(
    useCallback(() => {
      loadSearchResults();
    }, [loadSearchResults]),
  );

  const refreshing = dataRefreshing || itemsRefreshing;
  const [reloadCounter, setReloadCounter] = useState(0);
  const refresh = useCallback(() => {
    refreshData();
    refreshItems();
    setReloadCounter(n => n + 1);
  }, [refreshData, refreshItems]);

  const [orderedItems] = useOrdered(
    items && onlyValid(items),
    data?.__valid ? data.items_order || [] : [],
  );

  const handleAddNewItem = useCallback(
    () =>
      rootNavigation?.push('SaveItem', {
        initialData: {
          collection_id: id,
          icon_name:
            typeof data?.item_default_icon_name === 'string'
              ? data.item_default_icon_name
              : undefined,
        },
        afterSave: item => {
          if (
            item.__id &&
            (item.rfid_tag_epc_memory_bank_contents ||
              item.collection_id !== id)
          ) {
            navigation.push('Item', { id: item.__id });
          }
          refreshItems();
        },
      }),
    [
      data?.item_default_icon_name,
      id,
      navigation,
      refreshItems,
      rootNavigation,
    ],
  );

  const { save } = useSave();
  const handleUpdateItemsOrder = useCallback<
    (
      items: ReadonlyArray<DataTypeWithAdditionalInfo<'item'>>,
    ) => Promise<boolean>
  >(
    async its => {
      if (!data || !data.__valid) return false;

      try {
        await save({
          ...data,
          items_order: its.map(it => it.__id).filter((s): s is string => !!s),
        });
        reloadData();
        return true;
      } catch (e) {
        return false;
      }
    },
    [data, reloadData, save],
  );
  const handleUpdateItemsOrderFnRef = useRef(handleUpdateItemsOrder);
  handleUpdateItemsOrderFnRef.current = handleUpdateItemsOrder;

  const [searchFocused, setSearchFocused] = useState(false);
  const [devModeCounter, setDevModeCounter] = useState(0);

  return (
    <ScreenContent
      navigation={navigation}
      title={
        typeof data?.name === 'string'
          ? data.name
          : preloadedTitle || 'Collection'
      }
      showSearch
      searchPlaceholder="Search Item..."
      onSearchChangeText={setSearchText}
      onSearchFocus={() => {
        LayoutAnimation.configureNext(LAYOUT_ANIMATION_CONFIG_S);
        setSearchFocused(true);
      }}
      onSearchBlur={() => {
        LayoutAnimation.configureNext(LAYOUT_ANIMATION_CONFIG);
        setSearchFocused(false);
      }}
      action1Label="Edit"
      action1SFSymbolName={(data && 'square.and.pencil') || undefined}
      action1MaterialIconName={(data && 'pencil') || undefined}
      onAction1Press={
        data && data.__valid
          ? () =>
              rootNavigation?.navigate('SaveCollection', {
                initialData: data,
              })
          : undefined
      }
      // action2Label={(data && 'Delete') || undefined}
      // action2SFSymbolName={(data && 'trash') || undefined}
      // action2MaterialIconName={(data && 'delete') || undefined}
      // onAction2Press={handleDelete}
    >
      <ScreenContent.ScrollView
        refreshControl={
          <RefreshControl onRefresh={refresh} refreshing={refreshing} />
        }
        automaticallyAdjustKeyboardInsets={false}
      >
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        {!(searchFocused || searchText) && (
          <UIGroup loading={dataLoading}>
            {(() => {
              const collection = data && onlyValid(data);
              if (!collection) return null;

              return (
                <>
                  <TouchableWithoutFeedback
                    onPress={() => {
                      setDevModeCounter(v => v + 1);
                    }}
                  >
                    <UIGroup.ListItem
                      verticalArrangedLargeTextIOS
                      label="Collection Name"
                      detail={collection.name}
                      // eslint-disable-next-line react/no-unstable-nested-components
                      rightElement={({ iconProps }) => (
                        <Icon
                          name={verifyIconNameWithDefault(collection.icon_name)}
                          color={verifyIconColorWithDefault(
                            collection.icon_color,
                          )}
                          {...iconProps}
                        />
                      )}
                    />
                  </TouchableWithoutFeedback>
                  {devModeCounter > 10 && (
                    <>
                      <UIGroup.ListItemSeparator />
                      <UIGroup.ListItem
                        verticalArrangedLargeTextIOS
                        label="ID"
                        monospaceDetail
                        detail={collection.__id}
                      />
                    </>
                  )}
                  <UIGroup.ListItemSeparator />
                  <UIGroup.ListItem
                    verticalArrangedLargeTextIOS
                    label="Reference Number"
                    monospaceDetail
                    detail={collection.collection_reference_number}
                  />
                </>
              );
            })()}
          </UIGroup>
        )}

        {searchText ? (
          <UIGroup
            header="Items"
            largeTitle
            loading={searchLoading}
            placeholder={searchLoading ? undefined : 'No Matched Items'}
          >
            {searchResults &&
              searchResults.length > 0 &&
              UIGroup.ListItemSeparator.insertBetween(
                searchResults.map(item => (
                  <ItemListItem
                    key={item.__id}
                    item={item}
                    reloadCounter={reloadCounter}
                    onPress={() =>
                      navigation.push('Item', {
                        id: item.__id || '',
                      })
                    }
                    hideCollectionDetails
                  />
                )),
                { forItemWithIcon: true },
              )}
          </UIGroup>
        ) : (
          <UIGroup
            header="Items"
            largeTitle
            loading={itemsLoading}
            placeholder={itemsLoading ? undefined : 'No Items'}
            headerRight={
              <>
                {!!orderedItems && (
                  <UIGroup.TitleButton
                    onPress={() =>
                      rootNavigation?.push('OrderItems', {
                        orderedItems,
                        onSaveFunctionRef: handleUpdateItemsOrderFnRef,
                      })
                    }
                  >
                    {({ iconProps }) => (
                      <Icon {...iconProps} name="app-reorder" />
                    )}
                  </UIGroup.TitleButton>
                )}
                <UIGroup.TitleButton primary onPress={handleAddNewItem}>
                  {({ iconProps, textProps }) => (
                    <>
                      <Icon {...iconProps} name="add" />
                      <Text {...textProps}>New Item</Text>
                    </>
                  )}
                </UIGroup.TitleButton>
              </>
            }
          >
            {orderedItems &&
              orderedItems.length > 0 &&
              UIGroup.ListItemSeparator.insertBetween(
                orderedItems.map(item => (
                  <ItemListItem
                    key={item.__id}
                    item={item}
                    reloadCounter={reloadCounter}
                    onPress={() =>
                      navigation.push('Item', {
                        id: item.__id || '',
                      })
                    }
                    hideCollectionDetails
                  />
                )),
                { forItemWithIcon: true },
              )}
          </UIGroup>
        )}
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default CollectionScreen;
