import React, { useCallback } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import commonStyles from '@app/utils/commonStyles';
import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';
import { useSetStorybookModeFunction } from '@app/StorybookUIRoot';

function DeveloperToolsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'DeveloperTools'>) {
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
            label="Redux"
            arrow
            onPress={() => navigation.push('Redux')}
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            label="PouchDB"
            arrow
            onPress={() => navigation.push('PouchDB')}
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            label="PouchDB Attachments"
            arrow
            onPress={() => navigation.push('PouchDBAttachments')}
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            label="SQLite"
            arrow
            onPress={() => navigation.push('SQLite')}
          />
        </InsetGroup>

        <InsetGroup>
          <InsetGroup.Item
            label="Storybook"
            arrow
            onPress={() => navigation.push('Storybook')}
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            label="Enter Storybook Mode"
            button
            onPress={handleEnterStorybookMode}
          />
        </InsetGroup>

        <InsetGroup>
          <InsetGroup.Item
            label="Sample Screen"
            arrow
            onPress={() => navigation.push('Sample', {})}
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            label="Sample Modal Screen"
            arrow
            onPress={() => rootNavigation?.push('SampleModal', {})}
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            label="Counter (Redux Sample)"
            arrow
            onPress={() => navigation.push('Counter')}
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            label="React Native New App Screen"
            arrow
            onPress={() => navigation.push('NewAppScreen')}
          />
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default DeveloperToolsScreen;
