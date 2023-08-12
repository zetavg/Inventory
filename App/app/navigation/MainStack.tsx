import React, { useMemo } from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';

import { Log } from '@app/logger';

import CounterScreen from '@app/features/counter/screens/CounterScreen';
import CountersScreen from '@app/features/counters/screens/CountersScreen';
import DBSyncScreen from '@app/features/db-sync/screens/DBSyncScreen';
import DBSyncServerDetailScreen from '@app/features/db-sync/screens/DBSyncServerDetailScreen';
// import DBSyncConfigScreen from '@app/features/db-sync/config/screens/DBSyncConfigScreen';
// import PouchDBSyncDetailsScreen from '@app/features/db-sync/manage/screens/PouchDBSyncDetailsScreen';
// import PouchDBSyncLogsScreen from '@app/features/db-sync/manage/screens/PouchDBSyncLogsScreen';
// import PouchDBSyncScreen from '@app/features/db-sync/manage/screens/PouchDBSyncScreen';
import ChecklistScreen from '@app/features/inventory/screens/ChecklistScreen';
import ChecklistsScreen from '@app/features/inventory/screens/ChecklistsScreen';
import CollectionScreen from '@app/features/inventory/screens/CollectionScreen';
import CollectionsScreen from '@app/features/inventory/screens/CollectionsScreen';
import ItemScreen from '@app/features/inventory/screens/ItemScreen';
import SearchScreen from '@app/features/inventory/screens/SearchScreen';

import { DataTypeName } from '@app/data';

import AboutScreen from '@app/screens/AboutScreen';
import AppLogDetailScreen from '@app/screens/AppLogDetailScreen';
import AppLogsScreen from '@app/screens/AppLogsScreen';
import AppLogsSettingsScreen from '@app/screens/AppLogsSettingsScreen';
import DataListScreen from '@app/screens/dev-tools/data/DataListScreen';
import DataTypesScreen from '@app/screens/dev-tools/data/DataTypesScreen';
import DatumScreen from '@app/screens/dev-tools/data/DatumScreen';
import FixDataConsistencyErrorScreen from '@app/screens/dev-tools/data/FixDataConsistencyErrorScreen';
import FixDataConsistencyErrorsScreen from '@app/screens/dev-tools/data/FixDataConsistencyErrorsScreen';
import FixDataConsistencyScreen from '@app/screens/dev-tools/data/FixDataConsistencyScreen';
import PouchDBIndexDetailScreen from '@app/screens/dev-tools/pouchdb/PouchDBIndexDetailScreen';
import PouchDBIndexesScreen from '@app/screens/dev-tools/pouchdb/PouchDBIndexesScreen';
import PouchDBItemScreen from '@app/screens/dev-tools/pouchdb/PouchDBItemScreen';
import PouchDBScreen from '@app/screens/dev-tools/pouchdb/PouchDBScreen';
import PouchDBSettingsScreen from '@app/screens/dev-tools/pouchdb/PouchDBSettingsScreen';
import DevChangeIconScreen from '@app/screens/DevChangeIconScreen';
import DeveloperToolsScreen from '@app/screens/DeveloperToolsScreen';
import EPCTDSScreen from '@app/screens/EPCTDSScreen';
import GenericTextDetailsScreen from '@app/screens/GenericTextDetailsScreen';
import InventoryTabScreen from '@app/screens/InventoryTabScreen';
import LinguisticTaggerModuleIOSScreen from '@app/screens/LinguisticTaggerModuleIOSScreen';
import LoggerLogScreen from '@app/screens/LoggerLogScreen';
import MoreScreen from '@app/screens/MoreScreen';
import NewAppScreen from '@app/screens/NewAppScreen';
import PouchDBAttachmentScreen from '@app/screens/PouchDBAttachmentScreen';
import PouchDBAttachmentsScreen from '@app/screens/PouchDBAttachmentsScreen';
import ReduxActionDetailScreen from '@app/screens/ReduxActionDetailScreen';
import ReduxScreen from '@app/screens/ReduxScreen';
import RelationalPouchDBFixDataConsistencyScreen from '@app/screens/RelationalPouchDBFixDataConsistencyScreen';
import RelationalPouchDBScreen from '@app/screens/RelationalPouchDBScreen';
import RelationalPouchDBTypeDataDetailScreen from '@app/screens/RelationalPouchDBTypeDataDetailScreen';
import RelationalPouchDBTypeScreen from '@app/screens/RelationalPouchDBTypeScreen';
import RFIDUHFModuleScreen from '@app/screens/RFIDUHFModuleScreen';
import RNFSScreen from '@app/screens/RNFSScreen';
import SampleScreen from '@app/screens/SampleScreen';
import SettingsScreen from '@app/screens/SettingsScreen';
import SQLiteScreen from '@app/screens/SQLiteScreen';
import StorybookScreen from '@app/screens/StorybookScreen';

