import React, { useMemo } from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useColors from '@app/hooks/useColors';

import MoreScreen from '@app/screens/MoreScreen';
import SettingsScreen from '@app/screens/SettingsScreen';
import GenericTextDetailsScreen from '@app/screens/GenericTextDetailsScreen';
import DeveloperToolsScreen from '@app/screens/DeveloperToolsScreen';
import ReduxScreen from '@app/screens/ReduxScreen';
import ReduxActionDetailScreen from '@app/screens/ReduxActionDetailScreen';
import PouchDBScreen from '@app/screens/PouchDBScreen';
import SQLiteScreen from '@app/screens/SQLiteScreen';
import PouchDBItemScreen from '@app/screens/PouchDBItemScreen';
import RelationalPouchDBScreen from '@app/screens/RelationalPouchDBScreen';
import RelationalPouchDBTypeScreen from '@app/screens/RelationalPouchDBTypeScreen';
import RelationalPouchDBTypeDetailScreen from '@app/screens/RelationalPouchDBTypeDetailScreen';
import PouchDBAttachmentsScreen from '@app/screens/PouchDBAttachmentsScreen';
import PouchDBAttachmentScreen from '@app/screens/PouchDBAttachmentScreen';
import EPCTDSScreen from '@app/screens/EPCTDSScreen';
import RFIDUHFUARTScreen from '@app/screens/RFIDUHFUARTScreen';
import SampleScreen from '@app/screens/SampleScreen';
import StorybookScreen from '@app/screens/StorybookScreen';
import NewAppScreen from '@app/screens/NewAppScreen';

import CounterScreen from '@app/features/counter/screens/CounterScreen';
import PouchDBSyncScreen from '@app/features/db-sync/manage/screens/PouchDBSyncScreen';
import PouchDBSyncDetailsScreen from '@app/features/db-sync/manage/screens/PouchDBSyncDetailsScreen';
import PouchDBSyncLogsScreen from '@app/features/db-sync/manage/screens/PouchDBSyncLogsScreen';
import DBSyncConfigScreen from '@app/features/db-sync/config/screens/DBSyncConfigScreen';

import type { TypeName as DataTypeName } from '@app/db/schema';

export type StackParamList = {
  More: undefined;
  Settings: undefined;
  GenericTextDetails: {
    title?: string;
    details: string;
  };
  PouchDBSync: undefined;
  PouchDBSyncDetails: {
    serverName: string;
  };
  PouchDBSyncLogs: undefined;
  DBSyncConfig: undefined;
  DeveloperTools: undefined;
  Redux: undefined;
  ReduxActionDetail: {
    action: any;
    prevState: any;
    nextState: any;
  };
  SQLite: undefined;
  PouchDB: undefined;
  PouchDBItem: { id: string };
  RelationalPouchDB: undefined;
  RelationalPouchDBType: {
    type: DataTypeName;
  };
  RelationalPouchDBTypeDetail: {
    type: DataTypeName;
    id: string | number;
  };
  PouchDBAttachments: undefined;
  PouchDBAttachment: { id: string };
  EPCTDS: undefined;
  RFIDUHFUART: undefined;
  Counter: undefined;
  Sample: {
    showAppbar?: boolean;
    showSearch?: boolean;
    // autoFocusSearch?: boolean;
  };
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
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen
        name="GenericTextDetails"
        component={GenericTextDetailsScreen}
      />
      <Stack.Screen name="DeveloperTools" component={DeveloperToolsScreen} />
      <Stack.Screen name="Redux" component={ReduxScreen} />
      <Stack.Screen
        name="ReduxActionDetail"
        component={ReduxActionDetailScreen}
      />
      <Stack.Screen name="PouchDB" component={PouchDBScreen} />
      <Stack.Screen name="PouchDBItem" component={PouchDBItemScreen} />
      <Stack.Screen
        name="RelationalPouchDB"
        component={RelationalPouchDBScreen}
      />
      <Stack.Screen
        name="RelationalPouchDBType"
        component={RelationalPouchDBTypeScreen}
      />
      <Stack.Screen
        name="RelationalPouchDBTypeDetail"
        component={RelationalPouchDBTypeDetailScreen}
      />
      <Stack.Screen
        name="PouchDBAttachments"
        component={PouchDBAttachmentsScreen}
      />
      <Stack.Screen
        name="PouchDBAttachment"
        component={PouchDBAttachmentScreen}
      />
      <Stack.Screen name="EPCTDS" component={EPCTDSScreen} />
      <Stack.Screen name="RFIDUHFUART" component={RFIDUHFUARTScreen} />
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

      <Stack.Screen name="Counter" component={CounterScreen} />
      <Stack.Screen name="PouchDBSync" component={PouchDBSyncScreen} />
      <Stack.Screen
        name="PouchDBSyncDetails"
        component={PouchDBSyncDetailsScreen}
      />
      <Stack.Screen name="PouchDBSyncLogs" component={PouchDBSyncLogsScreen} />
      <Stack.Screen name="DBSyncConfig" component={DBSyncConfigScreen} />
    </Stack.Navigator>
  );
}

export default MainStack;
