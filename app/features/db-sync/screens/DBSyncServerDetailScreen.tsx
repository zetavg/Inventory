import React from 'react';
import { Alert } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import ScreenContent from '@app/components/ScreenContent';
import ScreenContentScrollView from '@app/components/ScreenContentScrollView';
import UIGroup from '@app/components/UIGroup';

function DBSyncServerDetailScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'DBSyncServerDetail'>) {
  const rootNavigation = useRootNavigation();
  const dispatch = useAppDispatch();
  const servers = useAppSelector(selectors.dbSync.servers);
  const { id } = route.params;
  const server = servers[id];

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

          return (
            <>
              <UIGroup>
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
                <UIGroup.ListItemSeparator />
                <UIGroup.ListItem label="Status" detail={'TODO'} />
                <UIGroup.ListItemSeparator />
                <UIGroup.ListItem label="Last Synced" detail={'TODO'} />
              </UIGroup>
              <UIGroup>
                <UIGroup.ListItem
                  label="Edit..."
                  button
                  onPress={() =>
                    rootNavigation?.push('DBSyncNewOrEditServerModal', { id })
                  }
                />
                <UIGroup.ListItemSeparator />
                <UIGroup.ListItem
                  label="Remove"
                  button
                  destructive
                  onPress={() => {
                    Alert.alert(
                      `Remove server "${server.name}"`,
                      `Are you sure you want to remove the server "${server.name}"?`,
                      [
                        {
                          text: 'Do not remove',
                          style: 'cancel',
                          onPress: () => {},
                        },
                        {
                          text: 'Remove',
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
            </>
          );
        })()}
      </ScreenContentScrollView>
    </ScreenContent>
  );
}

export default DBSyncServerDetailScreen;
