import React, { useCallback } from 'react';
import { Alert, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';
import { reducers } from '@app/redux/store';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

import { useSetStorybookModeFunction } from '@app/StorybookUIRoot';

function DeveloperToolsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'DeveloperTools'>) {
  const dispatch = useAppDispatch();
  const showDevTools = useAppSelector(selectors.devTools.showDevTools);

  const setStorybookMode = useSetStorybookModeFunction();

  const rootNavigation = useRootNavigation();

  const handleEnterStorybookMode = useCallback(() => {
    if (!setStorybookMode) {
      Alert.alert('Storybook is not available.');
      return;
    }

    Alert.alert(
      'Confirm',
      'Are you sure you want to enter Storybook mode? The main app will be unloaded and all your unsaved changes will be discarded.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Enter Storybook mode',
          style: 'destructive',
          onPress: () => setStorybookMode(true),
        },
      ],
    );
  }, [setStorybookMode]);

  return (
    <ScreenContent navigation={navigation} title="Developer Tools">
      <ScrollView>
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        <UIGroup>
          <UIGroup.ListItem
            label="Storybook"
            navigable
            onPress={() => navigation.push('Storybook')}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Enter Storybook Mode"
            button
            onPress={handleEnterStorybookMode}
          />
        </UIGroup>

        <UIGroup>
          <UIGroup.ListItem
            label="Redux"
            navigable
            onPress={() => navigation.push('Redux')}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Data"
            navigable
            onPress={() => navigation.push('DataTypes')}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="PouchDB"
            navigable
            onPress={() => navigation.push('PouchDB')}
          />
          {/*<UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Relational PouchDB"
            navigable
            onPress={() => navigation.push('RelationalPouchDB')}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Attachments DB"
            navigable
            onPress={() => navigation.push('PouchDBAttachments')}
          />*/}
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="SQLite"
            navigable
            onPress={() => navigation.push('SQLite')}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="RNFS"
            navigable
            onPress={() => navigation.push('RNFS')}
          />
        </UIGroup>

        <UIGroup>
          <UIGroup.ListItem
            label="DB Sync"
            navigable
            onPress={() => navigation.push('DBSync')}
          />
        </UIGroup>

        <UIGroup>
          <UIGroup.ListItem
            label="LinguisticTaggerModuleIOS"
            navigable
            onPress={() => navigation.push('LinguisticTaggerModuleIOS')}
          />
        </UIGroup>

        <UIGroup>
          <UIGroup.ListItem
            label="EPC Utils"
            navigable
            onPress={() => navigation.push('EPCUtils')}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="EPC-TDS"
            navigable
            onPress={() => navigation.push('EPCTDS')}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="RFID UHF Module"
            navigable
            onPress={() => navigation.push('RFIDUHFModule')}
          />
        </UIGroup>

        <UIGroup>
          <UIGroup.ListItem
            label="Change App Icon"
            navigable
            onPress={() => navigation.push('DevChangeIcon')}
          />
        </UIGroup>

        <UIGroup>
          <UIGroup.ListItem
            label="Onboarding Screen"
            navigable
            onPress={() => rootNavigation?.push('Onboarding')}
          />
        </UIGroup>

        <UIGroup>
          <UIGroup.ListItem
            label="Sample Screen"
            navigable
            onPress={() => navigation.push('Sample', {})}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Sample Modal Screen"
            navigable
            onPress={() => rootNavigation?.push('SampleModal', {})}
          />
          {(() => {
            if (reducers.hasOwnProperty('counter')) {
              return (
                <>
                  <UIGroup.ListItemSeparator />
                  <UIGroup.ListItem
                    label="Counter (Redux Sample)"
                    navigable
                    onPress={() => navigation.push('Counter')}
                  />
                </>
              );
            }
            return null;
          })()}
          {(() => {
            if (reducers.hasOwnProperty('counters')) {
              return (
                <>
                  <UIGroup.ListItemSeparator />
                  <UIGroup.ListItem
                    label="Counters (Redux Sample)"
                    navigable
                    onPress={() => navigation.push('Counters')}
                  />
                </>
              );
            }
            return null;
          })()}
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="React Native New App Screen"
            navigable
            onPress={() => navigation.push('NewAppScreen')}
          />
        </UIGroup>
        <UIGroup>
          <UIGroup.ListItem
            label="Logs"
            navigable
            onPress={() => navigation.push('AppLogs')}
          />
        </UIGroup>
        <UIGroup>
          <UIGroup.ListItem
            label="Show Dev Tools"
            detail={
              <UIGroup.ListItem.Switch
                value={showDevTools}
                onChange={() => {
                  dispatch(actions.devTools.toggleShowDevTools());
                }}
              />
            }
          />
        </UIGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default DeveloperToolsScreen;
