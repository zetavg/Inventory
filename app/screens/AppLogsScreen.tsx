import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { ActivityIndicator, DataTable } from 'react-native-paper';

import { getLogs, getLogsDBErrors, Log, logger } from '@app/logger';
import { LOG_SEVERITIES, LogLevel } from '@app/logger/types';

import commonStyles from '@app/utils/commonStyles';
import timeAgo from '@app/utils/timeAgo';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useColors from '@app/hooks/useColors';
import useDB from '@app/hooks/useDB';

import ScreenContent from '@app/components/ScreenContent';
import ScreenContentScrollView from '@app/components/ScreenContentScrollView';
import UIGroup from '@app/components/UIGroup';

function AppLogsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'AppLogs'>) {
  const { db } = useDB();
  const rootNavigation = useRootNavigation();

  const numberOfItemsPerPageList = [20, 50, 100, 500];
  const [perPage, setPerPage] = React.useState(numberOfItemsPerPageList[1]);
  const [page, setPage] = React.useState<number>(1);
  const [filterSeverities, setFilterSeverities] =
    useState<ReadonlyArray<LogLevel>>(LOG_SEVERITIES);
  const [filterModule, setFilterModule] = useState<string | undefined>();
  const [filterUser, setFilterUser] = useState<string | undefined>();

  const [searchText, setSearchText] = useState('');

  const [logs, setLogs] = useState<ReadonlyArray<Log> | null>(null);
  const [logsCount, setLogsCount] = useState(22);
  const numberOfPages = Math.ceil(logsCount / perPage);

  const offset = perPage * (page - 1);
  const limit = perPage;

  const [loading, setLoading] = useState(true);

  const getData = useCallback(async () => {
    setLoading(true);
    try {
      const ls = await getLogs({
        offset,
        limit,
        severities: filterSeverities,
        module: filterModule || undefined,
        user: filterUser || undefined,
        search: searchText,
      });
      setLogs(ls);
      setLogsCount(ls.count || 0);
    } catch (e: any) {
      console.error(e);
      Alert.alert('An Error Occurred', e.message);
    } finally {
      setLoading(false);
    }
  }, [filterModule, filterSeverities, filterUser, limit, offset, searchText]);
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
      console.error(e);
      Alert.alert('An Error Occurred', e.message);
    } finally {
      setRefreshing(false);
    }
  }, [getData]);

  const colors = useColors();

  const levelColor = (level: LogLevel) => {
    switch (level) {
      case 'debug':
        return colors.indigo;
      case 'info':
        return colors.blue;
      case 'log':
        return colors.gray;
      case 'warn':
        return colors.yellow;
      case 'error':
        return colors.red;
      default: {
        const s: never = level;
        throw new Error(`Unknown level ${s}`);
      }
    }
  };

  const logsDBErrors = getLogsDBErrors();

  return (
    <ScreenContent
      navigation={navigation}
      title="Logs"
      showSearch
      onSearchChangeText={setSearchText}
      action1Label="Filter"
      action1SFSymbolName="line.3.horizontal.decrease.circle"
      action1MaterialIconName="filter"
      onAction1Press={() => {
        rootNavigation?.push('AppLogsFilter', {
          initialState: {
            severities: filterSeverities,
            module: filterModule,
            user: filterUser,
          },
          callback: ({ severities, module, user }) => {
            setFilterSeverities(severities);
            setFilterModule(module);
            setFilterUser(user);
          },
        });
      }}
      action2Label="Settings"
      action2SFSymbolName="text.badge.plus"
      action2MaterialIconName="playlist-plus"
      onAction2Press={() => {
        navigation.push('LoggerLog');
      }}
    >
      <ScreenContentScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        {(() => {
          if (
            logsDBErrors &&
            Array.isArray(logsDBErrors) &&
            logsDBErrors.length > 0
          ) {
            return (
              <UIGroup header="Logs Database Errors ⚠">
                {UIGroup.ListItemSeparator.insertBetween(
                  logsDBErrors.map((err, i) => (
                    <UIGroup.ListItem
                      key={i}
                      label={err.message}
                      navigable
                      labelTextStyle={styles.smallText}
                      onPress={() =>
                        navigation.push('AppLogDetail', {
                          log: {
                            level: 'error',
                            message: err.message,
                            stack: err.stack,
                            timestamp: 0,
                          },
                        })
                      }
                    />
                  )),
                )}
              </UIGroup>
            );
          }
        })()}
        <UIGroup
          loading={loading}
          footer={
            logsCount
              ? `Showing ${offset + 1}-${Math.max(
                  Math.min(offset + perPage, logsCount),
                  offset + 1,
                )} of ${logsCount}.`
              : undefined
          }
          placeholder="No items to show."
        >
          {logs &&
            logs.length > 0 &&
            UIGroup.ListItemSeparator.insertBetween(
              logs.map((log, i) => (
                <UIGroup.ListItem
                  key={i}
                  label={log.message}
                  detail={[
                    log.module && `[${log.module}]`,
                    log.timestamp && timeAgo.format(log.timestamp),
                  ]
                    .filter(d => d)
                    .join(' ')}
                  verticalArrangedIOS
                  navigable
                  labelTextStyle={styles.smallText}
                  detailTextStyle={styles.smallText}
                  onPress={() => navigation.push('AppLogDetail', { log })}
                  style={[
                    styles.logListItem,
                    {
                      borderLeftColor: levelColor(log.level),
                    },
                  ]}
                />
              )),
            )}
        </UIGroup>

        <UIGroup footer={`Offset: ${offset}, limit: ${limit}.`}>
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
          />
        </UIGroup>
      </ScreenContentScrollView>
    </ScreenContent>
  );
}

const styles = StyleSheet.create({
  logListItem: {
    borderLeftWidth: 4,
  },
  smallText: {
    fontSize: 12,
  },
});

export default AppLogsScreen;
