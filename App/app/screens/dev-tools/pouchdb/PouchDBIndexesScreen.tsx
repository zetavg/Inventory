import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, RefreshControl, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

import { getDataTypeSelector } from '@app/data/pouchdb-utils';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useDB from '@app/hooks/useDB';
import useLogger from '@app/hooks/useLogger';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

const DEFAULT_INDEX = {
  index: { fields: ['created_at'] },
};

const DEFAULT_QUERY = {
  selector: {
    ...getDataTypeSelector('collection'),
    created_at: { $exists: true },
  },
  fields: ['_id', 'data.name', 'created_at'],
  sort: [{ created_at: 'asc' }],
};

function PouchDBIndexesScreen({
  navigation,
}: StackScreenProps<StackParamList, 'PouchDBIndexes'>) {
  const logger = useLogger('PouchDBIndexesScreen');
  const { db } = useDB();
  const rootNavigation = useRootNavigation();

  const [indexes, setIndexes] = useState<Array<PouchDB.Find.Index>>([]);
  const [indexLoading, setIndexLoading] = useState(false);
  const loadIndexes = useCallback(async () => {
    setIndexLoading(true);
    try {
      if (!db) throw new Error('DB is not ready.');
      const result = await db.getIndexes();
      setIndexes(result.indexes);
    } catch (e) {
      logger.error(e, { showAlert: true });
    } finally {
      setIndexLoading(false);
    }
  }, [db, logger]);
  useFocusEffect(
    useCallback(() => {
      loadIndexes();
    }, [loadIndexes]),
  );

  const [deleting, setDeleting] = useState(false);
  const handleDeleteAllIndexes = useCallback(() => {
    Alert.alert(
      'Confirmation',
      'Are you sure you want to delete all indexes?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              for (const index of indexes) {
                if (!db) throw new Error('DB is not ready.');
                const { ddoc } = index;
                if (!ddoc) continue;
                await db.deleteIndex({ ...index, ddoc });
              }
            } catch (e) {
              logger.error(e, { showAlert: true });
            } finally {
              setDeleting(false);
              loadIndexes();
            }
          },
        },
      ],
    );
  }, [db, indexes, loadIndexes, logger]);

  const [newIndexJson, setNewIndexJson] = useState(
    JSON.stringify(DEFAULT_INDEX, null, 2),
  );
  const handleCreateIndex = useCallback(async () => {
    if (!db) {
      Alert.alert('DB is not ready');
      return;
    }

    let index: any = {};
    try {
      index = JSON.parse(newIndexJson);
    } catch (e) {
      Alert.alert('Invalid JSON', e instanceof Error ? e.message : '');
    }

    try {
      const result = await db.createIndex(index);
      loadIndexes();
    } catch (e) {
      Alert.alert(
        'An error occurred',
        e instanceof Error ? e.message : JSON.stringify(e),
      );
    }
  }, [db, loadIndexes, newIndexJson]);

  const [queryJson, setQueryJson] = useState(
    JSON.stringify(DEFAULT_QUERY, null, 2),
  );
  const [resultJson, setResultJson] = useState<string | null>(null);

  const handleQuery = useCallback(async () => {
    if (!db) {
      Alert.alert('DB is not ready');
      return;
    }

    let query: any = {};
    try {
      query = JSON.parse(queryJson);
    } catch (e) {
      Alert.alert('Invalid JSON', e instanceof Error ? e.message : '');
    }

    try {
      const result = await db.find(query);
      setResultJson(JSON.stringify(result, null, 2));
    } catch (e) {
      Alert.alert(
        'An error occurred',
        e instanceof Error ? e.message : JSON.stringify(e),
      );
    }
  }, [db, queryJson]);

  const handleExplain = useCallback(async () => {
    if (!db) {
      Alert.alert('DB is not ready');
      return;
    }

    let query: any = {};
    try {
      query = JSON.parse(queryJson);
    } catch (e) {
      Alert.alert('Invalid JSON', e instanceof Error ? e.message : '');
    }

    try {
      const explanation = await (db as any).explain(query);
      setResultJson(JSON.stringify(explanation, null, 2));
    } catch (e) {
      Alert.alert(
        'An error occurred',
        e instanceof Error ? e.message : JSON.stringify(e),
      );
    }
  }, [db, queryJson]);

  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  return (
    <ScreenContent
      navigation={navigation}
      title="PouchDB Indexes"
      headerLargeTitle={false}
    >
      <ScreenContent.ScrollView
        ref={scrollViewRef}
        refreshControl={
          <RefreshControl refreshing={indexLoading} onRefresh={loadIndexes} />
        }
      >
        <UIGroup.FirstGroupSpacing />

        <UIGroup header="Indexes" placeholder="No indexes to show.">
          {indexes.length > 0 &&
            UIGroup.ListItemSeparator.insertBetween(
              indexes.map(index => (
                <UIGroup.ListItem
                  key={index.name}
                  label={index.name}
                  detail={index.def.fields
                    .map(obj => Object.keys(obj).join(', '))
                    .join(', ')}
                  verticalArrangedIOS
                  navigable
                  onPress={() =>
                    navigation.push('PouchDBIndexDetail', { index })
                  }
                />
              )),
            )}
        </UIGroup>

        <UIGroup loading={deleting}>
          <UIGroup.ListItem
            button
            destructive
            label="Delete All Indexes"
            onPress={handleDeleteAllIndexes}
          />
        </UIGroup>

        <UIGroup header="Create Index" largeTitle>
          <UIGroup.ListTextInputItem
            label="Index"
            multiline
            monospaced
            small
            value={newIndexJson}
            onChangeText={setNewIndexJson}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem button label="Create" onPress={handleCreateIndex} />
        </UIGroup>

        <UIGroup header="Explain/Query Index" largeTitle>
          <UIGroup.ListTextInputItem
            label="Query"
            multiline
            monospaced
            small
            value={queryJson}
            onChangeText={setQueryJson}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem button label="Query" onPress={handleQuery} />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem button label="Explain" onPress={handleExplain} />
        </UIGroup>
        <UIGroup>
          <UIGroup.ListTextInputItem
            label="Result"
            multiline
            monospaced
            small
            value={resultJson === null ? '(No results yet)' : resultJson}
            showSoftInputOnFocus={false}
          />
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default PouchDBIndexesScreen;
