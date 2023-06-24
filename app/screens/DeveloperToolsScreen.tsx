import React, { useCallback } from 'react';
import { Alert, ScrollView, Switch } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';
import { reducers } from '@app/redux/store';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import InsetGroup from '@app/components/InsetGroup';
import ScreenContent from '@app/components/ScreenContent';

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
        <InsetGroup style={commonStyles.mt16}>
          <InsetGroup.Item
            label="Storybook"
            arrow
            onPress={() => navigation.push('Storybook')}
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Enter Storybook Mode"
            button
            onPress={handleEnterStorybookMode}
          />
        </InsetGroup>

        <InsetGroup>
          <InsetGroup.Item
            label="Redux"
            arrow
            onPress={() => navigation.push('Redux')}
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="PouchDB"
            arrow
            onPress={() => navigation.push('PouchDB')}
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Relational PouchDB"
            arrow
            onPress={() => navigation.push('RelationalPouchDB')}
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Attachments DB"
            arrow
            onPress={() => navigation.push('PouchDBAttachments')}
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="SQLite"
            arrow
            onPress={() => navigation.push('SQLite')}
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="RNFS"
            arrow
            onPress={() => navigation.push('RNFS')}
          />
        </InsetGroup>

        <InsetGroup>
          <InsetGroup.Item
            label="PouchDB Sync"
            arrow
            onPress={() => navigation.push('PouchDBSync')}
          />
        </InsetGroup>

        <InsetGroup>
          <InsetGroup.Item
            label="LinguisticTaggerModuleIOS"
            arrow
            onPress={() => navigation.push('LinguisticTaggerModuleIOS')}
          />
        </InsetGroup>

        <InsetGroup>
          <InsetGroup.Item
            label="EPC-TDS"
            arrow
            onPress={() => navigation.push('EPCTDS')}
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="RFID UHF Module"
            arrow
            onPress={() => navigation.push('RFIDUHFModule')}
          />
        </InsetGroup>

        <InsetGroup>
          <InsetGroup.Item
            label="Change App Icon"
            arrow
            onPress={() => navigation.push('DevChangeIcon')}
          />
        </InsetGroup>

        <InsetGroup>
          <InsetGroup.Item
            label="Onboarding Screen"
            arrow
            onPress={() => rootNavigation?.push('Onboarding')}
          />
        </InsetGroup>

        <InsetGroup>
          <InsetGroup.Item
            label="Sample Screen"
            arrow
            onPress={() => navigation.push('Sample', {})}
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Sample Modal Screen"
            arrow
            onPress={() => rootNavigation?.push('SampleModal', {})}
          />
          {(() => {
            if (reducers.hasOwnProperty('counter')) {
              return (
                <>
                  <InsetGroup.ItemSeparator />
                  <InsetGroup.Item
                    label="Counter (Redux Sample)"
                    arrow
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
                  <InsetGroup.ItemSeparator />
                  <InsetGroup.Item
                    label="Counters (Redux Sample)"
                    arrow
                    onPress={() => navigation.push('Counters')}
                  />
                </>
              );
            }
            return null;
          })()}
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="React Native New App Screen"
            arrow
            onPress={() => navigation.push('NewAppScreen')}
          />
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            label="console.log"
            arrow
            onPress={() => navigation.push('ConsoleLog')}
          />
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            label="Show Dev Tools"
            detail={
              <Switch
                value={showDevTools}
                onChange={() => {
                  dispatch(actions.devTools.toggleShowDevTools());
                }}
              />
            }
          />
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default DeveloperToolsScreen;
