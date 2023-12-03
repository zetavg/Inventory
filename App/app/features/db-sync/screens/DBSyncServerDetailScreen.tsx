import React, { useCallback, useState } from 'react';
import {
  Alert,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import ScreenContent from '@app/components/ScreenContent';
import ScreenContentScrollView from '@app/components/ScreenContentScrollView';
import TimeAgo from '@app/components/TimeAgo';
import UIGroup from '@app/components/UIGroup';

const DATE_DISPLAY_TYPES = ['time_ago', 'locale', 'unix'] as const;

/* eslint-disable react/no-unstable-nested-components */

function DBSyncServerDetailScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'DBSyncServerDetail'>) {
  const rootNavigation = useRootNavigation();
  const dispatch = useAppDispatch();
  const servers = useAppSelector(selectors.dbSync.servers);
  const serverStatuses = useAppSelector(selectors.dbSync.serverStatuses);
  const currentProfileUuid = useAppSelector(
    selectors.profiles.currentProfileUuid,
  );
  const { id } = route.params;
  const server = servers[id];

  const [lastSyncAtDisplayType, setLastSyncAtDisplayType] =
    useState<(typeof DATE_DISPLAY_TYPES)[number]>('time_ago');
  const rotateLastSyncAtDisplayType = useCallback(() => {
    setLastSyncAtDisplayType(type => {
      const currentIndex = DATE_DISPLAY_TYPES.indexOf(type);
      const nextIndex = (currentIndex + 1) % DATE_DISPLAY_TYPES.length;
      return DATE_DISPLAY_TYPES[nextIndex];
    });
  }, []);

  const [showAdvancedStatus, setShowAdvancedStatus] = useState(false);

  return (
    <ScreenContent
      navigation={navigation}
      title={server?.name || 'Server Detail'}
      headerLargeTitle={false}
    >
      <ScreenContentScrollView>
        <UIGroup.FirstGroupSpacing />
        {(() => {
          if (!server)
            return (
              <UIGroup placeholder="No such server. Maybe this server has been removed recently." />
            );

          const serverStatus = serverStatuses[id] || {};

          return (
            <>
              <UIGroup>
                <UIGroup.ListItem label="Status" detail={serverStatus.status} />
                <UIGroup.ListItemSeparator />
                <UIGroup.ListItem
                  label="Last Synced"
                  adjustsDetailFontSizeToFit
                  detail={({ textProps }) => (
                    <TouchableWithoutFeedback
                      onPress={rotateLastSyncAtDisplayType}
                    >
                      <View>
                        {(() => {
                          if (!serverStatus.lastSyncedAt) {
                            return <Text {...textProps}>N/A</Text>;
                          }

                          switch (lastSyncAtDisplayType) {
                            case 'time_ago':
                              return (
                                <TimeAgo
                                  date={serverStatus.lastSyncedAt}
                                  textProps={textProps}
                                />
                              );
                            case 'locale':
                              return (
                                <Text {...textProps}>
                                  {new Date(
                                    serverStatus.lastSyncedAt,
                                  ).toLocaleString()}
                                </Text>
                              );
                            case 'unix':
                              return (
                                <Text
                                  {...textProps}
                                  style={[
                                    textProps.style,
                                    commonStyles.fontMonospaced,
                                  ]}
                                >
                                  {serverStatus.lastSyncedAt}
                                </Text>
                              );
                            default: {
                              const unhandledCase: never =
                                lastSyncAtDisplayType;
                              return (
                                <Text {...textProps}>
                                  Unhandled: {unhandledCase}
                                </Text>
                              );
                            }
                          }
                        })()}
                      </View>
                    </TouchableWithoutFeedback>
                  )}
                />
                {(() => {
                  if (serverStatus.lastErrorMessage) {
                    return (
                      <>
                        <UIGroup.ListItemSeparator />
                        <UIGroup.ListTextInputItem
                          label="Last Error Message"
                          value={serverStatus.lastErrorMessage}
                          multiline
                          showSoftInputOnFocus={false}
                        />
                      </>
                    );
                  }

                  return null;
                })()}
              </UIGroup>
              <UIGroup header="Info">
                <UIGroup.ListItem
                  label="URI"
                  detail={server.uri}
                  // detailTextStyle={UIGroup.ListItem.styles.iosSmallFont}
                  adjustsDetailFontSizeToFit
                />
                <UIGroup.ListItemSeparator />
                <UIGroup.ListItem
                  label="Username"
                  detail={server.username}
                  // detailTextStyle={UIGroup.ListItem.styles.iosSmallFont}
                  adjustsDetailFontSizeToFit
                />
              </UIGroup>
              <UIGroup
                footer={
                  server.enabled
                    ? undefined
                    : 'Syncing will be paused for this server.'
                }
              >
                <UIGroup.ListItem
                  label="Enable Server"
                  detail={
                    <UIGroup.ListItem.Switch
                      value={server.enabled}
                      onValueChange={value => {
                        dispatch(
                          actions.dbSync.updateServer([id, { enabled: value }]),
                        );
                      }}
                    />
                  }
                />
              </UIGroup>
              <UIGroup>
                <UIGroup.ListItem
                  label="Edit Server..."
                  button
                  onPress={() =>
                    rootNavigation?.push('DBSyncNewOrEditServerModal', { id })
                  }
                />
                <UIGroup.ListItemSeparator />
                <UIGroup.ListItem
                  label="Remove Server"
                  button
                  destructive
                  onPress={() => {
                    Alert.alert(
                      `Remove server "${server.name}"?`,
                      `Are you sure you want to remove the server "${server.name}" (${server.uri})?\nData will no longer be synced with this server after removal.`,
                      [
                        {
                          text: 'Do not remove',
                          style: 'cancel',
                          onPress: () => {},
                        },
                        {
                          text: 'Confirm Remove',
                          style: 'destructive',
                          onPress: () => {
                            dispatch(actions.dbSync.deleteServer(id));
                          },
                        },
                      ],
                    );
                  }}
                />
              </UIGroup>
              <UIGroup>
                <UIGroup.ListItem
                  label="Docs"
                  detail={`${
                    typeof serverStatus.localDBDocCount === 'number'
                      ? serverStatus.localDBDocCount
                      : '?'
                  }/${
                    typeof serverStatus.remoteDBDocCount === 'number'
                      ? serverStatus.remoteDBDocCount
                      : '?'
                  }`}
                />
                <UIGroup.ListItemSeparator />
                {!showAdvancedStatus ? (
                  <UIGroup.ListItem
                    label="Show Advanced Status"
                    onPress={() => setShowAdvancedStatus(true)}
                    button
                  />
                ) : (
                  <>
                    <UIGroup.ListItem
                      label="Push Sequence"
                      adjustsDetailFontSizeToFit
                      detail={
                        typeof serverStatus.pushLastSeq === 'number'
                          ? `${serverStatus.pushLastSeq}/${serverStatus.localDBUpdateSeq}`
                          : 'N/A'
                      }
                    />
                    <UIGroup.ListItemSeparator />
                    <UIGroup.ListItem
                      label="Pull Sequence"
                      adjustsDetailFontSizeToFit
                      detail={
                        typeof serverStatus.pullLastSeq === 'number'
                          ? `${serverStatus.pullLastSeq}/${serverStatus.remoteDBUpdateSeq}`
                          : 'N/A'
                      }
                    />
                  </>
                )}
              </UIGroup>
              <UIGroup>
                <UIGroup.ListItem
                  label="View Logs"
                  navigable
                  onPress={() =>
                    navigation?.push('AppLogs', {
                      title: `${server.name} Logs`,
                      headerLargeTitle: false,
                      showOptions: false,
                      filter: {
                        module: 'DBSyncManager',
                        function: id,
                        user: currentProfileUuid,
                      },
                    })
                  }
                />
              </UIGroup>
            </>
          );
        })()}
      </ScreenContentScrollView>
    </ScreenContent>
  );
}

export default DBSyncServerDetailScreen;
