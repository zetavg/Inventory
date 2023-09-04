import React from 'react';
import type { StackScreenProps } from '@react-navigation/stack';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import type { StackParamList } from '@app/navigation/MainStack';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';
import { UIGroupTitleButton } from '@app/components/UIGroup/UIGroup';

function SettingsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Settings'>) {
  const dispatch = useAppDispatch();
  const uiShowDetailedInstructions = useAppSelector(
    selectors.settings.uiShowDetailedInstructions,
  );

  return (
    <ScreenContent navigation={navigation} title="Settings">
      <ScreenContent.ScrollView>
        <UIGroup.FirstGroupSpacing />
        <UIGroup
          footer={
            uiShowDetailedInstructions
              ? 'Detailed instructions will be shown on the UI, it will take more space but instructions will be more clear.'
              : 'Less instructions will be shown, the UI will be more compact but instructions will be less detailed. Recommended for experienced users.'
          }
        >
          <UIGroup.ListItem
            label="Show Detailed Instructions"
            detail={
              <UIGroup.ListItem.Switch
                value={uiShowDetailedInstructions}
                onValueChange={v => {
                  dispatch(actions.settings.setUiShowDetailedInstructions(v));
                }}
              />
            }
          />
        </UIGroup>
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
