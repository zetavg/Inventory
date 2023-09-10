import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  RefreshControl,
  ScrollView,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { DEFAULT_LAYOUT_ANIMATION_CONFIG } from '@app/consts/animations';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import { DataTypeWithAdditionalInfo, onlyValid, useData } from '@app/data';
import { getDatumFromDoc } from '@app/data/pouchdb-utils';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useDB from '@app/hooks/useDB';
import useLogger from '@app/hooks/useLogger';

import ScreenContent from '@app/components/ScreenContent';
import Text from '@app/components/Text';
import UIGroup from '@app/components/UIGroup';

import CollectionListItem from '../components/CollectionListItem';
import ItemListItem from '../components/ItemListItem';
import SEARCH_OPTIONS from '../consts/SEARCH_OPTIONS';

type SearchResultItem = {
  highlight: React.ComponentProps<typeof UIGroup.ListItem>['detail'] | null;
  d:
    | DataTypeWithAdditionalInfo<'item'>
    | DataTypeWithAdditionalInfo<'collection'>;
};

function SearchScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'Search'>) {
  const rootNavigation = useRootNavigation();
  const logger = useLogger('SearchScreen');
  const { query: queryFromParams } = route.params || {};

  const { db } = useDB();

  const [searchText, setSearchText] = useState('');
  const searchTextRef = useRef(searchText);
  searchTextRef.current = searchText;

  const [data, setData] = useState<Array<SearchResultItem>>([]);
  const [loading, setLoading] = useState(false);

  const getData = useCallback(async () => {
    if (!db) return;

    setLoading(true);
    try {
      const results = await (searchText
        ? (db as any).search({
            query: searchText,
            ...SEARCH_OPTIONS,
            include_docs: true,
            highlighting: true,
            highlighting_pre: '<|\x1fsearch_match\x1f|><|\x1fmatch\x1f|>',
            highlighting_post: '<|\x1fsearch_match\x1f|>',
            skip: 0,
            limit: 50,
          })
        : { rows: [] });

      if (
        // Prevent outdated request overriding shown results
        searchTextRef.current === searchText
      ) {
        const dd = results.rows.map((r: any): SearchResultItem | null => {
          switch (true) {
            case r.id.startsWith('item'): {
              const d = getDatumFromDoc('item', r.doc, logger, {});
              const [, highlightStr] =
                Object.entries(r.highlighting || {}).filter(([k, v]) => {
                  return ![
                    'data.name',
                    'data._individual_asset_reference',
                    'data.item_reference_number',
                    'data.serial',
                    'data.epc_tag_uri',
                    'data.rfid_tag_epc_memory_bank_contents',
                    'data.actual_rfid_tag_epc_memory_bank_contents',
                  ].includes(k);
                })[0] || [];
              const highlight = getHighlightFromStr(highlightStr);
              if (d.__valid) {
                return { d, highlight };
              }
              return null;
            }
            case r.id.startsWith('collection'): {
              const d = getDatumFromDoc('collection', r.doc, logger, {});
              const [, highlightStr] =
                Object.entries(r.highlighting || {}).filter(([k, v]) => {
                  return ![
                    'data.name',
                    'data.collection_reference_number',
                  ].includes(k);
                })[0] || [];
              const highlight = getHighlightFromStr(highlightStr);
              if (d.__valid) {
                return { d, highlight };
              }
              return null;
            }
            default:
              return null;
          }
        });

        LayoutAnimation.configureNext(DEFAULT_LAYOUT_ANIMATION_CONFIG);
        setData(dd.filter((d: any) => !!d));
      }
    } catch (e: any) {
      Alert.alert(e?.message, JSON.stringify(e?.stack));
    } finally {
      if (searchTextRef.current === searchText) {
        setLoading(false);
      }
    }
  }, [db, logger, searchText]);

  useEffect(() => {
    setLoading(true);
    // Debounce
    const timer = setTimeout(() => {
      getData();
    }, 300);
    return () => {
      clearTimeout(timer);
    };
  }, [getData]);
  // useFocusEffect(
  //   useCallback(() => {
  //     getData();
  //   }, [getData]),
  // );

  const recentViewedItemIds = useAppSelector(
    selectors.inventory.recentViewedItemIds,
  );

  const { data: recentItems, refresh: refreshRecentItems } = useData(
    'item',
    {},
    { limit: 10, sort: [{ __updated_at: 'desc' }] },
  );
  const verifiedRecentItems = recentItems && onlyValid(recentItems);
  const hasRecentItems = verifiedRecentItems && verifiedRecentItems.length > 0;

  const [searchFocused, setSearchFocused] = useState(false);
  const handleSearchFocus = useCallback(() => {
    LayoutAnimation.configureNext(DEFAULT_LAYOUT_ANIMATION_CONFIG);
    setSearchFocused(true);
  }, []);
  const handleSearchBlur = useCallback(() => {
    LayoutAnimation.configureNext(DEFAULT_LAYOUT_ANIMATION_CONFIG);
    setSearchFocused(false);
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await getData();
      refreshRecentItems();
    } catch (e) {
    } finally {
      setRefreshing(false);
    }
  }, [getData, refreshRecentItems]);

  const scrollViewRef = useRef<ScrollView>(null);

  const dispatch = useAppDispatch();

  return (
    <ScreenContent
      navigation={navigation}
      title={queryFromParams ? queryFromParams : 'Search'}
      showSearch={!queryFromParams}
      // searchPlaceholder="Name, reference number, notes..."
      onSearchFocus={handleSearchFocus}
      onSearchBlur={handleSearchBlur}
      searchHideWhenScrollingIOS={!!queryFromParams}
      searchCanBeClosedAndroid={!!queryFromParams}
      onSearchChangeText={setSearchText}
      action1Label="Settings"
      action1SFSymbolName="gearshape.fill"
      action1MaterialIconName="cog"
      onAction1Press={() =>
        rootNavigation?.push('SearchOptions', {
          defaultValue: '',
          callback: _ => {},
        })
      }
      // action2Label="Scan"
      // action2SFSymbolName="barcode.viewfinder"
      // action2MaterialIconName="barcode-scan"
      // onAction2Press={() => setIsScanBarcodeMode(v => !v)}
    >
      <ScreenContent.ScrollView
        ref={scrollViewRef}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        automaticallyAdjustKeyboardInsets={false}
      >
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        {!searchText ? (
          !searchFocused &&
          (hasRecentItems || recentViewedItemIds.length > 0) ? (
            <>
              {recentViewedItemIds.length > 0 && (
                <UIGroup
                  header="Recently Viewed"
                  largeTitle
                  headerRight={
                    <UIGroup.TitleButton
                      onPress={() =>
                        dispatch(actions.inventory.clearRecentViewedItemId())
                      }
                    >
                      Clear
                    </UIGroup.TitleButton>
                  }
                >
                  {UIGroup.ListItemSeparator.insertBetween(
                    recentViewedItemIds
                      .slice(0, 7)
                      .map(id => (
                        <ItemListItemById
                          key={id}
                          id={id}
                          onPress={() => navigation.push('Item', { id })}
                        />
                      )),
                    { forItemWithIcon: true },
                  )}
                </UIGroup>
              )}
              {hasRecentItems && (
                <UIGroup header="Recently Changed" largeTitle>
                  {UIGroup.ListItemSeparator.insertBetween(
                    verifiedRecentItems.map(it => (
                      <ItemListItem
                        key={it.__id}
                        item={it}
                        hideContentDetails
                        onPress={() =>
                          navigation.push('Item', { id: it.__id || '' })
                        }
                      />
                    )),
                    { forItemWithIcon: true },
                  )}
                </UIGroup>
              )}
            </>
          ) : (
            <UIGroup placeholder="Type to start search" />
          )
        ) : (
          <UIGroup
            placeholder={loading ? undefined : 'No Results'}
            loading={loading}
          >
            {data.length > 0 &&
              UIGroup.ListItemSeparator.insertBetween(
                data.map(({ d, highlight }) => {
                  switch (d.__type) {
                    case 'item':
                      return (
                        <ItemListItem
                          key={d.__id}
                          item={d}
                          onPress={() =>
                            navigation.push('Item', { id: d.__id || '' })
                          }
                          additionalDetails={highlight}
                        />
                      );
                    case 'collection':
                      return (
                        <CollectionListItem
                          key={d.__id}
                          collection={d}
                          onPress={() =>
                            navigation.push('Collection', { id: d.__id || '' })
                          }
                          additionalDetails={highlight}
                        />
                      );
                    default:
                      return <UIGroup.ListItem label={JSON.stringify(d)} />;
                  }
                }),
                { forItemWithIcon: true },
              )}
          </UIGroup>
        )}
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

function ItemListItemById({
  id,
  onPress,
}: {
  id: string;
  onPress: () => void;
}) {
  const { data } = useData('item', id);

  if (!data) {
    return (
      <UIGroup.ListItem
        disabled
        label="Loading..."
        icon="cube-outline"
        iconColor="transparent"
      />
    );
  }

  if (!data.__valid) {
    return <UIGroup.ListItem disabled label={id} />;
  }

  return <ItemListItem item={data} onPress={onPress} hideContentDetails />;
}

function getHighlightFromStr(
  highlightStr: unknown,
): SearchResultItem['highlight'] {
  if (typeof highlightStr !== 'string') return undefined;
  const highlight: React.ComponentProps<typeof UIGroup.ListItem>['detail'] =
    highlightStr
      ? ({ textProps }) => (
          <>
            {(highlightStr as string)
              .replace(/\n/gm, ' ')
              .split('<|\x1fsearch_match\x1f|>')
              .map((s, i, arr) =>
                s.startsWith('<|\x1fmatch\x1f|>') ? (
                  <Text
                    {...textProps}
                    style={[textProps.style, commonStyles.fwBold]}
                  >
                    {s.slice('<|\x1fmatch\x1f|>'.length)}
                  </Text>
                ) : (
                  (() => {
                    if (i === 0) {
                      if (s.length > 16) {
                        return '...' + s.slice(s.length - 16);
                      } else {
                        return s;
                      }
                    } else if (i === arr.length - 1) {
                      if (s.length > 8) {
                        return s.slice(0, 8) + '...';
                      } else {
                        return s;
                      }
                    } else {
                      return s;
                    }
                  })()
                ),
              )}
          </>
        )
      : undefined;

  return highlight;
}

export default SearchScreen;
