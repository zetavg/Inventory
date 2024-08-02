import React from 'react';
import { Platform } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import type { StackParamList } from '@app/navigation/MainStack';

import ColorSelect, { ColorSelectColor } from '@app/components/ColorSelect';
import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

function SettingsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Settings'>) {
  const dispatch = useAppDispatch();
  const uiColorTheme = useAppSelector(selectors.settings.uiColorTheme);
  const uiShowDetailedInstructions = useAppSelector(
    selectors.settings.uiShowDetailedInstructions,
  );

  return (
    <ScreenContent navigation={navigation} title="Settings">
      <ScreenContent.ScrollView>
        <UIGroup.FirstGroupSpacing />
        <UIGroup>
          <UIGroup.ListItem
            label="UI & Appearance"
            navigable
            onPress={() => navigation.push('UIAndAppearanceSettings')}
          />
        </UIGroup>

        <UIGroup>
          <UIGroup.ListItem
            label="RFID Readers"
            navigable
            onPress={() => navigation.push('NotImplemented', {})}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Label Printers"
            navigable
            onPress={() => navigation.push('LabelPrinters')}
          />
        </UIGroup>

        <UIGroup>
          <UIGroup.ListItem
            label="Integrations"
            navigable
            onPress={() => navigation.push('Integrations')}
          />
        </UIGroup>

        <UIGroup>
          <UIGroup.ListItem
            label="Configuration"
            navigable
            onPress={() => navigation.push('Configuration')}
          />
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}
export default SettingsScreen;
