import React from 'react';
import type { StackScreenProps } from '@react-navigation/stack';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

function DatabaseManagementScreen({
  navigation,
}: StackScreenProps<StackParamList, 'DatabaseManagement'>) {
  const rootNavigation = useRootNavigation();

  return (
    <ScreenContent
      navigation={navigation}
      title="Database Management"
      headerLargeTitle={false}
    >
      <ScreenContent.ScrollView>
        <UIGroup.FirstGroupSpacing />
        <UIGroup>
          <UIGroup.ListItem
            label="Statics"
            navigable
            onPress={() => navigation.push('Statistics')}
          />
        </UIGroup>
        <UIGroup>
          <UIGroup.ListItem
            label="Fix Data Consistency"
            navigable
            onPress={() => rootNavigation?.push('FixDataConsistency')}
          />
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}
export default DatabaseManagementScreen;
