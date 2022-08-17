import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import useTabBarInsets from '@app/hooks/useTabBarInsets';
import useColors from '@app/hooks/useColors';
import Appbar from '@app/components/Appbar';
import commonStyles from '@app/utils/commonStyles';
import db from '@app/db/pouchdb';
import InsetGroup from '@app/components/InsetGroup';
import { useSetStorybookModeFunction } from '@app/StorybookUIRoot';

function DeveloperToolsScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'DeveloperTools'>) {
  const tabBarInsets = useTabBarInsets();
  const { backgroundColor } = useColors();
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
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustsScrollIndicatorInsets
        style={[commonStyles.flex1, commonStyles.pt16, { backgroundColor }]}
        contentInset={{ bottom: tabBarInsets.scrollViewBottom }}
        scrollIndicatorInsets={{ bottom: tabBarInsets.scrollViewBottom }}
      >
        <InsetGroup>
          <InsetGroup.Item
            label="PouchDB"
            arrow
            onPress={() => navigation.push('PouchDB')}
          />
          <InsetGroup.ItemSeperator />
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            label="Storybook"
            arrow
            onPress={() => navigation.push('Storybook')}
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            label="Enter Storybook mode"
            button
            onPress={handleEnterStorybookMode}
          />
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            label="Sample Modal Screen"
            arrow
            onPress={() => rootNavigation?.push('SampleModal')}
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            label="React Native New App Screen"
            arrow
            onPress={() => navigation.push('NewAppScreen')}
          />
        </InsetGroup>
      </ScrollView>
    </>
  );
}

export default DeveloperToolsScreen;
