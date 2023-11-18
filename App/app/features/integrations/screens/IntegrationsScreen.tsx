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

import { onlyValid, useData } from '@app/data';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import ScreenContent from '@app/components/ScreenContent';
import ScreenContentScrollView from '@app/components/ScreenContentScrollView';
import UIGroup from '@app/components/UIGroup';

function IntegrationsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Integrations'>) {
  const rootNavigation = useRootNavigation();

  const { data, loading, refresh, refreshing } = useData('integration', {});
  const integrations = onlyValid(data);

  return (
    <ScreenContent navigation={navigation} title="Integrations">
      <ScreenContentScrollView
        refreshControl={
          <RefreshControl onRefresh={refresh} refreshing={refreshing} />
        }
      >
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        <UIGroup loading={loading} placeholder="No Integrations">
          {!!integrations &&
            integrations.length > 0 &&
            UIGroup.ListItemSeparator.insertBetween(
              integrations
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((integration, i) => (
                  <UIGroup.ListItem
                    key={integration.__id || i}
                    label={integration.name}
                    detail={integration.integration_type}
                    verticalArrangedNormalLabelIOS
                    navigable
                    onPress={() => {
                      switch (integration.integration_type) {
                        case 'airtable': {
                          rootNavigation?.push('AirtableIntegration', {
                            integrationId: integration.__id || '',
                          });
                          break;
                        }

                        default: {
                          Alert.alert(
                            'Unknown Integration Type',
                            `Integration type "${integration.integration_type}" is not supported on this version of the app.`,
                          );
                          break;
                        }
                      }
                    }}
                  />
                )),
            )}
        </UIGroup>
        <UIGroup>
          <UIGroup.ListItem
            label="Add Integration..."
            button
            onPress={() => rootNavigation?.push('AddIntegration')}
          />
        </UIGroup>
      </ScreenContentScrollView>
    </ScreenContent>
  );
}

export default IntegrationsScreen;
