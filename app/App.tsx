import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { changeBarColors } from 'react-native-immersive-bars';

import { store, persistor, useAppSelector, useAppDispatch } from '@app/redux';

import Navigation from '@app/navigation';
import { usePersistedState } from '@app/hooks/usePersistedState';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useColors from '@app/hooks/useColors';
import { darkTheme, lightTheme } from '@app/theme';

import StorybookUIRoot, {
  SetStorybookModeFunctionContext,
} from '@app/StorybookUIRoot';

import SplashScreen from './SplashScreen';
import {
  selectActiveProfileName,
  selectActiveProfileConfig,
  selectActiveProfileRuntimeData,
  createProfile,
  prepareProfile,
  switchProfile,
} from '@app/features/profiles';

import DBSyncManager from './DBSyncManager';

function App() {
  const isDarkMode = useIsDarkMode();
  const theme = isDarkMode ? darkTheme : lightTheme;
  useEffect(() => {
    changeBarColors(isDarkMode);
  }, [isDarkMode]);

  const { backgroundColor } = useColors();

  /** A toggle to render the entire app as Storybook for development */
  const [storybookMode, setStorybookMode] = usePersistedState(
    'storybook_mode',
    false,
  );

  return (
    <Provider store={store}>
      <StatusBar
        translucent
        backgroundColor="rgba(0, 0, 0, 0.04)"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <PersistGate loading={<SplashScreen />} persistor={persistor}>
        <SetStorybookModeFunctionContext.Provider value={setStorybookMode}>
          {(() => {
            if (storybookMode) {
              // Render Storybook (only!)
              return (
                <>
                  <StatusBar
                    backgroundColor="rgba(0, 0, 0, 0.8)"
                    barStyle="light-content"
                  />
                  <StorybookUIRoot />
                </>
              );
            }

            // Render application
            return (
              <GestureHandlerRootView
                style={[styles.container, { backgroundColor }]}
              >
                <SafeAreaProvider>
                  <PaperProvider theme={theme}>
                    <ProfileReadyGate>
                      <>
                        <Navigation />
                        <DBSyncManager />
                      </>
                    </ProfileReadyGate>
                  </PaperProvider>
                </SafeAreaProvider>
              </GestureHandlerRootView>
            );
          })()}
        </SetStorybookModeFunctionContext.Provider>
      </PersistGate>
    </Provider>
  );
}

function ProfileReadyGate({ children }: { children: JSX.Element }) {
  const { ready, ignore } = useAppSelector(selectActiveProfileRuntimeData);
  const profileName = useAppSelector(selectActiveProfileName);
  const profileConfig = useAppSelector(selectActiveProfileConfig);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!profileName) {
      dispatch(switchProfile('default'));
      return;
    }

    if (!profileConfig) {
      dispatch(createProfile({ name: profileName }));
      return;
    }

    if (ignore) return;

    if (!ready) {
      dispatch(prepareProfile());
      return;
    }
  }, [dispatch, ignore, profileConfig, profileName, ready]);

  if (!ready) {
    return <SplashScreen />;
  }

  return children;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
