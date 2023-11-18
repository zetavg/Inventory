import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, Linking, Platform, StyleSheet, View } from 'react-native';
import {
  BottomTabBar,
  createBottomTabNavigator as createTabNavigator,
} from '@react-navigation/bottom-tabs';
import {
  DefaultTheme,
  NavigationContainer,
  NavigationContainerRefWithCurrent,
  useFocusEffect,
  useNavigationContainerRef,
} from '@react-navigation/native';
import {
  createStackNavigator,
  StackScreenProps,
  TransitionPresets,
} from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SFSymbol } from 'react-native-sfsymbols';
import { URL as PURL } from 'react-native-url-polyfill';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import { BlurView } from '@react-native-community/blur';
import color from 'color';

import EPCUtils from '@deps/epc-utils';

import { LogLevel } from '@app/logger/types';

import { IconName } from '@app/consts/icons';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';
// import DBSyncConfigUpdateScreen from '@app/features/db-sync/config/screens/DBSyncConfigUpdateScreen';
import DBSyncNewOrEditServerModalScreen from '@app/features/db-sync/screens/DBSyncNewOrEditServerModalScreen';
import AddIntegrationModalScreen from '@app/features/integrations/screens/AddIntegrationModalScreen';
import AirtableIntegrationScreen from '@app/features/integrations/screens/AirtableIntegrationScreen';
import NewOrEditAirtableIntegrationScreen from '@app/features/integrations/screens/NewOrEditAirtableIntegrationScreen';
import ExportItemsToCsvScreen from '@app/features/inventory/screens/ExportItemsToCsvScreen';
import ImportItemsFromCsvScreen from '@app/features/inventory/screens/ImportItemsFromCsvScreen';
import OrderItemsScreen from '@app/features/inventory/screens/OrderItemsScreen';
import SaveChecklistScreen from '@app/features/inventory/screens/SaveChecklistScreen';
import SaveCollectionScreen from '@app/features/inventory/screens/SaveCollectionScreen';
import SaveItemScreen from '@app/features/inventory/screens/SaveItemScreen';
import SearchOptionsScreen from '@app/features/inventory/screens/SearchOptionsScreen';
import SelectCollectionModalScreen from '@app/features/inventory/screens/SelectCollectionModalScreen';
import SelectCurrencyModalScreen from '@app/features/inventory/screens/SelectCurrencyModalScreen';
import SelectItemModalScreen from '@app/features/inventory/screens/SelectItemModalScreen';
import SelectItemTypeModalScreen from '@app/features/inventory/screens/SelectItemTypeModalScreen';
import NewOrEditLabelPrinterModalScreen from '@app/features/label-printers/screens/NewOrEditLabelPrinterModalScreen';
import PrintLabelModalScreen from '@app/features/label-printers/screens/PrintLabelModalScreen';
import TestPrinterConfigModalScreen from '@app/features/label-printers/screens/TestPrinterConfigModalScreen';
import CreateOrUpdateProfileScreen from '@app/features/profiles/screens/CreateOrUpdateProfileScreen';
import DeleteProfileScreen from '@app/features/profiles/screens/DeleteProfileScreen';
import NewProfileScreen from '@app/features/profiles/screens/NewProfileScreen';
import SelectProfileToEditScreen from '@app/features/profiles/screens/SelectProfileToEditScreen';
import SwitchProfileScreen from '@app/features/profiles/screens/SwitchProfileScreen';
import RFIDSheet, { RFIDSheetOptions } from '@app/features/rfid/RFIDSheet';

import { DataType, DataTypeName, DataTypeWithID, useConfig } from '@app/data';
import { getGetConfig, getGetData, getGetDatum } from '@app/data/functions';

import { useDB } from '@app/db';

import commonStyles from '@app/utils/commonStyles';

import AppLogsFilterScreen from '@app/screens/AppLogsFilterScreen';
import DatePickerModalScreen from '@app/screens/DatePickerModalScreen';
import DemoModalScreen from '@app/screens/DemoModalScreen';
import SaveDataModalScreen from '@app/screens/dev-tools/data/SaveDataModalScreen';
import PouchDBPutDataModalScreen from '@app/screens/dev-tools/pouchdb/PouchDBPutDataModalScreen';
import FixDataConsistencyScreen from '@app/screens/FixDataConsistencyScreen';
import GetSecretsModalScreen from '@app/screens/GetSecretsModalScreen';
import OnboardingScreen from '@app/screens/OnboardingScreen';
import ReduxSelectActionScreen from '@app/screens/ReduxSelectActionScreen';
import SampleModalScreen from '@app/screens/SampleModalScreen';
import SelectIconScreen from '@app/screens/SelectIconScreen';

