import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import { useAppSelector, useAppDispatch } from '@app/redux';

import useDB from '@app/hooks/useDB';
import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';
import useColors from '@app/hooks/useColors';

import formatDate from '@app/utils/formatDate';
import cs from '@app/utils/commonStyles';

import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';
import Text from '@app/components/Text';

import { selectConfig } from '../../config/selectors';
import { selectSettings } from '../selectors';
import { setDisabled, setLoggingEnabled } from '../settingsSlice';
import useOverallDBSyncStatus from '../../hooks/useOverallDBSyncStatus';
import { useFocusEffect } from '@react-navigation/native';

import { DBSyncLog } from '@app/db/types';
import commonStyles from '@app/utils/commonStyles';

function PouchDBSyncLogsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'PouchDBSyncLogs'>) {
  const rootNavigation = useRootNavigation();

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  const dispatch = useAppDispatch();
  const syncTargets = useAppSelector(selectConfig) || {};
  const syncSettings = useAppSelector(selectSettings) || {};

  const [overallDBSyncStatus, overallDBSyncStatusDetail] =
    useOverallDBSyncStatus();

  const hasConfig = Object.keys(syncTargets).length > 0;

  const { logsDB } = useDB();
  const numberOfItemsPerPageList = [5, 10, 20, 50, 100];
  const [perPage, setPerPage] = React.useState(numberOfItemsPerPageList[4]);
  const [page, setPage] = React.useState<number>(0);

  const [data, setData] = useState<PouchDB.Find.FindResponse<DBSyncLog> | null>(
    null,
  );
  // const totalRows = data ? data.total_rows : 0;
  // const numberOfPages = Math.ceil(totalRows / perPage);

  const skip = perPage * page;
  const limit = perPage;
  const [loading, setLoading] = useState(true);

  const getData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await logsDB.find({
        selector: {
          $and: [{ type: 'db_sync' }, { timestamp: { $gt: true } }],
        },
        sort: [{ timestamp: 'desc' }],
        skip,
        limit,
      });
      setData(results);
    } catch (e: any) {
      Alert.alert(e?.message);
    } finally {
      setLoading(false);
    }
  }, [limit, logsDB, skip]);
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
    } catch (e) {
      // Should already be handled by getData()
    } finally {
      setRefreshing(false);
    }
  }, [getData]);

  const colors = useColors();

  return (
    <ScreenContent
      navigation={navigation}
      title="CouchDB Sync Logs"
      headerLargeTitle={false}
    >
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <InsetGroup style={cs.mt12}>
          {loading && !refreshing ? (
            <View
              style={[
                commonStyles.centerChildren,
                commonStyles.flex1,
                { height: 100 },
              ]}
            >
              <Text>Loading...</Text>
            </View>
          ) : (
            (data?.docs || [])
              .flatMap(doc => [
                <InsetGroup.Item
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: (() => {
                      if (doc.event === 'paused' || doc.event === 'active') {
                        return 'transparent';
                      }
                      if (doc.ok === true) return colors.green;
                      if (doc.ok === false) return colors.pink;
                      return 'transparent';
                    })(),
                    paddingLeft: InsetGroup.ITEM_PADDING_HORIZONTAL - 4,
                  }}
                  vertical
                  compactLabel
                  key={doc._id}
                  label={`${doc.live ? '[live]' : ''}[${doc.event}] ${
                    (doc as any).raw
                  }`}
                  detail={`${formatDate(new Date(doc.timestamp))}${
                    doc.server === '_all' ? '' : `·${doc.server}`
                  }`}
                  onPress={() =>
                    navigation.push('GenericTextDetails', {
                      details: JSON.stringify(doc, null, 2),
                    })
                  }
                />,
                <InsetGroup.ItemSeperator key={`s-${doc?._id}`} />,
              ])
              .slice(0, -1)
          )}
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default PouchDBSyncLogsScreen;
