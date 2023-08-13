import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  LayoutAnimation,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
// import {
//   useScanBarcodes,
//   BarcodeFormat,
//   scanBarcodes,
//   Barcode,
// } from 'vision-camera-code-scanner';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { runOnJS } from 'react-native-reanimated';
import {
  Camera,
  useCameraDevices,
  useFrameProcessor,
} from 'react-native-vision-camera';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';
import ChecklistItem from '@app/features/inventory/components/ChecklistItem';
import CollectionItem from '@app/features/inventory/components/CollectionItem';
import ItemItem from '@app/features/inventory/components/ItemItem';

import { DataTypeWithAdditionalInfo, onlyValid, useData } from '@app/data';
import { getDatumFromDoc } from '@app/data/pouchdb-utils';

import { DataTypeWithID } from '@app/db/old_relationalUtils';
import { TypeName } from '@app/db/old_schema';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useActionSheet from '@app/hooks/useActionSheet';
import useColors from '@app/hooks/useColors';
import useDB from '@app/hooks/useDB';
import useLogger from '@app/hooks/useLogger';
import { usePersistedState } from '@app/hooks/usePersistedState';
import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import InsetGroup from '@app/components/InsetGroup';
import ScreenContent from '@app/components/ScreenContent';
import Text from '@app/components/Text';
import UIGroup from '@app/components/UIGroup';

import CollectionListItem from '../components/CollectionListItem';
import ItemListItem from '../components/ItemListItem';
import SEARCH_OPTIONS, {
  DEFAULT_SEARCH_LANGUAGES,
} from '../consts/SEARCH_OPTIONS';

const LAYOUT_ANIMATION_CONFIG = {
  ...LayoutAnimation.Presets.easeInEaseOut,
  duration: 100,
};

function SearchScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'Search'>) {
  const logger = useLogger('SearchScreen');
  const { query: queryFromParams } = route.params || {};

  const { db } = useDB();

  const [searchText, setSearchText] = useState('');
  const searchTextRef = useRef(searchText);
  searchTextRef.current = searchText;

  const [data, setData] = useState<
    Array<
      | DataTypeWithAdditionalInfo<'item'>
      | DataTypeWithAdditionalInfo<'collection'>
    >
  >([]);
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
            // highlighting: true,
            // highlighting_pre: '<|\x1fsearch_match\x1f|><|\x1fmatch\x1f|>',
            // highlighting_post: '<|\x1fsearch_match\x1f|>',
            skip: 0,
            limit: 50,
          })
        : { rows: [] });
      if (searchTextRef.current === searchText) {
        const dd = results.rows.map(
          (
            r: any,
          ):
            | DataTypeWithAdditionalInfo<'item'>
            | DataTypeWithAdditionalInfo<'collection'>
            | null => {
            switch (true) {
              case r.id.startsWith('item'): {
                const d = getDatumFromDoc('item', r.doc, logger, {});
                if (d.__valid) return d;
                return null;
              }
              case r.id.startsWith('collection'): {
                const d = getDatumFromDoc('collection', r.doc, logger, {});
                if (d.__valid) return d;
                return null;
              }
              default:
                return null;
            }
          },
        );

        LayoutAnimation.configureNext(LAYOUT_ANIMATION_CONFIG);
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
    getData();
  }, [getData]);
  useFocusEffect(
    useCallback(() => {
      getData();
    }, [getData]),
  );

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
      // onSearchBlur={handleSearchBlur}
      searchHideWhenScrollingIOS={!!queryFromParams}
      searchCanBeClosedAndroid={!!queryFromParams}
      onSearchChangeText={setSearchText}
      // action1Label="Settings"
      // action1SFSymbolName="gearshape.fill"
      // action1MaterialIconName="cog"
      // onAction1Press={() =>
      //   rootNavigation?.push('SearchOptions', {
      //     defaultValue: '',
      //     callback: _ => {},
      //   })
      // }
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
          hasRecentItems || recentViewedItemIds.length > 0 ? (
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
          <UIGroup placeholder="No Results">
            {data.length > 0 &&
              UIGroup.ListItemSeparator.insertBetween(
                data.map(d => {
                  switch (d.__type) {
                    case 'item':
                      return (
                        <ItemListItem
                          key={d.__id}
                          item={d}
                          onPress={() =>
                            navigation.push('Item', { id: d.__id || '' })
                          }
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
                        />
                      );
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

export default SearchScreen;