import useColors from '@app/hooks/useColors';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useLogger from '@app/hooks/useLogger';
import useTheme from '@app/hooks/useTheme';

import { UIGroupProps } from '@app/components/UIGroup/types';

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
  FixDataConsistency: undefined;
  DBSyncConfigUpdate: {
    name?: string;
  };
  NewOrEditLabelPrinterModal: { id?: string };
  TestPrinterConfigModal: { printerConfig: string };
  PrintLabelModal: { itemIds: ReadonlyArray<string> };
  SelectCollection: {
    callback: (value: string) => void;
    defaultValue?: string;
  };
  SelectItem: {
    callback: (value: string) => void;
    defaultValue?: string;
    as?: 'container';
  };
  SelectCurrency: {
    callback: (value: string) => void;
    defaultValue?: string;
  };
  SaveCollection: {
    initialData?: Partial<DataTypeWithID<'collection'>>;
    afterDelete?: () => void;
  };
  SaveItem: {
    initialData?: Partial<DataTypeWithID<'item'>>;
    afterSave?: (data: Partial<DataTypeWithID<'item'>>) => void;
    afterDelete?: () => void;
  };
  SelectItemType: {
    callback: (itemType: DataType<'item'>['item_type']) => void;
    defaultValue?: DataType<'item'>['item_type'];
  };
  SaveChecklist: {
    initialData?: Partial<any /* TODO */>;
    afterDelete?: () => void;
  };
  OrderItems: {
    orderedItems: ReadonlyArray<DataTypeWithID<'item'>>;
    onSaveFunctionRef: {
      current: (
        orderedItems: ReadonlyArray<DataTypeWithID<'item'>>,
      ) => Promise<boolean>;
    };
    // updateOrderFunctionRef?: { current: (newOrder: string[]) => void };
    // itemDeleteFunctionRef?: { current: (id: string) => Promise<boolean> };
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
  DatePicker: {
    callback: (value: string) => void;
    defaultValue?: string;
  };
  AddIntegration: undefined;
  AirtableIntegration: {
    integrationId: string;
  };
  NewOrEditAirtableIntegration: {
    integrationId?: string;
    afterDelete?: () => void;
  };
  GetSecrets: {
    secrets: ReadonlyArray<{
      name: string;
      key: string;
      description: UIGroupProps['footer'];
      defaultValue?: string;
    }>;
    callback: (secrets: { [key: string]: string } | null) => void;
  };
  AppLogsFilter: {
    initialState: {
      module?: string | undefined;
      function?: string | undefined;
      user?: string | undefined;
      levels: ReadonlyArray<LogLevel>;
    };
    selections: {
      module?: ReadonlyArray<string> | undefined;
      function?: ReadonlyArray<string> | undefined;
      user?: ReadonlyArray<string> | undefined;
    };
    callback: (data: {
      module?: string | undefined;
      function?: string | undefined;
      user?: string | undefined;
      levels: ReadonlyArray<LogLevel>;
    }) => void;
  };
  ReduxSelectAction: {
    callback: (data: string) => void;
  };
  PouchDBPutDataModal: {
    id?: string;
    jsonData?: string;
  };
  SaveData: {
    type: DataTypeName;
    id?: string;
    initialData?: Partial<DataType<DataTypeName>>;
    afterSave?: (payload: { __type: DataTypeName; __id?: string }) => void;
  };
  DBSyncNewOrEditServerModal: {
    id?: string;
  };
  SampleModal: { showAppbar?: boolean };
  DemoModal: undefined;
  DemoDetails: { id: string };
};
const DEFAULT_ROOT_STACK_SCREEN_OPTIONS = {
  headerShown: false,
  gestureEnabled: Platform.OS === 'android' ? false : true, // Will mess up the ScrollView in modals on Android
  ...TransitionPresets.ModalPresentationIOS,
  // ModalContentScrollView will determine if it should capture the scroll event, or let the navigation handle it to use gesture to close the modal.
  gestureResponseDistance: 4000, // Default is 50
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
  const logger = useLogger('navigation');
  const isDarkMode = useIsDarkMode();

  const { backgroundColor } = useColors();

  const navigationTheme = useMemo(
    () => ({
      ...NAVIGATION_CONTAINER_THEME,
      colors: {
        ...NAVIGATION_CONTAINER_THEME.colors,
        background: backgroundColor,
      },
      dark: isDarkMode,
    }),
    [backgroundColor, isDarkMode],
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

  const navigationRef = useNavigationContainerRef();

  useDeepLinkHandling({ navigationRef });

  return (
    <NavigationContainer theme={navigationTheme} ref={navigationRef}>
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
              {({ navigation, route }) => {
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
                    <OnboardingScreenOpener
                      navigation={navigation}
                      route={route}
                    />
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
            <Stack.Screen name="GetSecrets" component={GetSecretsModalScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen
              name="AppLogsFilter"
              component={AppLogsFilterScreen}
            />
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
              name="FixDataConsistency"
              component={FixDataConsistencyScreen}
            />
            {/*<Stack.Screen
              name="DBSyncConfigUpdate"
              component={DBSyncConfigUpdateScreen}
            />*/}
            <Stack.Screen name="SampleModal" component={SampleModalScreen} />
            <Stack.Screen name="DemoModal" component={DemoModalScreen} />
            <Stack.Screen
              name="PouchDBPutDataModal"
              component={PouchDBPutDataModalScreen}
            />
            <Stack.Screen name="SaveData" component={SaveDataModalScreen} />
            <Stack.Screen
              name="DBSyncNewOrEditServerModal"
              component={DBSyncNewOrEditServerModalScreen}
            />
            <Stack.Screen
              name="NewOrEditLabelPrinterModal"
              component={NewOrEditLabelPrinterModalScreen}
            />
            <Stack.Screen
              name="TestPrinterConfigModal"
              component={TestPrinterConfigModalScreen}
            />
            <Stack.Screen
              name="PrintLabelModal"
              component={PrintLabelModalScreen}
            />
            <Stack.Screen name="DatePicker" component={DatePickerModalScreen} />
            <Stack.Screen name="SelectIcon" component={SelectIconScreen} />
            <Stack.Screen
              name="SelectCollection"
              component={SelectCollectionModalScreen}
            />
            <Stack.Screen
              name="SelectItemType"
              component={SelectItemTypeModalScreen}
            />
            <Stack.Screen name="SelectItem" component={SelectItemModalScreen} />
            <Stack.Screen
              name="SelectCurrency"
              component={SelectCurrencyModalScreen}
            />
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
            <Stack.Screen
              name="AddIntegration"
              component={AddIntegrationModalScreen}
            />
            <Stack.Screen
              name="AirtableIntegration"
              component={AirtableIntegrationScreen}
            />
            <Stack.Screen
              name="NewOrEditAirtableIntegration"
              component={NewOrEditAirtableIntegrationScreen}
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
          children={() => <MainStack initialRouteName="Dashboard" />}
          options={{
            title: 'Dashboard',
            // eslint-disable-next-line react/no-unstable-nested-components
            tabBarIcon: ({ focused, ...props }) =>
              Platform.OS === 'ios' ? (
                <SFSymbol
                  name={focused ? 'square.grid.2x2.fill' : 'square.grid.2x2'}
                  {...props}
                />
              ) : (
                <MaterialCommunityIcon
                  name={focused ? 'view-dashboard' : 'view-dashboard-outline'}
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
            // eslint-disable-next-line react/no-unstable-nested-components
            tabBarIcon: ({ focused, ...props }) =>
              Platform.OS === 'ios' ? (
                <SFSymbol
                  name={focused ? 'square.grid.3x3.fill' : 'square.grid.3x3'}
                  {...props}
                />
              ) : (
                <MaterialCommunityIcon
                  name={focused ? 'view-grid' : 'view-grid-outline'}
                  {...props}
                />
              ),
          }}
        />
        <Tab.Screen
          name="ScanTab"
          children={() => <MainStack initialRouteName="More" />}
          options={{
            title: 'Scan',
            // eslint-disable-next-line react/no-unstable-nested-components
            tabBarIcon: ({ focused, ...props }) =>
              Platform.OS === 'ios' ? (
                <SFSymbol
                  name={focused ? 'viewfinder' : 'viewfinder'}
                  {...props}
                />
              ) : (
                <MaterialCommunityIcon
                  name={focused ? 'line-scan' : 'line-scan'}
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
            // eslint-disable-next-line react/no-unstable-nested-components
            tabBarIcon: ({ focused, ...props }) =>
              Platform.OS === 'ios' ? (
                <SFSymbol
                  name={focused ? 'magnifyingglass' : 'magnifyingglass'}
                  {...props}
                />
              ) : (
                <MaterialCommunityIcon
                  name={focused ? 'magnify' : 'magnify'}
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
            // eslint-disable-next-line react/no-unstable-nested-components
            tabBarIcon: ({ focused, ...props }) =>
              Platform.OS === 'ios' ? (
                <SFSymbol
                  name={focused ? 'ellipsis.circle.fill' : 'ellipsis.circle'}
                  {...props}
                />
              ) : (
                <MaterialCommunityIcon
                  name={
                    focused
                      ? 'dots-horizontal-circle'
                      : 'dots-horizontal-circle-outline'
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

function OnboardingScreenOpener({
  navigation,
}: StackScreenProps<RootStackParamList>) {
  const isSetupNotDone = useAppSelector(selectors.profiles.isSetupNotDone);
  useEffect(() => {
    if (isSetupNotDone) {
      navigation.push('Onboarding');
    }
  }, [isSetupNotDone, navigation]);
  return null;
}

function useDeepLinkHandling({
  navigationRef,
}: {
  navigationRef: NavigationContainerRefWithCurrent<{}>;
}) {
  const logger = useLogger('deep-link-handling');

  const { db } = useDB();
  const dbRef = useRef(db);
  dbRef.current = db;

  const dispatch = useAppDispatch();
  const profiles = useAppSelector(selectors.profiles.profiles);
  const currentProfileUuid = useAppSelector(
    selectors.profiles.currentProfileUuid,
  );
  const profilesRef = useRef(profiles);
  profilesRef.current = profiles;

  const handleURL = useCallback(
    async (urlStr: string, isInitial?: boolean) => {
      if (!dbRef.current) {
        logger.error(
          `Can't handle URL: "${urlStr}", DB is not ready. Please try again.`,
          {
            showAlert: true,
          },
        );
        return;
      }
      logger.debug(`Handling URL: "${urlStr}".`);

      try {
        const url = new PURL(urlStr);

        let shouldSwitchProfileTo: string | null = null;

        const profileUuid =
          url.searchParams.get('p') || url.searchParams.get('profile');
        if (profileUuid && profileUuid !== currentProfileUuid) {
          shouldSwitchProfileTo = profileUuid;
        }

        const getConfig = getGetConfig({ db: dbRef.current });
        const getDatum = getGetDatum({ db: dbRef.current });
        const getData = getGetData({ db: dbRef.current });

        const configUuidMatcher = url.searchParams.get('c');
        if (configUuidMatcher) {
          const currentConfigUuid = (await getConfig()).uuid;
          if (!currentConfigUuid.startsWith(configUuidMatcher)) {
            const [pId] =
              Object.entries(profilesRef.current)
                .sort(([, a], [, b]) => a.name.localeCompare(b.name))
                .find(([_id, p]) =>
                  p.configUuid?.startsWith(configUuidMatcher),
                ) || [];
            console.log('profilesRef.current 398923', profilesRef.current);
            if (!pId) {
              Alert.alert(
                'Profile Not Found',
                `Profile with config UUID matching "${configUuidMatcher}" does not exists.`,
              );
              return;
            }

            shouldSwitchProfileTo = pId;
          }
        }

        if (shouldSwitchProfileTo) {
          const switchProfileAndHandleUrlLater = () => {
            if (!shouldSwitchProfileTo) return;

            if (
              !Object.keys(profilesRef.current).includes(shouldSwitchProfileTo)
            ) {
              Alert.alert(
                'Profile Not Found',
                `Profile with ID "${shouldSwitchProfileTo}" does not exists.`,
              );
              return;
            }
            useDeepLinkHandling.deepLinkURL = urlStr;
            dispatch(actions.profiles.switchProfile(shouldSwitchProfileTo));
          };

          if (isInitial) {
            switchProfileAndHandleUrlLater();
          } else {
            Alert.alert(
              'Switching Profile',
              "You're about to switch to another profile. The app will be reloaded and all your unsaved changes will be discarded.",
              [
                {
                  text: 'Do Not Switch',
                  style: 'cancel',
                  isPreferred: false,
                },
                {
                  text: 'Switch Profile and Proceed',
                  style: 'destructive',
                  onPress: switchProfileAndHandleUrlLater,
                  isPreferred: true,
                },
              ],
            );
          }

          return;
        }

        useDeepLinkHandling.deepLinkURL = null;

        const openItemWithIAR = async (iar: string) => {
          let iarWithDotsAdded: string | null = null;
          if (!iar.includes('.')) {
            const config = await getConfig();
            const collectionReferenceDigits =
              EPCUtils.getCollectionReferenceDigits({
                companyPrefix: config.rfid_tag_company_prefix,
                iarPrefix: config.rfid_tag_individual_asset_reference_prefix,
              });
            iarWithDotsAdded = [
              iar.slice(0, collectionReferenceDigits),
              iar.slice(collectionReferenceDigits, iar.length - 4),
              iar.slice(iar.length - 4),
            ].join('.');
          }
          const items = await getData(
            'item',
            { individual_asset_reference: iar },
            { limit: 1 },
          );
          let item = items[0];
          if (!item && iarWithDotsAdded) {
            const items2 = await getData(
              'item',
              { individual_asset_reference: iarWithDotsAdded },
              { limit: 1 },
            );
            item = items2[0];
          }
          if (!item) {
            Alert.alert(
              'Item Not Found',
              `Can't find item with individual asset reference: "${iar}" (URL: "${urlStr}").`,
            );
          } else {
            (navigationRef.current?.navigate as any)('Item', {
              id: item.__id,
              preloadedTitle:
                typeof item.name === 'string' ? item.name : undefined,
            });
          }
        };

        const openItem = async (id: string) => {
          const item = await getDatum('item', id);
          if (!item?.__id) {
            Alert.alert(
              'Item Not Found',
              `Can't find item with ID: "${id}" (URL: "${urlStr}").`,
            );
          } else {
            (navigationRef.current?.navigate as any)('Item', {
              id: item.__id,
              preloadedTitle:
                typeof item.name === 'string' ? item.name : undefined,
            });
          }
        };

        const openCollection = async (id: string) => {
          const collection = await getDatum('collection', id);
          if (!collection?.__id) {
            Alert.alert(
              'Collection Not Found',
              `Can't find collection with ID: "${id}" (URL: "${urlStr}").`,
            );
          } else {
            (navigationRef.current?.navigate as any)('Collection', {
              id: collection.__id,
              preloadedTitle:
                typeof collection.name === 'string'
                  ? collection.name
                  : undefined,
            });
          }
        };

        const [, ...path] = url.pathname.split('/');
        switch (url.host) {
          case 'iar': {
            openItemWithIAR(path[0]);
            break;
          }
          case 'items':
          case 'item': {
            openItem(path[0]);
            break;
          }

          case 'collections':
          case 'collection': {
            openCollection(path[0]);
            break;
          }

          case '_':
          case 'null':
          case 'nothing': {
            break;
          }

          default: {
            Alert.alert('Unknown URL', `Unknown URL: ${urlStr}`);
          }
        }
      } catch (e) {
        logger.error(`Can't handle URL: "${urlStr}": ${e}`, {
          showAlert: true,
          details: JSON.stringify(e),
        });
      }
    },
    [currentProfileUuid, dispatch, logger, navigationRef],
  );

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) =>
      handleURL(url),
    );
    return () => {
      subscription.remove();
    };
  }, [handleURL]);
  useEffect(() => {
    if (!db) return;

    const timer = setTimeout(async () => {
      if (!useDeepLinkHandling.initialURLProceeded) {
        // Process URL from app launch
        const url = await Linking.getInitialURL();
        useDeepLinkHandling.initialURLProceeded = true; // So that we will not process it again (e.g. after switching to another profile, causing Navigation to reload)
        if (url) handleURL(url, true);
      } else if (useDeepLinkHandling.deepLinkURL) {
        // Process URL from profile switched, etc.
        handleURL(useDeepLinkHandling.deepLinkURL);
        useDeepLinkHandling.deepLinkURL = null;
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [db, handleURL]);

  useEffect(() => {
    if (!db) return;

    (async () => {
      const cfg = await getGetConfig({ db })();
      if (!currentProfileUuid) return;
      if (!profiles[currentProfileUuid]?.setupDone) return;

      if (profiles[currentProfileUuid]?.configUuid !== cfg.uuid) {
        dispatch(
          actions.profiles.markCurrentProfileAsSetupDone({
            configUuid: cfg.uuid,
          }),
        );
      }
    })();
  }, [db, currentProfileUuid, dispatch, profiles]);
}

useDeepLinkHandling.initialURLProceeded = false;
useDeepLinkHandling.deepLinkURL = null as string | null;

const styles = StyleSheet.create({
  tabBarBlurView: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default Navigation;
