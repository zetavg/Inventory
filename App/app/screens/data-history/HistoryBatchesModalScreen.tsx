import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  LayoutAnimation,
  ScrollView,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { getListHistoryBatchesCreatedBy } from '@app/data/functions';

import { useDB } from '@app/db';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useLogger from '@app/hooks/useLogger';

import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

const PAGE_SIZE = 20;

function HistoryBatchesModalScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'HistoryBatches'>) {
  const { createdBy, title } = route.params;

  const { db } = useDB();
  const logger = useLogger('HistoryBatchesModalScreen');

  // const listHistoryBatchesCreatedBy = useMemo(
  //   () => (db ? getListHistoryBatchesCreatedBy({ db, logger }) : null),
  //   [db, logger],
  // );

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const [batches, setBatches] = useState<
    Array<{ batch: number; count?: number }>
  >([]);
  const batchesRef = useRef(batches);
  batchesRef.current = batches;
  const [lastBatchReached, setLastBatchReached] = useState(false);

  const loadData = useCallback(async () => {
    if (!db) return;
    if (loadingRef.current) return;

    setLoading(true);

    const listHistoryBatchesCreatedBy = getListHistoryBatchesCreatedBy({
      db,
      logger,
    });

    try {
      const last = batchesRef.current[batchesRef.current.length - 1]?.batch;
      const returnedBatches = await listHistoryBatchesCreatedBy(createdBy, {
        limit: PAGE_SIZE,
        after: last,
      });

      if (returnedBatches.length <= 0) {
        setLastBatchReached(true);
      }

      setBatches(bs => [...bs, ...returnedBatches]);
    } catch (e) {
      logger.error(e, { showAlert: true });
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  }, [createdBy, db, logger]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sectionsData = useMemo(() => {
    const groups: Record<string, { batch: number; count?: number }[]> = {
      today: [],
      yesterday: [],
      last7Days: [],
      last30Days: [],
      earlier: [],
    };

    // batches.forEach(batch => {
    //   const batchDate = new Date(batch.batch);
    //   const today = new Date();
    //   const yesterday = new Date();
    //   yesterday.setDate(yesterday.getDate() - 1);

    //   if (batchDate.toDateString() === today.toDateString()) {
    //     groups.today.push(batch);
    //   } else if (batchDate.toDateString() === yesterday.toDateString()) {
    //     groups.yesterday.push(batch);
    //   } else if (isWithinDays(batch.batch, 7)) {
    //     groups.last7Days.push(batch);
    //   } else if (isWithinDays(batch.batch, 30)) {
    //     groups.last30Days.push(batch);
    //   } else {
    //     groups.earlier.push(batch);
    //   }
    // });

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    let currentGroup = 'today';

    // Since the data is already sorted
    for (const batch of batches) {
      const batchDate = new Date(batch.batch);

      switch (currentGroup) {
        case 'today':
          if (batchDate.toDateString() === today.toDateString()) {
            groups.today.push(batch);
            continue;
          } else {
            currentGroup = 'yesterday';
          }
        // eslint-disable-next-line no-fallthrough
        case 'yesterday':
          if (batchDate.toDateString() === yesterday.toDateString()) {
            groups.yesterday.push(batch);
            continue;
          } else {
            currentGroup = 'last7Days';
          }
        // eslint-disable-next-line no-fallthrough
        case 'last7Days':
          if (batchDate > last7Days) {
            groups.last7Days.push(batch);
            continue;
          } else {
            currentGroup = 'last30Days';
          }
        // eslint-disable-next-line no-fallthrough
        case 'last30Days':
          if (batchDate > last30Days) {
            groups.last30Days.push(batch);
            continue;
          } else {
            currentGroup = 'earlier';
          }
        // eslint-disable-next-line no-fallthrough
        case 'earlier':
          groups.earlier.push(batch);
          break;
      }
    }

    return [
      { title: 'Today', data: groups.today },
      { title: 'Yesterday', data: groups.yesterday },
      { title: 'Previous 7 Days', data: groups.last7Days },
      { title: 'Previous 30 Days', data: groups.last30Days },
      { title: 'Earlier', data: groups.earlier },
    ].filter(group => group.data.length > 0);
  }, [batches]);

  const onEndReached = () => {
    if (!lastBatchReached) {
      loadData();
    }
  };

  return (
    <ModalContent navigation={navigation} title={title || 'History'}>
      <SectionList
        stickySectionHeadersEnabled={false}
        initialNumToRender={PAGE_SIZE}
        // eslint-disable-next-line react/no-unstable-nested-components
        ListHeaderComponent={() => <UIGroup.FirstGroupSpacing />}
        sections={
          sectionsData.length > 0
            ? sectionsData
            : ([{ title: '', data: ['null'] }] as any as typeof sectionsData)
        }
        keyExtractor={(b, i) =>
          (b as any) === 'null' ? `null-${i}` : b.batch.toString()
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
            ) : (
              <UIGroup.ListItem
                label={new Date(item.batch).toLocaleString()}
                detail={
                  typeof item.count === 'number'
                    ? item.count.toString()
                    : undefined
                }
                navigable
                onPress={() => {
                  navigation.push('HistoryBatch', {
                    createdBy,
                    batch: item.batch,
                  });
                }}
              />
            )}
          </UIGroup.ListItem.RenderItemContainer>
        )}
        SectionSeparatorComponent={UIGroup.SectionSeparatorComponent}
        ItemSeparatorComponent={UIGroup.ListItem.ItemSeparatorComponent}
        onEndReached={onEndReached}
      />
    </ModalContent>
  );
}

const isWithinDays = (timestamp: number, days: number) => {
  const date = new Date(timestamp);
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);
  return date > daysAgo;
};

export default HistoryBatchesModalScreen;
