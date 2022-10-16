import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Platform,
  Alert,
  StyleSheet,
  RefreshControl,
  ScrollView,
  View,
  ActionSheetIOS,
  LayoutAnimation,
} from 'react-native';
import {
  Camera,
  useCameraDevices,
  useFrameProcessor,
} from 'react-native-vision-camera';
// import {
//   useScanBarcodes,
//   BarcodeFormat,
//   scanBarcodes,
//   Barcode,
// } from 'vision-camera-code-scanner';
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
import useActionSheet from '@app/hooks/useActionSheet';
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
import { runOnJS } from 'react-native-reanimated';
import { DataTypeWithID } from '@app/db/relationalUtils';
import { TypeName } from '@app/db/schema';

const LAYOUT_ANIMATION_CONFIG = {
  ...LayoutAnimation.Presets.easeInEaseOut,
  duration: 100,
};

function SearchScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'Search'>) {
  const { query: queryFromParams } = route.params || {};

  const { db } = useDB();
  const rootNavigation = useRootNavigation();
  const { showActionSheetWithOptions } = useActionSheet();

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

  const prevSearchText = useRef(searchText);
  const getData = useCallback(async () => {
    if (prevSearchText.current !== searchText) setLoading(true);
    prevSearchText.current = searchText;

    try {
      const results = await (db as any).search({
        ...SEARCH_OPTIONS,
        query: searchText,
      });
      LayoutAnimation.configureNext(LAYOUT_ANIMATION_CONFIG);
      setData(results);
    } catch (e: any) {
      Alert.alert(e?.message, JSON.stringify(e?.stack));
    } finally {
      setLoading(false);
    }
  }, [db, searchText]);

  const [recentData, setRecentData] = useState<null | Array<{
    type: TypeName;
    data: DataTypeWithID<TypeName>;
  }>>(null);
  const loadRecentData = useCallback(async () => {
    try {
      const results = await db.find({
        selector: {
          $and: [{ type: 'item' }, { 'data.updatedAt': { $exists: true } }],
        },
        sort: [{ type: 'desc' }, { 'data.updatedAt': 'desc' }],
        limit: 10,
        use_index: 'index-type-updatedAt',
      });
      const ds = results.docs.map(doc => ({
        type: doc.type,
        data: getDataFromDocs('item', [doc])[0],
      }));
      setRecentData(ds);
    } catch (e) {
      throw e;
    } finally {
    }
  }, [db]);

  const [reloadCounter, setReloadCounter] = useState(0);
  useEffect(() => {
    getData();
    loadRecentData();
  }, [getData, loadRecentData]);
  useFocusEffect(
    useCallback(() => {
      setReloadCounter(v => v + 1);
      getData();
      loadRecentData();
    }, [getData, loadRecentData]),
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

  const [isScanBarcodeMode, setIsScanBarcodeMode] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const devices = useCameraDevices();
  const device = devices.back;
  // const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.QR_CODE], {
  //   checkInverted: true,
  // });
  // const [barcodes, setBarcodes] = useState<Barcode[]>([]);
  // const frameProcessor = useFrameProcessor(frame => {
  //   'worklet';
  //   const detectedBarcodes = scanBarcodes(frame, [BarcodeFormat.QR_CODE]);
  //   runOnJS(setBarcodes)(detectedBarcodes);
  // }, []);

  React.useEffect(() => {
    if (!isScanBarcodeMode) return;
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasCameraPermission(status === 'authorized');
    })();
  }, [isScanBarcodeMode]);

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  return (
    <ScreenContent
      navigation={navigation}
      title={queryFromParams ? queryFromParams : 'Search'}
      showSearch={!queryFromParams}
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
      action2Label="Scan"
      action2SFSymbolName="barcode.viewfinder"
      action2MaterialIconName="barcode-scan"
      onAction2Press={() => setIsScanBarcodeMode(v => !v)}
    >
      <ScrollView
        ref={scrollViewRef}
        // automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {!searchText ? (
          recentSearchQueries.length <= 0 ? (
            <InsetGroup loading={loading} style={commonStyles.mt16}>
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
            <>
              <InsetGroup
                label="Recent Searches"
                labelVariant="large"
                loading={loading}
                labelRight={
                  <InsetGroup.LabelButton
                    title="Clear"
                    onPress={() => {
                      showActionSheetWithOptions(
                        {
                          options: ['Cancel', 'Clear search history'],
                          destructiveButtonIndex: 1,
                          cancelButtonIndex: 0,
                        },
                        buttonIndex => {
                          if (buttonIndex === 0) {
                            // cancel action
                            return;
                          } else if (buttonIndex === 1) {
                            dispatch(clearRecentSearchQueries({}));
                          }
                        },
                      );
                    }}
                  />
                }
                labelContainerStyle={commonStyles.mt16}
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
                      onLongPress={() => {
                        showActionSheetWithOptions(
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
                      }}
                    />,
                    <InsetGroup.ItemSeparator key={`s-${i}`} />,
                  ])
                  .slice(0, -1)}
              </InsetGroup>
              {!!recentData && recentData.length > 0 && (
                <InsetGroup
                  label="Recently Changed"
                  labelVariant="large"
                  labelContainerStyle={commonStyles.mt16}
                >
                  {recentData
                    .flatMap(d => {
                      switch (d.type) {
                        case 'item': {
                          const item: DataTypeWithID<'item'> = d.data as any;
                          return [
                            <ItemItem
                              key={`item-${item.id}`}
                              item={item}
                              arrow
                              onPress={() =>
                                navigation.push('Item', {
                                  id: item.id || '',
                                  initialTitle: item.name,
                                })
                              }
                            />,
                            <InsetGroup.ItemSeparator
                              key={`s-item-${item.id}`}
                              leftInset={60}
                            />,
                          ];
                        }

                        default:
                          return [];
                      }
                    })
                    .slice(0, -1)}
                </InsetGroup>
              )}
            </>
          )
        ) : (
          <InsetGroup
            loading={loading}
            style={[commonStyles.mt16, { minHeight: 0 }]}
          >
            {(() => {
              if (!data || data.rows.length <= 0) {
                if (loading) {
                  return (
                    <Text
                      key="loading"
                      style={[
                        commonStyles.mv80,
                        commonStyles.mh16,
                        commonStyles.tac,
                        commonStyles.opacity05,
                      ]}
                    >
                      {' '}
                    </Text>
                  );
                }
                return (
                  <Text
                    key="no-results"
                    style={[
                      commonStyles.mv80,
                      commonStyles.mh16,
                      commonStyles.tac,
                      commonStyles.opacity05,
                    ]}
                  >
                    No Results
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
                  <InsetGroup.ItemSeparator
                    key={`s-${row.id}`}
                    leftInset={60}
                  />,
                ])
                .slice(0, -1);
            })()}
          </InsetGroup>
        )}
        {isScanBarcodeMode && device != null && hasCameraPermission && (
          <>
            <Camera
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={true}
              // frameProcessor={frameProcessor}
              // frameProcessorFps={5}
            />
            {/*{barcodes.map((barcode, idx) => (
              <Text key={idx}>{barcode.displayValue}</Text>
            ))}*/}
          </>
        )}
      </ScrollView>
    </ScreenContent>
  );
}

export default SearchScreen;
