import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  LayoutAnimation,
  RefreshControl,
  ScrollView,
  Text,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

import { diff } from 'deep-object-diff';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useDB from '@app/hooks/useDB';
import useLogger from '@app/hooks/useLogger';
import { usePersistedState } from '@app/hooks/usePersistedState';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

export const DEFAULT_SEARCH_FIELDS = {
  id: 5,
  name: 5,
  'data.name': 5,
  value: 5,
  'data.value': 5,
  notes: 1,
  'data.notes': 1,
};
export const DEFAULT_SEARCH_LANGUAGES = ['zh', 'en'];

const LAYOUT_ANIMATION_CONFIG = {
  ...LayoutAnimation.Presets.easeInEaseOut,
  duration: 100,
};

function PouchDBScreen({
  navigation,
}: StackScreenProps<StackParamList, 'PouchDB'>) {
  const logger = useLogger('PouchDBScreen');
  const { db } = useDB();
  const rootNavigation = useRootNavigation();

  const numberOfItemsPerPageList = [5, 10, 20, 50];
  const [perPage, setPerPage] = React.useState(numberOfItemsPerPageList[1]);
  const [page, setPage] = React.useState<number>(1);

  const [searchText, setSearchText] = useState('');
  const searchTextRef = useRef(searchText);
  searchTextRef.current = searchText;
  const [searchFields, setSearchFields] = usePersistedState<
    Record<string, number> | Array<string>
  >('PouchDBScreen_searchFields', DEFAULT_SEARCH_FIELDS);
  const [searchLanguages, setSearchLanguages] = usePersistedState<
    Array<string>
  >('PouchDBScreen_searchLanguages', DEFAULT_SEARCH_LANGUAGES);
  const searchOptions = useMemo(
    () => ({
      fields: searchFields,
      language: searchLanguages,
    }),
    [searchFields, searchLanguages],
  );
  const lastSearchOptions = useRef(searchOptions);
  const resetSearchIndex = useCallback(async () => {
    const startAt = new Date().getTime();
    const oldSearchOptions = lastSearchOptions.current;
    const newSearchOptions = searchOptions;
    try {
      await (db as any).search({
        ...oldSearchOptions,
        destroy: true,
      });
      await (db as any).search({
        ...newSearchOptions,
        build: true,
      });
      const endAt = new Date().getTime();
      logger.info('Reset search index done.', {
        details:
          `Time elapsed: ${endAt - startAt}ms.\n\n` +
          JSON.stringify({ oldSearchOptions, newSearchOptions }, null, 2),
      });
    } catch (e) {
      const endAt = new Date().getTime();
      logger.error(e, {
        details:
          `Time elapsed: ${endAt - startAt}ms.\n\n` +
          JSON.stringify({ oldSearchOptions, newSearchOptions }, null, 2),
      });
      throw e;
    }
  }, [db, logger, searchOptions]);
  const resetSearchIndexRef = useRef(resetSearchIndex);
  resetSearchIndexRef.current = resetSearchIndex;
  useEffect(() => {
    if (
      Object.keys(diff(lastSearchOptions.current, searchOptions)).length <= 0
    ) {
      return;
    }

    resetSearchIndex();
    lastSearchOptions.current = searchOptions;
  }, [resetSearchIndex, searchOptions]);

  const [data, setData] = useState<PouchDB.Core.AllDocsResponse<{}> | null>(
    null,
  );
  const totalRows = data ? data.total_rows : 0;
  const numberOfPages = Math.ceil(totalRows / perPage);

  const skip = perPage * (page - 1);
  const limit = perPage;
  const [loading, setLoading] = useState(true);

  const getData = useCallback(async () => {
    if (!db) return;

    setLoading(true);
    try {
      const results = await (searchText
        ? (db as any).search({
            query: searchText,
            ...searchOptions,
            include_docs: true,
            highlighting: true,
            highlighting_pre: '<|\x1fsearch_match\x1f|><|\x1fmatch\x1f|>',
            highlighting_post: '<|\x1fsearch_match\x1f|>',
            skip,
            limit,
          })
        : db.allDocs({ include_docs: true, skip, limit }));
      if (searchTextRef.current === searchText) {
        LayoutAnimation.configureNext(LAYOUT_ANIMATION_CONFIG);
        setData(results);
      }
    } catch (e: any) {
      Alert.alert(e?.message, JSON.stringify(e?.stack));
    } finally {
      if (searchTextRef.current === searchText) {
        setLoading(false);
      }
    }
  }, [db, limit, searchOptions, searchText, skip]);
  useEffect(() => {
    getData();
  }, [getData]);
  useFocusEffect(
    useCallback(() => {
      getData();
    }, [getData]),
  );

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await getData();
    } catch (e: any) {
      Alert.alert('An Error Occurred', e.message);
    } finally {
      setRefreshing(false);
    }
  }, [getData]);

  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  return (
    <ScreenContent
      navigation={navigation}
      title="PouchDB"
      showSearch
      searchHideWhenScrollingIOS={false}
      onSearchChangeText={t => {
        setSearchText(t);
        setPage(1);
        // scrollViewRef.current?.scrollTo({ y: -9999 });
      }}
      action1Label="Put Data"
      action1SFSymbolName="plus.square.fill"
      action1MaterialIconName="square-edit-outline"
      onAction1Press={() => rootNavigation?.navigate('PouchDBPutData', {})}
      action2Label="Index"
      action2SFSymbolName="list.bullet.rectangle.fill"
      action2MaterialIconName="view-list"
      onAction2Press={() => navigation?.navigate('PouchDBIndexes')}
      action3Label="Settings"
      action3SFSymbolName="gearshape.fill"
      action3MaterialIconName="cog"
      onAction3Press={() =>
        navigation?.navigate('PouchDBSettings', {
          searchFields,
          setSearchFields,
          searchLanguages,
          setSearchLanguages,
          resetSearchIndexRef,
        })
      }
    >
      <ScreenContent.ScrollView
        ref={scrollViewRef}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        <UIGroup
          loading={loading}
          footer={
            totalRows
              ? `Showing ${skip + 1}-${Math.max(
                  Math.min(skip + perPage, totalRows),
                  skip + 1,
                )} of ${totalRows}.`
              : undefined
          }
          placeholder="No items to show."
        >
          {data &&
            data.rows.length > 0 &&
            UIGroup.ListItemSeparator.insertBetween(
              data.rows.map(d => (
                <UIGroup.ListItem
                  key={d.id}
                  label={d.id}
                  // eslint-disable-next-line react/no-unstable-nested-components
                  detail={({ textProps }) => {
                    const { score, highlighting } = d as any;
                    if (highlighting) {
                      const matches = Object.values((d as any).highlighting)
                        .map(s => (s as string).replace(/\n/gm, ' '))
                        .map(v =>
                          (v as string)
                            .split('<|\x1fsearch_match\x1f|>')
                            .map(s =>
                              s.startsWith('<|\x1fmatch\x1f|>') ? (
                                <Text style={commonStyles.fwBold}>
                                  {s.slice('<|\x1fmatch\x1f|>'.length)}
                                </Text>
                              ) : (
                                <Text>{s}</Text>
                              ),
                            ),
                        )
                        .map(ts => [<Text>"</Text>, ...ts, <Text>"</Text>])
                        .flatMap(ts => [...ts, <Text>, </Text>])
                        .slice(0, -1);
                      return (
                        <Text {...textProps} numberOfLines={2}>
                          Score: {score.toFixed(5)} ({matches}), doc:{' '}
                          {JSON.stringify(d.doc)}
                        </Text>
                      );
                    }

                    return <Text {...textProps}>{JSON.stringify(d.doc)}</Text>;
                  }}
                  verticalArrangedIOS
                  navigable
                  onPress={() => navigation.push('PouchDBItem', { id: d.id })}
                />
              )),
            )}
        </UIGroup>

        <UIGroup footer={`Skip: ${skip}, limit: ${limit}.`}>
          <UIGroup.ListTextInputItem
            label="Page"
            horizontalLabel
            keyboardType="number-pad"
            returnKeyType="done"
            value={page.toString()}
            unit={`/ ${numberOfPages}`}
            onChangeText={t => {
              const n = parseInt(t, 10);
              if (isNaN(n)) return;
              if (n <= 0) return;

              setPage(n);
            }}
            selectTextOnFocus
            rightElement={
              <>
                <UIGroup.ListTextInputItem.Button
                  onPress={() =>
                    setPage(i => {
                      if (i <= 1) return i;
                      if (i > numberOfPages) return numberOfPages;
                      return i - 1;
                    })
                  }
                  disabled={page <= 1}
                >
                  ‹ Prev
                </UIGroup.ListTextInputItem.Button>
                <UIGroup.ListTextInputItem.Button
                  onPress={() => setPage(i => i + 1)}
                  disabled={page >= numberOfPages}
                >
                  Next ›
                </UIGroup.ListTextInputItem.Button>
              </>
            }
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Per Page"
            horizontalLabel
            keyboardType="number-pad"
            returnKeyType="done"
            value={perPage.toString()}
            onChangeText={t => {
              const n = parseInt(t, 10);
              if (isNaN(n)) return;
              if (n <= 0) return;

              setPerPage(n);
            }}
            selectTextOnFocus
            rightElement={
              <>
                {numberOfItemsPerPageList.map((n, i) => (
                  <UIGroup.ListTextInputItem.Button
                    key={i}
                    onPress={() => setPerPage(n)}
                  >
                    {n.toString()}
                  </UIGroup.ListTextInputItem.Button>
                ))}
              </>
            }
            {...kiaTextInputProps}
          />
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default PouchDBScreen;
