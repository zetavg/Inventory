import React, { useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import Ionicons from 'react-native-vector-icons/Ionicons';

import color from 'color';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useTheme from '@app/hooks/useTheme';
import useColors from '@app/hooks/useColors';

import {
  NavigationContainer,
  DefaultTheme,
  useFocusEffect,
} from '@react-navigation/native';
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
} from '@gorhom/bottom-sheet';

import RootNavigationContext from './RootNavigationContext';
import RootBottomSheetsContext from './RootBottomSheetsContext';

import MainStack from './MainStack';

import SwitchProfileScreen from '@app/features/profiles/screens/SwitchProfileScreen';
import NewProfileScreen from '@app/features/profiles/screens/NewProfileScreen';
import DBSyncConfigUpdateScreen from '@app/features/db-sync/config/screens/DBSyncConfigUpdateScreen';
import SampleModalScreen from '@app/screens/SampleModalScreen';
import DemoModalScreen from '@app/screens/DemoModalScreen';
import PouchDBPutDataModalScreen from '@app/screens/PouchDBPutDataModalScreen';
import RelationalPouchDBSaveScreen from '@app/screens/RelationalPouchDBSaveScreen';
import RelationalPouchDBTypeDataSelectScreen from '@app/screens/RelationalPouchDBTypeDataSelectScreen';
import ReduxSelectCommonActionsScreen from '@app/screens/ReduxSelectCommonActionsScreen';
import RFIDSheet, { RFIDSheetOptions } from '@app/features/rfid/RFIDSheet';

import SelectIconScreen from '@app/screens/SelectIconScreen';

import SelectCollectionScreen from '@app/features/inventory/screens/SelectCollectionScreen';
import SelectContainerScreen from '@app/features/inventory/screens/SelectContainerScreen';
import SaveCollectionScreen from '@app/features/inventory/screens/SaveCollectionScreen';
import SaveItemScreen from '@app/features/inventory/screens/SaveItemScreen';
import OrderItemsScreen from '@app/features/inventory/screens/OrderItemsScreen';

import { TypeName } from '@app/db/schema';
import { IconName } from '@app/consts/icons';

import commonStyles from '@app/utils/commonStyles';
import { DataTypeWithID } from '@app/db/relationalUtils';

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
  SwitchProfile: undefined;
  NewProfile: undefined;
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
  SaveCollection: {
    initialData?: Partial<DataTypeWithID<'collection'>>;
  };
  SaveItem: {
    initialData?: Partial<DataTypeWithID<'item'>>;
    afterSave?: (data: Partial<DataTypeWithID<'item'>>) => void;
    afterDelete?: () => void;
  };
  OrderItems: {
    orderedItems: ReadonlyArray<DataTypeWithID<'item'>>;
    updateOrderFunctionRef: { current: (newOrder: string[]) => void };
  };
  SelectIcon: {
    callback: (iconName: IconName) => void;
    defaultValue?: IconName;
  };
  ReduxSelectCommonActions: {
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
function Navigation({ onlyDevTools }: { onlyDevTools?: boolean }) {
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
      },
    }),
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
              {({ navigation }) =>
                onlyDevTools ? (
                  <RootNavigationContext.Provider value={navigation}>
                    <MainStack initialRouteName="DeveloperTools" />
                  </RootNavigationContext.Provider>
                ) : (
                  <RootNavigationContext.Provider value={navigation}>
                    <TabNavigator />
                  </RootNavigationContext.Provider>
                )
              }
            </Stack.Screen>
            <Stack.Screen
              name="ReduxSelectCommonActions"
              component={ReduxSelectCommonActionsScreen}
            />
            <Stack.Screen
              name="SwitchProfile"
              component={SwitchProfileScreen}
            />
            <Stack.Screen name="NewProfile" component={NewProfileScreen} />
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
            <Stack.Screen
              name="SaveCollection"
              component={SaveCollectionScreen}
            />
            <Stack.Screen name="SaveItem" component={SaveItemScreen} />
            <Stack.Screen name="OrderItems" component={OrderItemsScreen} />
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

const styles = StyleSheet.create({
  tabBarBlurView: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default Navigation;
