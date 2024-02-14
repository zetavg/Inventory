import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import ScreenContent from '@app/components/ScreenContent';
import ScreenContentScrollView from '@app/components/ScreenContentScrollView';
import UIGroup from '@app/components/UIGroup';

import ServerList from '../components/ServerList';

function DBSyncScreen({
  navigation,
}: StackScreenProps<StackParamList, 'DBSync'>) {
  const rootNavigation = useRootNavigation();
  const dispatch = useAppDispatch();
  const dbSyncEnabled = useAppSelector(selectors.dbSync.dbSyncEnabled);
  const currentProfileUuid = useAppSelector(
    selectors.profiles.currentProfileUuid,
  );

  return (
    <ScreenContent navigation={navigation} title="Data Sync">
      <ScreenContentScrollView>
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        <UIGroup>
          <UIGroup.ListItem
            label="Enable Sync"
            detail={
              <UIGroup.ListItem.Switch
                value={dbSyncEnabled}
                onValueChange={value => {
                  dispatch(actions.dbSync.setEnable(value));
                }}
              />
            }
          />
        </UIGroup>
        <ServerList
          itemNavigable
          onItemPress={id => navigation.push('DBSyncServerDetail', { id })}
        />
        <UIGroup>
          <UIGroup.ListItem
            label="Add CouchDB Server..."
            button
            onPress={() =>
              rootNavigation?.push('DBSyncNewOrEditServerModal', {})
            }
          />
        </UIGroup>
        <UIGroup header="Advanced">
          <UIGroup.ListItem
            label="View Logs"
            navigable
            onPress={() =>
              navigation?.push('AppLogs', {
                title: 'DB Sync Logs',
                headerLargeTitle: false,
                showOptions: false,
                filter: { module: 'DBSyncManager', user: currentProfileUuid },
              })
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

export default DBSyncScreen;
