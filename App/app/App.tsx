import React, { useEffect, useState } from 'react';
import { DeviceEventEmitter, StatusBar, StyleSheet } from 'react-native';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { changeBarColors } from 'react-native-immersive-bars';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  actions,
  persistor,
  selectors,
  store,
  useAppDispatch,
  useAppSelector,
} from '@app/redux';
import DBSyncManager from '@app/features/db-sync/DBSyncManager';

import { useDB } from '@app/db';

import { ExposeSafeAreaInsets } from '@app/utils/exposedSafeAreaInsets';

import Navigation from '@app/navigation';

import useColors from '@app/hooks/useColors';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import { usePersistedState } from '@app/hooks/usePersistedState';

import { darkTheme, lightTheme } from '@app/theme';

import StorybookUIRoot, {
  SetStorybookModeFunctionContext,
} from '@app/StorybookUIRoot';

import onAppLoaded from './onAppLoaded';
import SplashScreen from './SplashScreen';

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
    <ActionSheetProvider>
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
                    <SafeAreaProvider>
                      <StorybookUIRoot />
                    </SafeAreaProvider>
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
                      <AppReadyGate>
                        <>
                          <Navigation />
                          <DBSyncManager />
                        </>
                      </AppReadyGate>
                    </PaperProvider>
                    <ExposeSafeAreaInsets />
                  </SafeAreaProvider>
                </GestureHandlerRootView>
              );
            })()}
          </SetStorybookModeFunctionContext.Provider>
        </PersistGate>
      </Provider>
    </ActionSheetProvider>
  );
}

function AppReadyGate({ children }: { children: JSX.Element }) {
  const rehydratedKeys = useAppSelector(selectors.rehydratedKeys);
  const profileUuidAndNames = useAppSelector(
    selectors.profiles.profileUuidAndNames,
  );
  const currentProfileUuid = useAppSelector(
    selectors.profiles.currentProfileUuid,
  );
  const currentProfileName = useAppSelector(
    selectors.profiles.currentProfileName,
  );

  const dispatch = useAppDispatch();

  const stateRehydrated =
    rehydratedKeys.includes('state') &&
    rehydratedKeys.includes('state/profiles-sensitive');

  useEffect(() => {
    if (!stateRehydrated) return;

    if (Object.keys(profileUuidAndNames).length <= 0) {
      dispatch(actions.profiles.newProfile({ name: 'Default', color: 'blue' }));
    } else if (!currentProfileName) {
      dispatch(
        actions.profiles.switchProfile(Object.keys(profileUuidAndNames)[0]),
      );
    }

    onAppLoaded();
  }, [stateRehydrated, profileUuidAndNames, dispatch, currentProfileName]);

  // We need to have a timeout and call onAppLoaded to prevent the launch screen from being displayed indefinitely.
  useEffect(() => {
    setTimeout(() => {
      onAppLoaded();
    }, 5000);
  }, []);

  const dbs = useDB();
  // To prevent race conditions with the DB initialization, we wait for the DB to be ready before rendering the app.
  if (
    Object.entries(dbs)
      .filter(([k]) => !k.startsWith('_'))
      .filter(([_, v]) => !v).length > 0
  ) {
    return <SplashScreen />;
  }

  // const [dbReady, setDbReady] = useState(false);
  // useEffect(() => {
  //   if (!dbs.db || !dbs.logsDB) {
  //     setDbReady(false);
  //   }

  //   const timer = setTimeout(() => {
  //     setDbReady(true);
  //   }, 10);

  //   return () => {
  //     clearTimeout(timer);
  //   };
  // }, [currentProfileUuid, dbs]);

  // if (!stateRehydrated) {
  //   return <SplashScreen />;
  // }

  // if (!currentProfileName) {
  //   return <SplashScreen />;
  // }

  // To prevent race conditions with the DB initialization, we wait for the DB to be ready before rendering the app.
  // if (!dbReady) {
  //   return <SplashScreen />;
  // }

  // const { ready, ignore } = useAppSelector(selectActiveProfileRuntimeData);
  // const profileName = useAppSelector(selectActiveProfileName);
  // const profileConfig = useAppSelector(selectActiveProfileConfig);

  // const dispatch = useAppDispatch();

  // useEffect(() => {
  //   if (!profileName) {
  //     dispatch(switchProfile('default'));
  //     return;
  //   }

  //   if (!profileConfig) {
  //     dispatch(createProfile({ name: profileName }));
  //     return;
  //   }

  //   if (ignore) return;

  //   if (!ready) {
  //     dispatch(prepareProfile());
  //     return;
  //   }
  // }, [dispatch, ignore, profileConfig, profileName, ready]);

  // if (!ready) {
  //   return <SplashScreen />;
  // }

  return <React.Fragment key={currentProfileUuid}>{children}</React.Fragment>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
