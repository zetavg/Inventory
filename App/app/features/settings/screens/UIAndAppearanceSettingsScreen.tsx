import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import { useDataCount } from '@app/data';

import type { StackParamList } from '@app/navigation/MainStack';

import ColorSelect, { ColorSelectColor } from '@app/components/ColorSelect';
import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';
import { UIGroupTitleButton } from '@app/components/UIGroup/UIGroup';

import AppIconSelector from '../components/AppIconSelector';

function UIAndAppearanceSettingsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'UIAndAppearanceSettings'>) {
  const dispatch = useAppDispatch();
  const uiColorTheme = useAppSelector(selectors.settings.uiColorTheme);
  const uiShowDetailedInstructions = useAppSelector(
    selectors.settings.uiShowDetailedInstructions,
  );
  const uiShowIntegrationsOnMoreScreen = useAppSelector(
    selectors.settings.uiShowIntegrationsOnMoreScreen,
  );

  const { count: integrationsCount } = useDataCount('integration');
  const integrationsCountCache = useAppSelector(
    selectors.profiles.integrationsCountCache,
  );
  useEffect(() => {
    if (typeof integrationsCount !== 'number') return;

    if (integrationsCount !== integrationsCountCache) {
      dispatch(
        actions.profiles.updateIntegrationsCountCache(integrationsCount),
      );
    }
  }, [dispatch, integrationsCountCache, integrationsCount]);

  return (
    <ScreenContent navigation={navigation} title="UI & Appearance">
      <ScreenContent.ScrollView>
        <UIGroup.FirstGroupSpacing />
        {Platform.OS === 'ios' && (
          <>
            <UIGroup>
              <UIGroup.ListTextInputItem
                label="UI Color Theme"
                inputElement={
                  <ColorSelect
                    value={uiColorTheme as ColorSelectColor}
                    onChange={c => {
                      dispatch(actions.settings.setUiColorTheme(c));
                    }}
                  />
                }
              />
            </UIGroup>

            <AppIconSelector />
          </>
        )}
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
        {integrationsCountCache > 0 && (
          <UIGroup
            footer={
              uiShowIntegrationsOnMoreScreen
                ? 'Show "Integrations" directly on the "More" tab.'
                : 'Do not show "Integrations" directly on the "More" tab.'
            }
          >
            <UIGroup.ListItem
              label="Show Integrations"
              detail={
                <UIGroup.ListItem.Switch
                  value={uiShowIntegrationsOnMoreScreen}
                  onValueChange={v => {
                    dispatch(
                      actions.settings.setUiShowIntegrationsOnMoreScreen(v),
                    );
                  }}
                />
              }
            />
          </UIGroup>
        )}
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}
export default UIAndAppearanceSettingsScreen;
