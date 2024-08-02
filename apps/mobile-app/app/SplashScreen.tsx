import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  BottomTabBar,
  createBottomTabNavigator as createTabNavigator,
} from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Navigation from '@app/navigation';

import useColors from '@app/hooks/useColors';

import useIsDarkMode from './hooks/useIsDarkMode';
import { getTabBar, useDefaultTabScreenOptions } from './navigation/Navigation';
import cs from './utils/commonStyles';

const DEV_TOOLS_ENABLE_THRESHOLD = 24;

function SplashScreen() {
  const SplashScreenComponent = Platform.select({
    ios: SplashScreenIOS,
    android: SplashScreenAndroid,
    default: SplashScreenIOS,
  });
  const { backgroundColor, contentTextColor } = useColors();
  const [pressCount, setPressCount] = useState(0);

  const toDevToolsRemaining = DEV_TOOLS_ENABLE_THRESHOLD - pressCount;

  if (toDevToolsRemaining <= 0) {
    return (
      <SafeAreaProvider>
        <Navigation onlyDevTools />
      </SafeAreaProvider>
    );
  }

  return (
    <SplashScreenComponent>
      <TouchableWithoutFeedback onPress={() => setPressCount(c => c + 1)}>
        <View style={[styles.devToolsTrigger, cs.centerChildren]}>
          {pressCount > 5 && (
            <Text style={{ color: contentTextColor }}>
              {toDevToolsRemaining}
            </Text>
          )}
        </View>
      </TouchableWithoutFeedback>
    </SplashScreenComponent>
  );
}

function SplashScreenIOS({ children }: { children: React.ReactNode }) {
  const { backgroundColor, contentTextColor } = useColors();

  const Tab = createTabNavigator();
  const defaultTabScreenOptions = useDefaultTabScreenOptions;
  const isDarkMode = useIsDarkMode();

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          backBehavior="none"
          screenOptions={defaultTabScreenOptions}
          tabBar={getTabBar(isDarkMode)}
        >
          <Tab.Screen
            name="DashboardTab"
            children={() => (
              <View style={[cs.flex1, cs.centerChildren, { backgroundColor }]}>
                {children}
              </View>
            )}
            options={{
              title: '',
              // eslint-disable-next-line react/no-unstable-nested-components
              tabBarIcon: () => <></>,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

function SplashScreenAndroid({ children }: { children: React.ReactNode }) {
  const { backgroundColor, contentTextColor } = useColors();

  return (
    <View style={[cs.flex1, cs.centerChildren, { backgroundColor }]}>
      <Text style={{ color: contentTextColor }}>Loading...</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  devToolsTrigger: {
    width: 100,
    height: 100,
  },
});

export default SplashScreen;
