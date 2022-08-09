import React, { useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { BlurView } from '@react-native-community/blur';
import Ionicons from 'react-native-vector-icons/Ionicons';

import color from 'color';
import useIsDarkMode from '@app/hooks/useIsDarkMode';

import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import {
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack';
import {
  createBottomTabNavigator as createTabNavigator,
  BottomTabBar,
} from '@react-navigation/bottom-tabs';

import RootNavigationContext from './RootNavigationContext';

import MainStack from './MainStack';

import DemoModalScreen from '@app/screens/DemoModalScreen';

const NAVIGATION_CONTAINER_THEME = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: 'transparent' },
};

/**
 * Root stack navigator
 */
const Stack = createStackNavigator();
export type RootStackParamList = {
  Main: undefined;
  DemoModal: undefined;
  DemoDetails: { id: string };
};
const DEFAULT_ROOT_STACK_SCREEN_OPTIONS = {
  headerShown: false,
  gestureEnabled: true,
  ...TransitionPresets.ModalPresentationIOS,
};

/**
 * Main tab navigator
 */
const Tab = createTabNavigator();
const DEFAULT_TAB_SCREEN_OPTIONS = {
  headerShown: false,
  tabBarHideOnKeyboard: true,
};

/**
 * Composed navigation
 */
function Navigation() {
  const isDarkMode = useIsDarkMode();
  const theme = useTheme();

  const navigationTheme = useMemo(
    () => ({
      ...NAVIGATION_CONTAINER_THEME,
      dark: isDarkMode,
    }),
    [isDarkMode],
  );

  const defaultTabScreenOptions = useMemo(
    () => ({
      ...DEFAULT_TAB_SCREEN_OPTIONS,
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: color(theme.colors.secondary)
        .opaquer(isDarkMode ? -0.54 : -0.42)
        .hexa(),
      tabBarStyle:
        Platform.OS === 'ios'
          ? {
              backgroundColor: 'transparent',
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: isDarkMode ? '#262626' : '#A9A9AD',
            }
          : {
              backgroundColor: color(theme.colors.surface)
                .mix(color(theme.colors.primary), 0.08)
                .rgb()
                .string(),
              borderTopColor: theme.colors.background,
            },
      tabBarLabelStyle:
        Platform.OS === 'android'
          ? ({
              fontSize: 12,
              fontWeight: '500',
            } as any)
          : {},
    }),
    [
      isDarkMode,
      theme.colors.background,
      theme.colors.primary,
      theme.colors.secondary,
      theme.colors.surface,
    ],
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={DEFAULT_ROOT_STACK_SCREEN_OPTIONS}>
        <Stack.Screen name="Main">
          {({ navigation }) => (
            <RootNavigationContext.Provider value={navigation}>
              <Tab.Navigator
                backBehavior="none"
                screenOptions={defaultTabScreenOptions}
                tabBar={
                  Platform.OS === 'ios'
                    ? (props: React.ComponentProps<typeof BottomTabBar>) => (
                        <BlurView
                          style={styles.tabBarBlurView}
                          blurType={isDarkMode ? 'extraDark' : 'xlight'}
                        >
                          <BottomTabBar {...props} style={props.style} />
                        </BlurView>
                      )
                    : (props: React.ComponentProps<typeof BottomTabBar>) => (
                        <BottomTabBar {...props} />
                      )
                }
              >
                <Tab.Screen
                  name="HomeTab"
                  children={() => <MainStack initialRouteName="Settings" />}
                  options={{
                    tabBarIcon: ({ focused, ...props }) => (
                      <Ionicons
                        name={
                          focused
                            ? 'ios-information-circle'
                            : 'ios-information-circle-outline'
                        }
                        {...props}
                      />
                    ),
                  }}
                />
                <Tab.Screen
                  name="SettingsTab"
                  children={() => <MainStack initialRouteName="Settings" />}
                  options={{
                    tabBarIcon: ({ focused, ...props }) => (
                      <Ionicons
                        name={focused ? 'ios-list' : 'ios-list'}
                        {...props}
                      />
                    ),
                  }}
                />
              </Tab.Navigator>
            </RootNavigationContext.Provider>
          )}
        </Stack.Screen>
        <Stack.Screen name="DemoModal" component={DemoModalScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarBlurView: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default Navigation;
