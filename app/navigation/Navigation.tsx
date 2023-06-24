import React, { useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  BottomTabBar,
  createBottomTabNavigator as createTabNavigator,
} from '@react-navigation/bottom-tabs';
import {
  DefaultTheme,
  NavigationContainer,
  useFocusEffect,
} from '@react-navigation/native';
import {
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import { BlurView } from '@react-native-community/blur';
import color from 'color';

import { IconName } from '@app/consts/icons';

import DBSyncConfigUpdateScreen from '@app/features/db-sync/config/screens/DBSyncConfigUpdateScreen';
import ExportItemsToCsvScreen from '@app/features/inventory/screens/ExportItemsToCsvScreen';
import ImportItemsFromCsvScreen from '@app/features/inventory/screens/ImportItemsFromCsvScreen';
import OrderItemsScreen from '@app/features/inventory/screens/OrderItemsScreen';
import SaveChecklistScreen from '@app/features/inventory/screens/SaveChecklistScreen';
import SaveCollectionScreen from '@app/features/inventory/screens/SaveCollectionScreen';
import SaveItemScreen from '@app/features/inventory/screens/SaveItemScreen';
import SearchOptionsScreen from '@app/features/inventory/screens/SearchOptionsScreen';
import SelectCollectionScreen from '@app/features/inventory/screens/SelectCollectionScreen';
import SelectContainerScreen from '@app/features/inventory/screens/SelectContainerScreen';
import SelectItemsScreen from '@app/features/inventory/screens/SelectItemsScreen';
import CreateOrUpdateProfileScreen from '@app/features/profiles/screens/CreateOrUpdateProfileScreen';
import DeleteProfileScreen from '@app/features/profiles/screens/DeleteProfileScreen';
import NewProfileScreen from '@app/features/profiles/screens/NewProfileScreen';
import SelectProfileToEditScreen from '@app/features/profiles/screens/SelectProfileToEditScreen';
import SwitchProfileScreen from '@app/features/profiles/screens/SwitchProfileScreen';
import RFIDSheet, { RFIDSheetOptions } from '@app/features/rfid/RFIDSheet';

import { DataTypeWithID } from '@app/db/relationalUtils';
import { TypeName } from '@app/db/schema';

import commonStyles from '@app/utils/commonStyles';

import DemoModalScreen from '@app/screens/DemoModalScreen';
import OnboardingScreen from '@app/screens/OnboardingScreen';
import PouchDBPutDataModalScreen from '@app/screens/PouchDBPutDataModalScreen';
import ReduxSelectActionScreen from '@app/screens/ReduxSelectActionScreen';
import RelationalPouchDBSaveScreen from '@app/screens/RelationalPouchDBSaveScreen';
import RelationalPouchDBTypeDataSelectScreen from '@app/screens/RelationalPouchDBTypeDataSelectScreen';
import SampleModalScreen from '@app/screens/SampleModalScreen';
import SelectIconScreen from '@app/screens/SelectIconScreen';

import useColors from '@app/hooks/useColors';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useTheme from '@app/hooks/useTheme';

import MainStack from './MainStack';
import RootBottomSheetsContext from './RootBottomSheetsContext';
import RootNavigationContext from './RootNavigationContext';

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
  Blank: undefined;
  Onboarding: undefined;
  SwitchProfile: undefined;
  NewProfile: undefined;
  CreateOrUpdateProfile: {
    uuid?: string;
  };
  SelectProfileToEdit: undefined;
  DeleteProfile: undefined;
  DBSyncConfigUpdate: {
    name?: string;
  };
  SelectCollection: {
    callback: (value: string) => void;
    defaultValue?: string;
  };
  SelectContainer: {
    callback: (value: string) => void;
    defaultValue?: string;
  };
  SelectItems: {
    callback: (value: ReadonlyArray<string>) => void;
    defaultValue?: ReadonlyArray<string>;
  };
  SaveCollection: {
    initialData?: Partial<DataTypeWithID<'collection'>>;
  };
  SaveItem: {
    initialData?: Partial<DataTypeWithID<'item'>>;
    afterSave?: (data: Partial<DataTypeWithID<'item'>>) => void;
    afterDelete?: () => void;
  };
  SaveChecklist: {
    initialData?: Partial<DataTypeWithID<'checklist'>>;
    afterDelete?: () => void;
  };
  OrderItems: {
    orderedItems: ReadonlyArray<DataTypeWithID<'item'>>;
    updateOrderFunctionRef: { current: (newOrder: string[]) => void };
    itemDeleteFunctionRef?: { current: (id: string) => Promise<boolean> };
    title?: string;
  };
  SearchOptions: {
    callback: (value: string) => void;
    defaultValue?: string;
  };
  ImportItemsFromCsv: undefined;
  ExportItemsToCsv: undefined;
  SelectIcon: {
    callback: (iconName: IconName) => void;
    defaultValue?: IconName;
  };
  ReduxSelectAction: {
    callback: (data: string) => void;
  };
  PouchDBPutDataModal: {
    id?: string;
    jsonData?: string;
  };
  RelationalPouchDBSave: {
    type: TypeName;
    initialData?: Record<string, any>;
  };
  RelationalPouchDBTypeDataSelect: {
    type: TypeName;
    callback: (id: string) => void;
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
function Navigation({
  onlyDevTools,
}: {
  onlyDevTools?: boolean;
  // onboarding?: boolean;
  // profileSwitcher?: boolean;
}) {
  const isDarkMode = useIsDarkMode();

  const navigationTheme = useMemo(
    () => ({
      ...NAVIGATION_CONTAINER_THEME,
      dark: isDarkMode,
    }),
    [isDarkMode],
  );

  const rfidSheetRef = useRef<BottomSheetModal>(null);
  const rfidSheetPassOptionsFnRef =
    useRef<(options: RFIDSheetOptions) => void>(null);
  const rootBottomSheetsContextProviderValue = useMemo(
    () => ({
      rfidSheet: rfidSheetRef,
      rfidSheetPassOptionsFn: rfidSheetPassOptionsFnRef,
      openRfidSheet: (options: RFIDSheetOptions) => {
        rfidSheetPassOptionsFnRef.current &&
          rfidSheetPassOptionsFnRef.current(options);
        rfidSheetRef.current?.present();
        rfidSheetRef.current?.expand();
        setTimeout(() => {
          rfidSheetRef.current?.expand();
        }, 300);
      },
      showRfidSheet: () => {
        rfidSheetRef.current?.present();
        rfidSheetRef.current?.expand();
        setTimeout(() => {
          rfidSheetRef.current?.expand();
        }, 300);
      },
    }),
    [],
  );

  // let initialRouteName = 'Main';
  // let blankScreenSwitchTo: undefined | string | null;
  // if (onboarding) {
  //   initialRouteName = 'Main';
  //   blankScreenSwitchTo = 'Onboarding';
  // }
  // if (profileSwitcher) {
  //   initialRouteName = 'Blank';
  //   blankScreenSwitchTo = 'SwitchProfile';
  // }

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootBottomSheetsContext.Provider
        value={rootBottomSheetsContextProviderValue}
      >
        <BottomSheetModalProvider>
          <Stack.Navigator
            screenOptions={DEFAULT_ROOT_STACK_SCREEN_OPTIONS}
            // initialRouteName={initialRouteName}
            initialRouteName="Main"
          >
            <Stack.Screen name="Main">
              {({ navigation }) => {
                // if (blankScreenSwitchTo) {
                //   const routeName = blankScreenSwitchTo;
                //   setTimeout(() => {
                //     navigation.push(routeName);
                //   }, 0);
                //   blankScreenSwitchTo = null;
                // }

                // if (onboarding) return null;

                return onlyDevTools ? (
                  <RootNavigationContext.Provider value={navigation}>
                    <MainStack initialRouteName="DeveloperTools" />
                  </RootNavigationContext.Provider>
                ) : (
                  <RootNavigationContext.Provider value={navigation}>
                    <TabNavigator />
                  </RootNavigationContext.Provider>
                );
              }}
            </Stack.Screen>
            {/*<Stack.Screen name="Blank">
              {({ navigation }) => {
                if (blankScreenSwitchTo) {
                  const routeName = blankScreenSwitchTo;
                  setTimeout(() => {
                    navigation.push(routeName);
                  }, 0);
                  blankScreenSwitchTo = null;
                }

                return null;
              }}
            </Stack.Screen>*/}
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen
              name="ReduxSelectAction"
              component={ReduxSelectActionScreen}
            />
            <Stack.Screen
              name="SwitchProfile"
              component={SwitchProfileScreen}
            />
            <Stack.Screen name="NewProfile" component={NewProfileScreen} />
            <Stack.Screen
              name="CreateOrUpdateProfile"
              component={CreateOrUpdateProfileScreen}
            />
            <Stack.Screen
              name="SelectProfileToEdit"
              component={SelectProfileToEditScreen}
            />
            <Stack.Screen
              name="DeleteProfile"
              component={DeleteProfileScreen}
            />
            <Stack.Screen
              name="DBSyncConfigUpdate"
              component={DBSyncConfigUpdateScreen}
            />
            <Stack.Screen name="SampleModal" component={SampleModalScreen} />
            <Stack.Screen name="DemoModal" component={DemoModalScreen} />
            <Stack.Screen
              name="PouchDBPutDataModal"
              component={PouchDBPutDataModalScreen}
            />
            <Stack.Screen
              name="RelationalPouchDBSave"
              component={RelationalPouchDBSaveScreen}
            />
            <Stack.Screen
              name="RelationalPouchDBTypeDataSelect"
              component={RelationalPouchDBTypeDataSelectScreen}
            />
            <Stack.Screen name="SelectIcon" component={SelectIconScreen} />
            <Stack.Screen
              name="SelectCollection"
              component={SelectCollectionScreen}
            />
            <Stack.Screen
              name="SelectContainer"
              component={SelectContainerScreen}
            />
            <Stack.Screen name="SelectItems" component={SelectItemsScreen} />
            <Stack.Screen
              name="SaveCollection"
              component={SaveCollectionScreen}
            />
            <Stack.Screen name="SaveItem" component={SaveItemScreen} />
            <Stack.Screen
              name="SaveChecklist"
              component={SaveChecklistScreen}
            />
            <Stack.Screen name="OrderItems" component={OrderItemsScreen} />
            <Stack.Screen
              name="SearchOptions"
              component={SearchOptionsScreen}
            />
            <Stack.Screen
              name="ImportItemsFromCsv"
              component={ImportItemsFromCsvScreen}
            />
            <Stack.Screen
              name="ExportItemsToCsv"
              component={ExportItemsToCsvScreen}
            />
          </Stack.Navigator>
          <RFIDSheet
            ref={rfidSheetRef}
            rfidSheetPassOptionsFnRef={rfidSheetPassOptionsFnRef}
          />
        </BottomSheetModalProvider>
      </RootBottomSheetsContext.Provider>
    </NavigationContainer>
  );
}

function TabNavigator() {
  const safeAreaInsets = useSafeAreaInsets();
  const isDarkMode = useIsDarkMode();
  const { iosTintColor } = useColors();
  const theme = useTheme();

  const defaultTabScreenOptions = useDefaultTabScreenOptions();

  // Fix header stuck outside of safe area issue
  // when navigated back from root stack modals on iOS
  const [nudge, setNudge] = useState(false);
  useFocusEffect(
    React.useCallback(() => {
      setTimeout(() => {
        setNudge(true);
        setTimeout(() => {
          setNudge(false);
        }, 0);
      }, 300);
    }, []),
  );

  return (
    <View
      style={[
        commonStyles.flex1,
        nudge && { paddingTop: StyleSheet.hairlineWidth },
      ]}
    >
      <Tab.Navigator
        backBehavior="none"
        screenOptions={defaultTabScreenOptions}
        tabBar={getTabBar(isDarkMode)}
      >
        <Tab.Screen
          name="DashboardTab"
          children={() => <MainStack initialRouteName="More" />}
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
          children={() => <MainStack initialRouteName="Collections" />}
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
          children={() => <MainStack initialRouteName="Search" />}
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
          children={() => <MainStack initialRouteName="More" />}
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
    </View>
  );
}

export const getTabBar = (isDarkMode: boolean) =>
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
      );

export function useDefaultTabScreenOptions() {
  const safeAreaInsets = useSafeAreaInsets();
  const isDarkMode = useIsDarkMode();
  const { iosTintColor } = useColors();
  const theme = useTheme();

  const defaultTabScreenOptions = useMemo(
    () => ({
      ...DEFAULT_TAB_SCREEN_OPTIONS,
      tabBarActiveTintColor:
        Platform.OS === 'ios' ? iosTintColor : theme.colors.primary,
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
      iosTintColor,
      isDarkMode,
      safeAreaInsets.bottom,
      theme.colors.background,
      theme.colors.primary,
      theme.colors.secondary,
      theme.colors.surface,
    ],
  );

  return defaultTabScreenOptions;
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
