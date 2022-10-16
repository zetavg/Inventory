import React, { useRef, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import TimeAgo from 'react-native-timeago';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import { useAppSelector, useAppDispatch } from '@app/redux';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import cs from '@app/utils/commonStyles';

import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';
import Switch from '@app/components/Switch';

import { selectConfig } from '../../config/selectors';
import { selectDBSyncStatus, selectSettings } from '../selectors';
import { setDisabled, setLoggingEnabled } from '../settingsSlice';
import useOverallDBSyncStatus from '../../hooks/useOverallDBSyncStatus';
import { reduceServerStatus } from '../utils';

function PouchDBSyncScreen({
  navigation,
}: StackScreenProps<StackParamList, 'PouchDBSync'>) {
  const rootNavigation = useRootNavigation();

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  const dispatch = useAppDispatch();
  const syncTargets = useAppSelector(selectConfig) || {};
  const syncSettings = useAppSelector(selectSettings) || {};

  const syncStatus = useAppSelector(selectDBSyncStatus);

  const [overallDBSyncStatus, overallDBSyncStatusDetail] =
    useOverallDBSyncStatus();

  const hasConfig = Object.keys(syncTargets).length > 0;

  return (
    <ScreenContent
      navigation={navigation}
      title="CouchDB Sync"
      headerLargeTitle={true}
    >
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {hasConfig && (
          <>
            <InsetGroup
              style={cs.mt4}
              footerLabel={
                overallDBSyncStatusDetail.allServersDisabled
                  ? 'All servers are disabled'
                  : undefined
              }
            >
              <InsetGroup.Item
                label="Enable Sync"
                detail={
                  <Switch
                    value={
                      overallDBSyncStatusDetail.allServersDisabled
                        ? false
                        : !syncSettings.disabled
                    }
                    disabled={overallDBSyncStatusDetail.allServersDisabled}
                    onChange={() => {
                      dispatch(setDisabled(!syncSettings.disabled));
                    }}
                  />
                }
              />
            </InsetGroup>
            <InsetGroup label="Servers">
              {Object.entries(syncTargets)
                .flatMap(([name, config]) => {
                  const serverStatus =
                    (syncStatus?.serverStatus || {})[name] || {};
                  const reducedServerStatus = reduceServerStatus(
                    serverStatus,
                    !!(syncSettings.serverSettings || {})[name]?.disabled,
                    !!syncSettings.disabled,
                  );
                  const statusElements = [
                    reducedServerStatus.status && (
                      <Text key="status">{reducedServerStatus.status}</Text>
                    ),
                    reducedServerStatus.lastSyncedAt ? (
                      <Text key="lastSyncedAt">
                        last synced{' '}
                        {<TimeAgo time={reducedServerStatus.lastSyncedAt} />}
                      </Text>
                    ) : null,
                  ]
                    .filter(s => !!s)
                    .flatMap((element, i) => [
                      element,
                      <Text key={`s-${i}`}> · </Text>,
                    ])
                    .slice(0, -1);
                  return [
                    <InsetGroup.Item
                      vertical
                      arrow
                      key={name}
                      label={name}
                      detailAsText
                      detail={
                        (statusElements.length > 0 && statusElements) ||
                        config.db.uri
                      }
                      onPress={() =>
                        navigation.push('PouchDBSyncDetails', {
                          serverName: name,
                        })
                      }
                    />,
                    <InsetGroup.ItemSeparator key={`s-${name}`} />,
                  ];
                })
                .slice(0, -1)}
            </InsetGroup>
          </>
        )}

        <InsetGroup style={hasConfig ? undefined : cs.mt4}>
          <InsetGroup.Item
            button
            label="Add Server"
            onPress={() => rootNavigation?.push('DBSyncConfigUpdate', {})}
          />
        </InsetGroup>

        {hasConfig && (
          <>
            <InsetGroup label="Advanced">
              <InsetGroup.Item
                label="Enable Logging"
                detail={
                  <Switch
                    value={!!syncSettings.loggingEnabled}
                    onChange={() => {
                      dispatch(setLoggingEnabled(!syncSettings.loggingEnabled));
                    }}
                  />
                }
              />
              {!!syncSettings.loggingEnabled && (
                <>
                  <InsetGroup.ItemSeparator />
                  <InsetGroup.Item
                    label="Logs"
                    arrow
                    onPress={() => navigation.push('PouchDBSyncLogs')}
                  />
                </>
              )}
            </InsetGroup>
          </>
        )}
      </ScrollView>
    </ScreenContent>
  );
}

export default PouchDBSyncScreen;
