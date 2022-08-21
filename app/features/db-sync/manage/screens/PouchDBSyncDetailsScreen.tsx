import React, { useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import { useAppSelector, useAppDispatch } from '@app/redux';
import { selectActiveProfileConfig } from '@app/features/profiles';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import cs from '@app/utils/commonStyles';

import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';
import Switch from '@app/components/Switch';

import { selectConfig } from '../../config/selectors';
import { selectDBSyncStatus, selectSettings } from '../selectors';
import { setServerDisabled } from '../settingsSlice';
import { selectDBSyncSettings } from '..';
import formatDate from '@app/utils/formatDate';

function PouchDBSyncDetailsScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'PouchDBSyncDetails'>) {
  const rootNavigation = useRootNavigation();

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  const dispatch = useAppDispatch();

  const { serverName } = route.params;
  const servers = useAppSelector(selectConfig) || {};
  const server = servers[serverName];

  const syncSettings = useAppSelector(selectSettings) || {};
  const settings = (syncSettings?.serverSettings || {})[serverName] || {};

  const syncStatus = useAppSelector(selectDBSyncStatus);
  const serverStatus = (syncStatus?.serverStatus || {})[serverName] || {};

  useEffect(() => {
    if (!server) navigation.goBack();
  }, [navigation, server]);

  if (!server) return null;

  return (
    <ScreenContent
      navigation={navigation}
      title={serverName}
      headerLargeTitle={false}
    >
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <InsetGroup style={cs.mt12}>
          <InsetGroup.Item
            label="Enable Server"
            detail={
              <Switch
                value={!settings.disabled}
                onChange={() => {
                  dispatch(setServerDisabled([serverName, !settings.disabled]));
                }}
              />
            }
          />
        </InsetGroup>
        <InsetGroup label="DB Connection">
          <InsetGroup.Item label="URI" detail={server.db.uri} />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item label="Username" detail={server.db.username} />
          {serverStatus.db?.lastStatus && (
            <>
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item
                label="Status"
                detail={serverStatus.db?.lastStatus}
              />
            </>
          )}
          {serverStatus.db?.lastUpdatedAt && (
            <>
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item
                label="Last Update"
                detail={formatDate(new Date(serverStatus.db?.lastUpdatedAt))}
              />
            </>
          )}
        </InsetGroup>
        <InsetGroup label="Attachments DB Connection">
          <InsetGroup.Item label="URI" detail={server.attachmentsDB.uri} />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            label="Username"
            detail={server.attachmentsDB.username}
          />
          {serverStatus.attachments_db?.lastStatus && (
            <>
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item
                label="Status"
                detail={serverStatus.attachments_db?.lastStatus}
              />
            </>
          )}
          {serverStatus.attachments_db?.lastUpdatedAt && (
            <>
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item
                label="Last Update"
                detail={formatDate(
                  new Date(serverStatus.attachments_db?.lastUpdatedAt),
                )}
              />
            </>
          )}
        </InsetGroup>

        <InsetGroup>
          <InsetGroup.Item
            button
            label="Edit Connection"
            onPress={() =>
              rootNavigation?.push('DBSyncConfigUpdate', { name: serverName })
            }
          />
        </InsetGroup>

        {/*<InsetGroup>
          <InsetGroup.Item
            button
            destructive
            label="Delete Server"
            onPress={handleDelete}
          />
        </InsetGroup>*/}
      </ScrollView>
    </ScreenContent>
  );
}

export default PouchDBSyncDetailsScreen;
