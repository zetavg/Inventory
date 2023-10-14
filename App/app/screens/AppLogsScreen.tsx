import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

import { getLogs, getLogsDBErrors, Log } from '@app/logger';
import { LOG_LEVELS, LogLevel } from '@app/logger/types';

import timeAgo from '@app/utils/timeAgo';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useColors from '@app/hooks/useColors';

import ScreenContent from '@app/components/ScreenContent';
import TimeAgo from '@app/components/TimeAgo';
import UIGroup from '@app/components/UIGroup';
import UIGroupPaginator from '@app/components/UIGroupPaginator';

function AppLogsScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'AppLogs'>) {
  const rootNavigation = useRootNavigation();
  const {
    filter,
    title = 'Logs',
    headerLargeTitle = true,
    showOptions = true,
  } = route.params || {};

  const [perPage, setPerPage] = React.useState(50);
  const [page, setPage] = React.useState<number>(1);
  const [filterLevels, setFilterLevels] = useState<ReadonlyArray<LogLevel>>([]);
  const [filterModule, setFilterModule] = useState<string | undefined>(
    filter?.module,
  );
  const [filterFunction, setFilterFunction] = useState<string | undefined>(
    filter?.function,
  );
  const [filterUser, setFilterUser] = useState<string | undefined>(
    filter?.user,
  );

  const [searchText, setSearchText] = useState('');

  const [logs, setLogs] = useState<ReadonlyArray<Log> | null>(null);
  const [logsCount, setLogsCount] = useState(0);
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
        levels: filterLevels,
        module: filterModule || undefined,
        function: filterFunction || undefined,
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
  }, [
    filterModule,
    filterFunction,
    filterLevels,
    filterUser,
    limit,
    offset,
    searchText,
  ]);
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
        return colors.gray;
      case 'log':
        return colors.gray;
      case 'success':
        return colors.green;
      case 'warn':
        return colors.yellow;
      case 'error':
        return colors.red;
      default: {
        const s: never = level; // If this line has type error, that means we have unhandled cases!
        throw new Error(`Unknown level ${s}`);
      }
    }
  };

  const logsDBErrors = getLogsDBErrors();

  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  const screenContentActionsProps = useMemo(
    () =>
      showOptions
        ? {
            action1Label: 'Filter',
            action1SFSymbolName: 'line.3.horizontal.decrease.circle',
            action1MaterialIconName: 'filter',
            onAction1Press: () => {
              rootNavigation?.push('AppLogsFilter', {
                initialState: {
                  levels: filterLevels.length === 0 ? LOG_LEVELS : filterLevels,
                  module: filterModule,
                  function: filterFunction,
                  user: filterUser,
                },
                selections: {
                  module: logs
                    ?.map(l => l.module)
                    .filter((s): s is string => !!s)
                    .filter((v, i, a) => a.indexOf(v) === i),
                  function: logs
                    ?.map(l => l.function)
                    .filter((s): s is string => !!s)
                    .filter((v, i, a) => a.indexOf(v) === i),
                  user: logs
                    ?.map(l => l.user)
                    .filter((s): s is string => !!s)
                    .filter((v, i, a) => a.indexOf(v) === i),
                },
                callback: ({ levels, module, function: fn, user }) => {
                  if (levels.length >= LOG_LEVELS.length) {
                    setFilterLevels([]);
                  } else {
                    setFilterLevels(levels);
                  }
                  setFilterModule(module);
                  setFilterFunction(fn);
                  setFilterUser(user);
                },
              });
            },
            action2Label: 'Settings',
            action2SFSymbolName: 'gearshape.fill',
            action2MaterialIconName: 'cog',
            onAction2Press: () => {
              navigation.push('AppLogsSettings');
            },
            action3Label: 'Log (Test)',
            action3SFSymbolName: 'text.badge.plus',
            action3MaterialIconName: 'playlist-plus',
            onAction3Press: () => {
              navigation.push('LoggerLog');
            },
          }
        : {},
    [
      filterFunction,
      filterLevels,
      filterModule,
      filterUser,
      logs,
      navigation,
      rootNavigation,
      showOptions,
    ],
  );

  return (
    <ScreenContent
      navigation={navigation}
      title={title}
      headerLargeTitle={headerLargeTitle}
      showSearch
      onSearchChangeText={setSearchText}
      {...screenContentActionsProps}
    >
      <ScreenContent.ScrollView
        ref={scrollViewRef}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <UIGroup.FirstGroupSpacing />
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
        {(() => {
          if (!showOptions) return null;
          if (
            filterLevels.length > 0 ||
            filterModule ||
            filterFunction ||
            filterUser
          ) {
            return (
              <UIGroup>
                <UIGroup.ListItem
                  button
                  label="Clear Filters"
                  onPress={() => {
                    setFilterLevels([]);
                    setFilterModule(undefined);
                    setFilterFunction(undefined);
                    setFilterUser(undefined);
                  }}
                />
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
                <View
                  key={i}
                  style={[
                    styles.logListItemContainer,
                    {
                      borderLeftColor: levelColor(log.level),
                    },
                  ]}
                >
                  <UIGroup.ListItem
                    label={log.message}
                    // eslint-disable-next-line react/no-unstable-nested-components
                    detail={({ textProps }) => (
                      <Text {...textProps}>
                        {[
                          (log.module || log.function) &&
                            `[${[log.module, log.function]
                              .filter(s => s)
                              .join('/')}]`,
                          log.timestamp && (
                            <TimeAgo key="timeago" date={log.timestamp} />
                          ),
                        ]
                          .filter(d => d)
                          .flatMap(e => [e, ' '])
                          .slice(0, -1)}
                      </Text>
                    )}
                    verticalArrangedIOS
                    navigable
                    labelTextStyle={styles.smallText}
                    detailTextStyle={styles.smallText}
                    onPress={() => navigation.push('AppLogDetail', { log })}
                  />
                </View>
              )),
            )}
        </UIGroup>

        <UIGroupPaginator
          perPage={perPage}
          page={page}
          numberOfPages={numberOfPages}
          setPerPage={setPerPage}
          setPage={setPage}
          footer={`Offset: ${offset}, limit: ${limit}.`}
          textInputProps={kiaTextInputProps}
        />
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

const styles = StyleSheet.create({
  logListItemContainer: {
    borderLeftWidth: 4,
  },
  smallText: {
    fontSize: 12,
  },
});

export default AppLogsScreen;
