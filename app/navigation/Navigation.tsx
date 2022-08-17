import React, { useCallback, useMemo, useRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import Ionicons from 'react-native-vector-icons/Ionicons';

import color from 'color';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useTheme from '@app/hooks/useTheme';
import useColors from '@app/hooks/useColors';

import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import {
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack';
import {
  createBottomTabNavigator as createTabNavigator,
  BottomTabBar,
} from '@react-navigation/bottom-tabs';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
  BottomSheetHandle,
} from '@gorhom/bottom-sheet';

import RootNavigationContext from './RootNavigationContext';
import RootBottomSheetsContext from './RootBottomSheetsContext';

import MainStack from './MainStack';

import SampleModalScreen from '@app/screens/SampleModalScreen';
import DemoModalScreen from '@app/screens/DemoModalScreen';
import PouchDBPutDataModalScreen from '@app/screens/PouchDBPutDataModalScreen';
import RfidScanScreen from '@app/screens/RfidScanScreen';

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
  PouchDBPutDataModal: {
    id?: string;
    jsonData?: string;
  };
  SampleModal: { showAppbar?: boolean };
  DemoModal: undefined;
  DemoDetails: { id: string };
};
const DEFAULT_ROOT_STACK_SCREEN_OPTIONS = {
  headerShown: false,
  gestureEnabled: Platform.OS === 'android' ? false : true, // Will mess up the ScrollView in modals on Android
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
  const safeAreaInsets = useSafeAreaInsets();
  const isDarkMode = useIsDarkMode();
  const theme = useTheme();
  const { backgroundColor } = useColors();

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
              height: 54 + safeAreaInsets.bottom,
            },
      tabBarLabelStyle:
        Platform.OS === 'android'
          ? ({
              fontSize: 12,
              fontWeight: '500',
              marginBottom: 2,
            } as any)
          : {},
    }),
    [
      isDarkMode,
      safeAreaInsets.bottom,
      theme.colors.background,
      theme.colors.primary,
      theme.colors.secondary,
      theme.colors.surface,
    ],
  );

  const rfidScanSheetRef = useRef<BottomSheetModal>(null);
  const rfidScanSheetSnapPoints = useMemo(() => ['80%'], []);
  const rootBottomSheetsContextProviderValue = useMemo(
    () => ({
      rfidScanSheet: rfidScanSheetRef,
    }),
    [],
  );
  const renderBottomSheetHandleComponent = useCallback(
    (props: React.ComponentProps<typeof BottomSheetHandle>) => (
      <BottomSheetHandle
        {...props}
        style={{
          backgroundColor,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        }}
        // eslint-disable-next-line react-native/no-inline-styles
        indicatorStyle={{
          backgroundColor: isDarkMode
            ? 'rgba(255, 255, 255, 0.5)'
            : 'rgba(0, 0, 0, 0.75)',
        }}
      />
    ),
    [backgroundColor, isDarkMode],
  );
  const renderBottomSheetBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootBottomSheetsContext.Provider
        value={rootBottomSheetsContextProviderValue}
      >
        <BottomSheetModalProvider>
          <Stack.Navigator screenOptions={DEFAULT_ROOT_STACK_SCREEN_OPTIONS}>
            <Stack.Screen name="Main">
              {({ navigation }) => (
                <RootNavigationContext.Provider value={navigation}>
                  <Tab.Navigator
                    backBehavior="none"
                    screenOptions={defaultTabScreenOptions}
                    tabBar={
                      Platform.OS === 'ios'
                        ? (
                            props: React.ComponentProps<typeof BottomTabBar>,
                          ) => (
                            <BlurView
                              style={styles.tabBarBlurView}
                              blurType={isDarkMode ? 'extraDark' : 'xlight'}
                            >
                              <BottomTabBar {...props} style={props.style} />
                            </BlurView>
                          )
                        : (
                            props: React.ComponentProps<typeof BottomTabBar>,
                          ) => <BottomTabBar {...props} />
                    }
                  >
                    <Tab.Screen
                      name="DashboardTab"
                      children={() => <MainStack initialRouteName="Settings" />}
                      options={{
                        title: 'Dashboard',
                        tabBarIcon: ({ focused, ...props }) => (
                          <Ionicons
                            name={
                              Platform.OS === 'ios'
                                ? focused
                                  ? 'ios-grid'
                                  : 'ios-grid-outline'
                                : focused
                                ? 'md-grid'
                                : 'md-grid-outline'
                            }
                            {...props}
                          />
                        ),
                      }}
                    />
                    <Tab.Screen
                      name="InventoryTab"
                      children={() => <MainStack initialRouteName="Settings" />}
                      options={{
                        title: 'Inventory',
                        tabBarIcon: ({ focused, ...props }) => (
                          <Ionicons
                            name={
                              Platform.OS === 'ios'
                                ? focused
                                  ? 'ios-folder-open'
                                  : 'ios-folder-open-outline'
                                : focused
                                ? 'md-folder-open'
                                : 'md-folder-open-outline'
                            }
                            {...props}
                          />
                        ),
                      }}
                    />
                    <Tab.Screen
                      name="CheckTab"
                      children={() => <MainStack initialRouteName="Settings" />}
                      options={{
                        title: 'Check',
                        tabBarIcon: ({ focused, ...props }) => (
                          <Ionicons
                            name={
                              Platform.OS === 'ios'
                                ? focused
                                  ? 'ios-scan'
                                  : 'ios-scan-outline'
                                : focused
                                ? 'md-scan'
                                : 'md-scan-outline'
                            }
                            {...props}
                          />
                        ),
                      }}
                    />
                    <Tab.Screen
                      name="SearchTab"
                      children={() => <MainStack initialRouteName="Settings" />}
                      options={{
                        title: 'Search',
                        tabBarIcon: ({ focused, ...props }) => (
                          <Ionicons
                            name={
                              Platform.OS === 'ios'
                                ? focused
                                  ? 'ios-search'
                                  : 'ios-search-outline'
                                : focused
                                ? 'md-search'
                                : 'md-search-outline'
                            }
                            {...props}
                          />
                        ),
                      }}
                    />
                    <Tab.Screen
                      name="MoreTab"
                      children={() => <MainStack initialRouteName="Settings" />}
                      options={{
                        title: 'More',
                        tabBarIcon: ({ focused, ...props }) => (
                          <Ionicons
                            name={
                              Platform.OS === 'ios'
                                ? focused
                                  ? 'ios-ellipsis-horizontal-circle-sharp'
                                  : 'ios-ellipsis-horizontal-circle-outline'
                                : focused
                                ? 'md-ellipsis-horizontal-circle-sharp'
                                : 'md-ellipsis-horizontal-circle-outline'
                            }
                            {...props}
                          />
                        ),
                      }}
                    />
                  </Tab.Navigator>
                </RootNavigationContext.Provider>
              )}
            </Stack.Screen>
            <Stack.Screen name="SampleModal" component={SampleModalScreen} />
            <Stack.Screen name="DemoModal" component={DemoModalScreen} />
            <Stack.Screen
              name="PouchDBPutDataModal"
              component={PouchDBPutDataModalScreen}
            />
          </Stack.Navigator>
          <BottomSheetModal
            ref={rfidScanSheetRef}
            snapPoints={rfidScanSheetSnapPoints}
            enablePanDownToClose
            handleComponent={renderBottomSheetHandleComponent}
            backdropComponent={renderBottomSheetBackdrop}
            style={{
              backgroundColor,
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
            }}
          >
            <RfidScanScreen />
          </BottomSheetModal>
        </BottomSheetModalProvider>
      </RootBottomSheetsContext.Provider>
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
