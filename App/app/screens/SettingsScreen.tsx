import React from 'react';
import type { StackScreenProps } from '@react-navigation/stack';

import type { StackParamList } from '@app/navigation/MainStack';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

function SettingsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Settings'>) {
  return (
    <ScreenContent navigation={navigation} title="Settings">
      <ScreenContent.ScrollView>
        <UIGroup.FirstGroupSpacing />
        <UIGroup>
          <UIGroup.ListItem
            label="Configurations"
            navigable
            onPress={() => navigation.push('Configurations')}
          />
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}
export default SettingsScreen;