import useColors from '@app/hooks/useColors';
import useIsDarkMode from '@app/hooks/useIsDarkMode';

export type StackParamList = {
  More: undefined;
  Collections: undefined;
  Collection: { id: string; preloadedTitle?: string };
  Item: { id: string; preloadedTitle?: string };
  Checklists: undefined;
  Checklist: { id: string; initialTitle?: string };
  Search: { query?: string } | undefined;
  TmpInventoryTab: undefined;
  Settings: undefined;
  GenericTextDetails: {
    title?: string;
    details: string;
  };
  AppLogs?: {
    title?: string;
    headerLargeTitle?: boolean;
    showOptions?: boolean;
    filter?: {
      module?: string;
      function?: string;
      user?: string;
    };
  };
  AppLogsSettings: undefined;
  AppLogDetail: { log: Log };
  // PouchDBSync: undefined;
  // PouchDBSyncDetails: {
  //   serverName: string;
  // };
  // PouchDBSyncLogs: undefined;
  // DBSyncConfig: undefined;
  About: undefined;
  DeveloperTools: undefined;
  Redux: undefined;
  ReduxActionDetail: {
    action: any;
    prevState: any;
    nextState: any;
  };
  SQLite: undefined;
  PouchDB: undefined;
  PouchDBSettings: {
    searchFields: Record<string, number> | Array<string>;
    setSearchFields: React.Dispatch<
      React.SetStateAction<Record<string, number> | Array<string>>
    >;
    searchLanguages: Array<string>;
    setSearchLanguages: React.Dispatch<React.SetStateAction<Array<string>>>;
    resetSearchIndexRef: React.MutableRefObject<() => Promise<void>>;
  };
  PouchDBIndexes: undefined;
  PouchDBIndexDetail: { index: PouchDB.Find.Index };
  PouchDBItem: { id: string };
  DataTypes: undefined;
  DataList: { type: DataTypeName };
  Datum: { type: DataTypeName; id: string; preloadedTitle?: string };
  FixDataConsistency: undefined;
  FixDataConsistencyErrors: {
    errors: ReadonlyArray<{ id?: string; rawId: string; error: unknown }>;
  };
  FixDataConsistencyError: {
    error: { id?: string; rawId: string; error: unknown };
  };
  DBSync: undefined;
  DBSyncServerDetail: { id: string };
  RelationalPouchDB: undefined;
  RelationalPouchDBType: {
    type: DataTypeName;
  };
  RelationalPouchDBTypeDataDetail: {
    type: DataTypeName;
    id: string | number;
    initialTitle?: string;
  };
  RelationalPouchDBFixDataConsistency: undefined;
  PouchDBAttachments: undefined;
  PouchDBAttachment: { id: string };
  RNFS: undefined;
  LinguisticTaggerModuleIOS: undefined;
  EPCTDS: undefined;
  RFIDUHFModule: undefined;
  DevChangeIcon: undefined;
  Counter: undefined;
  Counters: undefined;
  Sample: {
    showAppbar?: boolean;
    showSearch?: boolean;
    // autoFocusSearch?: boolean;
  };
  Storybook: undefined;
  NewAppScreen: undefined;
  LoggerLog: undefined;
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
  const { backgroundColor, iosHeaderTintColor } = useColors();

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
      <Stack.Screen name="More" component={MoreScreen} />

      <Stack.Screen name="TmpInventoryTab" component={InventoryTabScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen
        name="GenericTextDetails"
        component={GenericTextDetailsScreen}
      />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="DeveloperTools" component={DeveloperToolsScreen} />
      <Stack.Screen name="AppLogs" component={AppLogsScreen} />
      <Stack.Screen name="AppLogsSettings" component={AppLogsSettingsScreen} />
      <Stack.Screen name="AppLogDetail" component={AppLogDetailScreen} />
      <Stack.Screen name="Redux" component={ReduxScreen} />
      <Stack.Screen
        name="ReduxActionDetail"
        component={ReduxActionDetailScreen}
      />
      <Stack.Screen name="PouchDB" component={PouchDBScreen} />
      <Stack.Screen name="PouchDBSettings" component={PouchDBSettingsScreen} />
      <Stack.Screen name="PouchDBIndexes" component={PouchDBIndexesScreen} />
      <Stack.Screen
        name="PouchDBIndexDetail"
        component={PouchDBIndexDetailScreen}
      />
      <Stack.Screen name="PouchDBItem" component={PouchDBItemScreen} />
      <Stack.Screen name="DataTypes" component={DataTypesScreen} />
      <Stack.Screen name="DataList" component={DataListScreen} />
      <Stack.Screen name="Datum" component={DatumScreen} />
      <Stack.Screen
        name="FixDataConsistency"
        component={FixDataConsistencyScreen}
      />
      <Stack.Screen
        name="FixDataConsistencyErrors"
        component={FixDataConsistencyErrorsScreen}
      />
      <Stack.Screen
        name="FixDataConsistencyError"
        component={FixDataConsistencyErrorScreen}
      />
      <Stack.Screen name="DBSync" component={DBSyncScreen} />
      <Stack.Screen
        name="DBSyncServerDetail"
        component={DBSyncServerDetailScreen}
      />
      <Stack.Screen
        name="RelationalPouchDB"
        component={RelationalPouchDBScreen}
      />
      <Stack.Screen
        name="RelationalPouchDBType"
        component={RelationalPouchDBTypeScreen}
      />
      <Stack.Screen
        name="RelationalPouchDBTypeDataDetail"
        component={RelationalPouchDBTypeDataDetailScreen}
      />
      <Stack.Screen
        name="RelationalPouchDBFixDataConsistency"
        component={RelationalPouchDBFixDataConsistencyScreen}
      />
      <Stack.Screen
        name="PouchDBAttachments"
        component={PouchDBAttachmentsScreen}
      />
      <Stack.Screen
        name="PouchDBAttachment"
        component={PouchDBAttachmentScreen}
      />
      <Stack.Screen name="RNFS" component={RNFSScreen} />
      <Stack.Screen
        name="LinguisticTaggerModuleIOS"
        component={LinguisticTaggerModuleIOSScreen}
      />
      <Stack.Screen name="EPCTDS" component={EPCTDSScreen} />
      <Stack.Screen name="RFIDUHFModule" component={RFIDUHFModuleScreen} />
      <Stack.Screen name="SQLite" component={SQLiteScreen} />
      <Stack.Screen name="Sample" component={SampleScreen} />
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

      <Stack.Screen name="LoggerLog" component={LoggerLogScreen} />

      <Stack.Screen name="Collections" component={CollectionsScreen} />
      <Stack.Screen name="Collection" component={CollectionScreen} />
      <Stack.Screen name="Item" component={ItemScreen} />
      <Stack.Screen name="Checklists" component={ChecklistsScreen} />
      <Stack.Screen name="Checklist" component={ChecklistScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />

      <Stack.Screen name="DevChangeIcon" component={DevChangeIconScreen} />

      <Stack.Screen name="Counter" component={CounterScreen} />
      <Stack.Screen name="Counters" component={CountersScreen} />
      {/*<Stack.Screen name="PouchDBSync" component={PouchDBSyncScreen} />
      <Stack.Screen
        name="PouchDBSyncDetails"
        component={PouchDBSyncDetailsScreen}
      />
      <Stack.Screen name="PouchDBSyncLogs" component={PouchDBSyncLogsScreen} />
      <Stack.Screen name="DBSyncConfig" component={DBSyncConfigScreen} />*/}
    </Stack.Navigator>
  );
}

export default MainStack;