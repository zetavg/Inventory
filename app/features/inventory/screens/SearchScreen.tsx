import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Platform,
  Alert,
  RefreshControl,
  ScrollView,
  View,
  ActionSheetIOS,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';

import useDB from '@app/hooks/useDB';
import { DBContent } from '@app/db/types';
import { getDataFromDocs } from '@app/db/hooks';

import { useAppSelector, useAppDispatch } from '@app/redux';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';
import useColors from '@app/hooks/useColors';
import commonStyles from '@app/utils/commonStyles';
import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';
import Text from '@app/components/Text';
import ItemItem from '@app/features/inventory/components/ItemItem';
import CollectionItem from '@app/features/inventory/components/CollectionItem';

import {
  addRecentSearchQuery,
  removeRecentSearchQuery,
  clearRecentSearchQueries,
  selectRecentSearchQueries,
} from '../slice';

import SEARCH_OPTIONS from '../consts/SEARCH_OPTIONS';

function SearchScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'Search'>) {
  const { query: queryFromParams } = route.params || {};

  const { db } = useDB();
  const rootNavigation = useRootNavigation();

  const recentSearchQueries = useAppSelector(selectRecentSearchQueries);
  const dispatch = useAppDispatch();

  // const numberOfItemsPerPageList = [5, 10, 20, 50];
  // const [perPage, setPerPage] = React.useState(numberOfItemsPerPageList[1]);
  // const [page, setPage] = React.useState<number>(0);

  const [searchText, setSearchText] = useState(queryFromParams || '');

  const [data, setData] =
    useState<PouchDB.Core.AllDocsResponse<DBContent> | null>(null);
  // const totalRows = data ? data.total_rows : 0;
  // const numberOfPages = Math.ceil(totalRows / perPage);

  // const skip = perPage * page;
  // const limit = perPage;
  const [loading, setLoading] = useState(true);

  const getData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await (db as any).search({
        ...SEARCH_OPTIONS,
        query: searchText,
      });
      setData(results);
    } catch (e: any) {
      Alert.alert(e?.message, JSON.stringify(e?.stack));
    } finally {
      setLoading(false);
    }
  }, [db, searchText]);
  const [reloadCounter, setReloadCounter] = useState(0);
  useEffect(() => {
    getData();
  }, [getData]);
  useFocusEffect(
    useCallback(() => {
      setReloadCounter(v => v + 1);
      getData();
    }, [getData]),
  );

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await getData();
    } catch (e) {
    } finally {
      setRefreshing(false);
    }
  }, [getData]);

  const handleSearchBlur = useCallback(() => {
    dispatch(addRecentSearchQuery({ query: searchText }));
  }, [dispatch, searchText]);

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  return (
    <ScreenContent
      navigation={navigation}
      title={queryFromParams ? queryFromParams : 'Search'}
      showSearch={!queryFromParams}
      onSearchBlur={handleSearchBlur}
      searchHideWhenScrollingIOS={false}
      searchCanBeClosedAndroid={false}
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
    >
      <ScrollView
        ref={scrollViewRef}
        // automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {!searchText ? (
          recentSearchQueries.length <= 0 ? (
            <InsetGroup loading={loading} style={commonStyles.mt8}>
              <Text
                style={[
                  commonStyles.mv80,
                  commonStyles.mh16,
                  commonStyles.tac,
                  commonStyles.opacity05,
                ]}
              >
                Type to start search
              </Text>
            </InsetGroup>
          ) : (
            <InsetGroup
              label="Recent Searches"
              labelVariant="large"
              loading={loading}
              labelRight={
                <InsetGroup.LabelButton
                  title="Clear"
                  onPress={() => dispatch(clearRecentSearchQueries({}))}
                />
              }
              labelContainerStyle={commonStyles.mt8}
            >
              {recentSearchQueries
                .slice(0, 10)
                .flatMap((query, i) => [
                  <InsetGroup.Item
                    key={i}
                    label={query}
                    arrow
                    onPress={() => {
                      // setSearchText(query);
                      navigation.push('Search', { query });
                    }}
                    onLongPress={
                      Platform.OS === 'ios'
                        ? () => {
                            ActionSheetIOS.showActionSheetWithOptions(
                              {
                                options: ['Cancel', 'Remove Item'],
                                destructiveButtonIndex: 1,
                                cancelButtonIndex: 0,
                              },
                              buttonIndex => {
                                if (buttonIndex === 0) {
                                  // cancel action
                                  return;
                                } else if (buttonIndex === 1) {
                                  dispatch(
                                    removeRecentSearchQuery({
                                      query,
                                    }),
                                  );
                                }
                              },
                            );
                          }
                        : undefined
                    }
                  />,
                  <InsetGroup.ItemSeperator key={`s-${i}`} />,
                ])
                .slice(0, -1)}
            </InsetGroup>
          )
        ) : (
          <InsetGroup loading={loading} style={commonStyles.mt8}>
            {(() => {
              if (!data || data.rows.length <= 0) {
                return (
                  <Text
                    style={[
                      commonStyles.mv80,
                      commonStyles.mh16,
                      commonStyles.tac,
                      commonStyles.opacity05,
                    ]}
                  >
                    {loading ? ' ' : 'No Results'}
                  </Text>
                );
              }

              return data.rows
                .flatMap(row => [
                  (() => {
                    switch (row?.doc?.type) {
                      case 'item': {
                        const [item] = getDataFromDocs('item', [row.doc]);
                        return (
                          <ItemItem
                            key={row.id}
                            item={item}
                            reloadCounter={reloadCounter}
                            onPress={() => {
                              dispatch(
                                addRecentSearchQuery({ query: searchText }),
                              );
                              if (!item.id) return;
                              navigation.push('Item', {
                                id: item.id,
                                initialTitle: item.name,
                              });
                            }}
                          />
                        );
                      }

                      case 'collection': {
                        const [collection] = getDataFromDocs('collection', [
                          row.doc,
                        ]);
                        return (
                          <CollectionItem
                            key={row.id}
                            collection={collection}
                            reloadCounter={reloadCounter}
                            onPress={() => {
                              dispatch(
                                addRecentSearchQuery({ query: searchText }),
                              );
                              if (!collection.id) return;
                              navigation.push('Collection', {
                                id: collection.id,
                                initialTitle: collection.name,
                              });
                            }}
                          />
                        );
                      }
                    }

                    return null;
                  })(),
                  <InsetGroup.ItemSeperator
                    key={`s-${row.id}`}
                    leftInset={60}
                  />,
                ])
                .slice(0, -1);
            })()}
          </InsetGroup>
        )}
      </ScrollView>
    </ScreenContent>
  );
}

export default SearchScreen;
