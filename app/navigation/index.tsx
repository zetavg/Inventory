import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack';

import MainStack, { DemoDetailsScreen } from './MainStack';
import RootNavigationContext from './RootNavigationContext';

const Tab = createBottomTabNavigator();
const DEFAULT_TAB_SCREEN_OPTIONS = {
  headerShown: false,
};

const Stack = createStackNavigator();
export type RootStackParamList = {
  Main: undefined;
  DemoDetails: { id: string };
};
const DEFAULT_ROOT_STACK_SCREEN_OPTIONS = {
  headerShown: false,
  gestureEnabled: true,
  ...TransitionPresets.ModalPresentationIOS,
};

function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={DEFAULT_ROOT_STACK_SCREEN_OPTIONS}>
        <Stack.Screen name="Main">
          {({ navigation }) => (
            <RootNavigationContext.Provider value={navigation}>
              <Tab.Navigator
                backBehavior="none"
                screenOptions={DEFAULT_TAB_SCREEN_OPTIONS}
              >
                <Tab.Screen
                  name="Home"
                  children={() => <MainStack initialRouteName="DemoHome" />}
                />
                <Tab.Screen
                  name="Settings"
                  children={() => <MainStack initialRouteName="DemoDetails" />}
                />
              </Tab.Navigator>
            </RootNavigationContext.Provider>
          )}
        </Stack.Screen>
        <Stack.Screen name="DemoDetails" component={DemoDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Navigation;
