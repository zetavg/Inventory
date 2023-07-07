import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, Platform, RefreshControl, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useDB from '@app/hooks/useDB';
import useLogger from '@app/hooks/useLogger';
import { usePersistedState } from '@app/hooks/usePersistedState';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

export const DEFAULT_SEARCH_FIELDS = {
  value: 1,
  'data.value': 1,
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
  const [searchFields, setSearchFields] = usePersistedState<
    Record<string, number> | Array<string>
  >('PouchDBScreen_searchFields', DEFAULT_SEARCH_FIELDS);
  const searchOptions = useMemo(
    () => ({
      fields: searchFields,
    }),
    [searchFields],
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
  useEffect(() => {
    if (lastSearchOptions.current === searchOptions) return;

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
            // TODO: support zh searching on Android
            // `language: ['zh', 'en']` will not work well
            // See: patches/pouchdb-quick-search+1.3.0.patch, uncomment `console.log('queryTerms', queryTerms)` and see the tokens got from string
            // language: Platform.OS === 'ios' ? 'zh' : 'en',
            include_docs: true,
            skip,
            limit,
          })
        : db.allDocs({ include_docs: true, skip, limit }));
      setData(results);
    } catch (e: any) {
      Alert.alert(e?.message, JSON.stringify(e?.stack));
    } finally {
      setLoading(false);
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
      onSearchChangeText={setSearchText}
      action1Label="Put Data"
      action1SFSymbolName="plus.square.fill"
      action1MaterialIconName="square-edit-outline"
      onAction1Press={() => rootNavigation?.navigate('PouchDBPutDataModal', {})}
      action2Label="Settings"
      action2SFSymbolName="gearshape.fill"
      action2MaterialIconName="cog"
      onAction2Press={() =>
        navigation?.navigate('PouchDBSettings', {
          searchOptions,
          searchFields,
          setSearchFields,
          resetSearchIndex,
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
                  detail={`${
                    (d as any).score ? `Score: ${(d as any).score}, doc: ` : ''
                  }${JSON.stringify(d.doc)}`}
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
