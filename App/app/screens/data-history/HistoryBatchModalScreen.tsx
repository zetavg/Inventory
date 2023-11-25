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
  ScrollView,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import type { DataHistory, DataTypeName } from '@deps/data/types';

import { getGetHistoriesInBatch, getRestoreHistory } from '@app/data/functions';

import { useDB } from '@app/db';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useActionSheet from '@app/hooks/useActionSheet';
import useLogger from '@app/hooks/useLogger';

import DatumHistoryItem from '@app/components/DatumHistoryItem';
import ModalContent from '@app/components/ModalContent';
import Text from '@app/components/Text';
import UIGroup from '@app/components/UIGroup';

function HistoryBatchModalScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'HistoryBatch'>) {
  const { batch, createdBy, title } = route.params;

  const { db } = useDB();
  const logger = useLogger('HistoryBatchModalScreen');
  const { showActionSheet } = useActionSheet();

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const [histories, setHistories] = useState<Array<DataHistory<DataTypeName>>>(
    [],
  );

  const [isRestoring, setIsRestoring] = useState(false);

  const loadData = useCallback(async () => {
    if (!db) return;
    if (loadingRef.current) return;

    setLoading(true);

    const getHistoriesInBatch = getGetHistoriesInBatch({
      db,
      logger,
    });

    try {
      const returnedHistories = await getHistoriesInBatch(batch, {
        createdBy,
      });

      setHistories(returnedHistories);
    } catch (e) {
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  }, [batch, createdBy, db, logger]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sectionsData = useMemo(() => {
    const groups = {
      items: [] as Array<DataHistory<'item'>>,
      collections: [] as Array<DataHistory<'collection'>>,
      others: [] as Array<DataHistory<DataTypeName>>,
    };

    histories.forEach(history => {
      switch (history.data_type) {
        case 'item': {
          groups.items.push(history as DataHistory<'item'>);
          return;
        }
        case 'collection': {
          groups.collections.push(history as DataHistory<'collection'>);
          return;
        }
        default: {
          groups.others.push(history);
          return;
        }
      }
    });

    return [
      { title: 'Items', data: groups.items },
      { title: 'Collections', data: groups.collections },
      { title: 'Others', data: groups.others },
    ].filter(group => group.data.length > 0);
  }, [histories]);

  const doRestoreChanges = useCallback(
    async (h: DataHistory<DataTypeName>) => {
      if (!db) return;
      setIsRestoring(true);

      // For UI to update
      await new Promise(resolve => setTimeout(resolve, 10));

      const restoreHistory = getRestoreHistory({
        db,
        logger,
      });

      try {
        await restoreHistory(h);

        Alert.alert('Success', 'Changes has been restored successfully.');
      } catch (e) {
        logger.error(e, { showAlert: true });
      } finally {
        setIsRestoring(false);
      }
    },
    [db, logger],
  );

  const restoreChanges = useCallback(
    async (h: DataHistory<DataTypeName>) => {
      Alert.alert(
        'Restore Changes',
        'Are you sure you want to restore this change?',
        [
          {
            text: 'No',
            style: 'cancel',
            isPreferred: false,
          },
          {
            text: 'Yes',
            style: 'destructive',
            isPreferred: true,
            onPress: () => doRestoreChanges(h),
          },
        ],
      );
    },
    [doRestoreChanges],
  );

  const handleItemPress = useCallback(
    (history: DataHistory<DataTypeName>) => {
      showActionSheet([
        {
          name: 'Restore Changes',
          destructive: true,
          onSelect: () => {
            restoreChanges(history);
          },
        },
      ]);
    },
    [restoreChanges, showActionSheet],
  );

  const doRestoreAllChanges = useCallback(async () => {
    if (!db) return;
    setIsRestoring(true);

    // For UI to update
    await new Promise(resolve => setTimeout(resolve, 10));

    const restoreHistory = getRestoreHistory({
      db,
      logger,
    });

    try {
      for (const history of histories) {
        await restoreHistory(history);
      }

      Alert.alert('Success', 'All changes has been restored successfully.');
      navigation.goBack();
    } catch (e) {
      logger.error(e, { showAlert: true });
    } finally {
      setIsRestoring(false);
    }
  }, [db, histories, logger, navigation]);

  const restoreAllChanges = useCallback(async () => {
    Alert.alert(
      'Restore All Changes',
      `Are you sure you want to restore all ${histories.length} changes?`,
      [
        {
          text: 'No',
          style: 'cancel',
          isPreferred: false,
        },
        {
          text: 'Yes',
          style: 'destructive',
          isPreferred: true,
          onPress: doRestoreAllChanges,
        },
      ],
    );
  }, [doRestoreAllChanges, histories.length]);

  return (
    <ModalContent
      navigation={navigation}
      title={isRestoring ? 'Restoring...' : title || 'History'}
      showBackButton={!isRestoring}
    >
      <SectionList
        stickySectionHeadersEnabled={false}
        initialNumToRender={20}
        // eslint-disable-next-line react/no-unstable-nested-components
        ListHeaderComponent={() => <UIGroup.FirstGroupSpacing />}
        sections={
          sectionsData.length > 0
            ? [
                ...sectionsData,
                ...([{ title: '', data: ['restore_all'] }] as any),
              ]
            : ([{ title: '', data: ['null'] }] as any as typeof sectionsData)
        }
        keyExtractor={(b, i) =>
          (b as any) === 'null' ? `null-${i}` : i.toString()
        }
        renderSectionHeader={({ section: { title: t } }) => (
          <UIGroup asSectionHeader header={t} />
        )}
        renderItem={({ item, index, section }) => (
          <UIGroup.ListItem.RenderItemContainer
            isFirst={index === 0}
            isLast={index === section.data.length - 1}
          >
            {(item as any) === 'null' ? (
              <UIGroup
                loading={initialLoading}
                placeholder="No History"
                asPlaceholderContent
              />
            ) : (item as any) === 'restore_all' ? (
              <UIGroup.ListItem
                label="Restore All Changes"
                button
                destructive
                onPress={restoreAllChanges}
                disabled={isRestoring}
              />
            ) : (
              <DatumHistoryItem
                history={item}
                onPress={() => handleItemPress(item)}
              />
            )}
          </UIGroup.ListItem.RenderItemContainer>
        )}
        SectionSeparatorComponent={UIGroup.SectionSeparatorComponent}
        ItemSeparatorComponent={UIGroup.ListItem.ItemSeparatorComponent}
      />
    </ModalContent>
  );
}

export default HistoryBatchModalScreen;
