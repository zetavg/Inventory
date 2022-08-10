import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import {
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useColors from '@app/hooks/useColors';

import SettingsScreen from '@app/screens/SettingsScreen';
import StorybookScreen from '@app/screens/StorybookScreen';
import NewAppScreen from '@app/screens/NewAppScreen';

export type StackParamList = {
  Settings: undefined;
  Storybook: undefined;
  NewAppScreen: undefined;
  DemoHome: undefined;
  DemoDetails: { id: string };
};

const Stack =
  Platform.OS === 'ios' ? createNativeStackNavigator() : createStackNavigator();

type Props = {
  initialRouteName: keyof StackParamList;
};

const DEFAULT_SCREEN_OPTIONS = {
  gestureEnabled: true,
  headerShown: Platform.OS === 'ios' ? true : false,
  headerLargeTitle: Platform.OS === 'ios' ? true : false,
  headerShadowVisible: true,
  headerLargeTitleShadowVisible: false,
  ...TransitionPresets.SlideFromRightIOS,
} as const;

const SCREEN_OPTIONS = {
  noHeader: {
    headerShown: false,
  },
  noHeaderLargeTitle: {
    headerLargeTitle: false,
    headerLargeTitleShadowVisible: true,
  },
} as const;

function MainStack({ initialRouteName }: Props) {
  const isDarkMode = useIsDarkMode();
  const { backgroundColor } = useColors();
  const iosHeaderTintColor = isDarkMode ? '#3A82F7' : '#3478F6';

  const screenOptions = useMemo(
    () => ({
      ...DEFAULT_SCREEN_OPTIONS,
      ...(Platform.OS === 'ios'
        ? ({
            headerBlurEffect: isDarkMode ? 'dark' : 'light',
            headerStyle: { backgroundColor: 'rgba(255, 255, 255, 0.002)' },
            headerLargeStyle: { backgroundColor },
            headerTintColor: iosHeaderTintColor,
            headerTitleStyle: { color: isDarkMode ? '#fff' : '#000' },
          } as any)
        : {}),
    }),
    [backgroundColor, iosHeaderTintColor, isDarkMode],
  );

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={screenOptions}
    >
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen
        name="Storybook"
        component={StorybookScreen}
        options={SCREEN_OPTIONS.noHeaderLargeTitle}
      />
      <Stack.Screen
        name="NewAppScreen"
        component={NewAppScreen}
        options={SCREEN_OPTIONS.noHeader}
      />
    </Stack.Navigator>
  );
}

export default MainStack;
