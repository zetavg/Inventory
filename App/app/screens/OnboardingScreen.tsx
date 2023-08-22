import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BackHandler,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps, TransitionPresets } from '@react-navigation/stack';
import { createStackNavigator } from '@react-navigation/stack';
import { Appbar } from 'react-native-paper';

import { BlurView as RNBlurView } from '@react-native-community/blur';

import { GITHUB_PROJECT_URL, USER_DOCUMENTS_URL } from '@app/consts/info';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';
import useNewOrEditServerUI from '@app/features/db-sync/hooks/useNewOrEditServerUI';

import cs from '@app/utils/commonStyles';
import commonStyles from '@app/utils/commonStyles';

import { RootStackParamList } from '@app/navigation';

import useColors from '@app/hooks/useColors';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useScrollViewAutomaticallyAdjustKeyboardInsetsFix from '@app/hooks/useScrollViewAutomaticallyAdjustKeyboardInsetsFix';

import Button from '@app/components/Button';
import Text, { Link } from '@app/components/Text';
import UIGroup from '@app/components/UIGroup';

const SERVER_INITIAL_DATA = {
  name: 'Default Server',
  uri: '',
  username: '',
  password: '',
};

const BlurView = Platform.OS === 'ios' ? RNBlurView : View;

const Stack =
  Platform.OS === 'ios' ? createNativeStackNavigator() : createStackNavigator();

function useComponentColors() {
  const isDarkMode = useIsDarkMode();
  const {
    backgroundColor: originalBackgroundColor,
    contentBackgroundColor: originalContentBackgroundColor,
  } = useColors();
  const contentBackgroundColor = isDarkMode
    ? '#2C2C2E'
    : originalBackgroundColor;
  const backgroundColor = originalContentBackgroundColor;

  return {
    contentBackgroundColor,
    backgroundColor,
  };
}

function useScrollViewContentContainerPaddingTop() {
  const headerHeight = useHeaderHeight();
  const scrollViewContentContainerPaddingTop =
    headerHeight + (Platform.OS === 'ios' ? 20 : 20);
  return scrollViewContentContainerPaddingTop;
}

function useSyncServer() {
  const syncServers = useAppSelector(selectors.dbSync.servers);
  const syncServer = Object.values(syncServers)[0];
  return syncServer;
}

function useSyncServerID() {
  const syncServers = useAppSelector(selectors.dbSync.servers);
  const syncServerID = Object.keys(syncServers)[0];
  return syncServerID;
}

function OnboardingScreen({
  navigation,
}: StackScreenProps<RootStackParamList, 'Onboarding'>) {
  const dispatch = useAppDispatch();

  const profiles = useAppSelector(selectors.profiles.profiles);
  const hasOtherProfiles = Object.keys(profiles).length > 1;

  const isSetupNotDone = useAppSelector(selectors.profiles.isSetupNotDone);
  const isSetupNotDoneRef = useRef(isSetupNotDone);
  isSetupNotDoneRef.current = isSetupNotDone;

  useEffect(
    () =>
      // Prevent the user from closing the onboarding screen if setup is not done
      navigation.addListener('beforeRemove', e => {
        if (isSetupNotDoneRef.current) {
          e.preventDefault();
        }
      }),
    [navigation],
  );

  const scrollViewContentContainerPaddingTop =
    useScrollViewContentContainerPaddingTop();
  const { contentBackgroundColor, backgroundColor } = useComponentColors();

  const welcomeUI = useCallback(
    (props: StackScreenProps<any>) => {
      return (
        <ScrollView
          style={{ backgroundColor }}
          contentContainerStyle={[
            styles.scrollViewContentContainer,
            { paddingTop: scrollViewContentContainerPaddingTop },
          ]}
        >
          <UIGroup.FirstGroupSpacing />
          <UIGroup style={[cs.centerChildren]}>
            <Text style={styles.titleText}>Welcome</Text>
            <Text style={styles.text}>
              This is an RFID asset management app for home or small businesses.
            </Text>
            <Text style={styles.text}>
              For more information, see the{' '}
              <Link onPress={() => Linking.openURL(USER_DOCUMENTS_URL)}>
                Documentation
              </Link>
              , or check out the project on{' '}
              <Link onPress={() => Linking.openURL(GITHUB_PROJECT_URL)}>
                GitHub
              </Link>
              .
            </Text>
          </UIGroup>
          <UIGroup>
            <Button
              mode="contained"
              title="Start"
              style={commonStyles.alignSelfStretch}
              onPress={() => props.navigation.navigate('NewOrRestore')}
            />
            {hasOtherProfiles && (
              <>
                <View style={styles.inGroupSpacing} />
                <Button
                  mode="text"
                  title="Switch to Another Profile"
                  style={commonStyles.alignSelfStretch}
                  onPress={() => navigation.push('SwitchProfile')}
                />
              </>
            )}
          </UIGroup>
        </ScrollView>
      );
    },
    [
      backgroundColor,
      hasOtherProfiles,
      navigation,
      scrollViewContentContainerPaddingTop,
    ],
  );

  const newOrRestoreUI = useCallback(
    (props: StackScreenProps<any>) => {
      return (
        <ScrollView
          style={{ backgroundColor }}
          contentContainerStyle={[
            styles.scrollViewContentContainer,
            { paddingTop: scrollViewContentContainerPaddingTop },
          ]}
        >
          <UIGroup.FirstGroupSpacing />
          <UIGroup style={[cs.centerChildren]}>
            <Text style={styles.titleText}>Setup or Restore</Text>
            <Text style={styles.text}>
              Have you use this app before and want to restore your data, or do
              you want to start fresh?
            </Text>
          </UIGroup>
          {/*<UIGroup style={{ backgroundColor: contentBackgroundColor }}>
            <UIGroup.ListItem
              button
              label="Restore from CouchDB..."
              onPress={() => props.navigation.navigate('RestoreFromCouchDB')}
            />
            <UIGroup.ListItemSeparator />
            <UIGroup.ListItem button label="Start Fresh..." />
          </UIGroup>*/}
          <UIGroup style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              title="Restore"
              onPress={() => props.navigation.navigate('RestoreFromCouchDB')}
            />
            <View style={styles.inGroupSpacing} />
            <Button style={commonStyles.flex1} title="Start Fresh" />
          </UIGroup>
        </ScrollView>
      );
    },
    [backgroundColor, scrollViewContentContainerPaddingTop],
  );

  const syncServerID = useSyncServerID();
  const syncServerStatuses = useAppSelector(selectors.dbSync.serverStatuses);
  const syncServerStatus = syncServerStatuses[syncServerID] || {};
  const dbSyncHasBeenSetupStatus:
    | 'DONE'
    | 'INITIALIZING'
    | 'WORKING'
    | 'ERROR' = useMemo(() => {
    if (syncServerStatus.lastSyncedAt) {
      return 'DONE';
    }

    if (syncServerStatus.status === '-') {
      return 'INITIALIZING';
    }

    if (syncServerStatus.status === 'Disabled') {
      return 'INITIALIZING';
    }

    if (syncServerStatus.status === 'Initializing') {
      return 'INITIALIZING';
    }

    if (syncServerStatus.status === 'Syncing') {
      return 'WORKING';
    }

    if (syncServerStatus.status === 'Online') {
      return 'WORKING';
    }

    return 'ERROR';
  }, [syncServerStatus.lastSyncedAt, syncServerStatus.status]);
  const [initialPullLastSeq, setInitialPullLastSeq] = useState(-1);
  useEffect(() => {
    if (initialPullLastSeq >= 0) {
      return;
    }

    if (typeof syncServerStatus.pullLastSeq === 'number') {
      setInitialPullLastSeq(syncServerStatus.pullLastSeq);
    }
  }, [initialPullLastSeq, syncServerStatus.pullLastSeq]);
  const initialSyncDoneProgress =
    initialPullLastSeq >= 0
      ? (syncServerStatus.pullLastSeq || 0) - initialPullLastSeq
      : syncServerStatus.pullLastSeq || 0;
  const initialSyncRemainingProgress =
    initialPullLastSeq >= 0
      ? (syncServerStatus.remoteDBUpdateSeq || 0) - initialPullLastSeq
      : syncServerStatus.remoteDBUpdateSeq || 0;

  const restoreFromCouchDBScrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps: restoreFromCouchDBKiaTextInputProps } =
    useScrollViewAutomaticallyAdjustKeyboardInsetsFix(
      restoreFromCouchDBScrollViewRef,
    );
  const navigateToDBSyncHasBeenSetupFnRef = useRef<any>(null);
  const {
    newOrEditServerUIElement,
    // hasUnsavedChanges,
    handleSave,
    // handleLeave,
    // nameInputRef,
  } = useNewOrEditServerUI({
    id: syncServerID,
    afterSave: useCallback(() => {
      if (typeof navigateToDBSyncHasBeenSetupFnRef.current === 'function') {
        navigateToDBSyncHasBeenSetupFnRef.current();
      }

      dispatch(actions.dbSync.setEnable(false));
      setTimeout(() => {
        dispatch(actions.dbSync.setEnable(true));
      }, 500);
    }, [dispatch]),
    inputProps: restoreFromCouchDBKiaTextInputProps,
    uiGroupProps: useMemo(
      () => ({ style: { backgroundColor: contentBackgroundColor } }),
      [contentBackgroundColor],
    ),
    initialData: SERVER_INITIAL_DATA,
  });

  const restoreFromCouchDBUI = useCallback(
    (props: StackScreenProps<any>) => {
      navigateToDBSyncHasBeenSetupFnRef.current = () =>
        props.navigation.navigate('DBSyncHasBeenSetup');
      return (
        <View style={{ backgroundColor }}>
          <ScrollView
            ref={restoreFromCouchDBScrollViewRef}
            style={{ backgroundColor }}
            contentContainerStyle={[
              styles.scrollViewContentContainer,
              { paddingTop: scrollViewContentContainerPaddingTop },
            ]}
            automaticallyAdjustKeyboardInsets
            keyboardDismissMode="interactive"
          >
            <UIGroup.FirstGroupSpacing />
            <UIGroup style={[cs.centerChildren]}>
              <Text style={styles.titleText}>Restore from CouchDB</Text>
              <Text style={styles.text}>
                Enter the settings below to setup sync and restore data from a
                CouchDB Database.
              </Text>
            </UIGroup>
            {newOrEditServerUIElement}
          </ScrollView>
          <BlurView
            blurType="regular"
            style={[
              styles.absoluteFooter,
              Platform.OS === 'ios' ? {} : { backgroundColor },
            ]}
          >
            <UIGroup>
              <Button
                title="Save and Start Restoring"
                mode="contained"
                onPress={handleSave}
              />
            </UIGroup>
          </BlurView>
        </View>
      );
    },
    [
      backgroundColor,
      handleSave,
      newOrEditServerUIElement,
      scrollViewContentContainerPaddingTop,
    ],
  );

  const dbSyncHasBeenSetupUI = useCallback(
    (props: StackScreenProps<any>) => {
      return (
        <ScrollView
          style={{ backgroundColor }}
          contentContainerStyle={[
            styles.scrollViewContentContainer,
            { paddingTop: scrollViewContentContainerPaddingTop },
          ]}
        >
          <UIGroup.FirstGroupSpacing />
          <UIGroup style={[cs.centerChildren]}>
            <Text style={styles.titleText}>
              {(() => {
                switch (dbSyncHasBeenSetupStatus) {
                  case 'INITIALIZING':
                    return 'Preparing to Sync';
                  case 'WORKING':
                    return 'Synchronization In Progress';
                  case 'ERROR':
                    return 'Data Sync Failed';
                  case 'DONE':
                    return 'Data Sync Completed';
                }
              })()}
            </Text>
            <Text style={styles.text}>
              {(() => {
                switch (dbSyncHasBeenSetupStatus) {
                  case 'INITIALIZING':
                    return 'Data sync is initializing...';
                  case 'WORKING':
                    return 'The initial synchronization is in progress, please keep this app opened... ';
                  case 'ERROR': {
                    if (syncServerStatus.lastErrorMessage) {
                      return `${syncServerStatus.lastErrorMessage}. Please go back to the previous step and try again.`;
                    }

                    return 'An unknown error occurred. Please go back to the previous step and try again.';
                  }
                  case 'DONE':
                    return 'You are now ready to go!';
                }
              })()}
            </Text>
            {(() => {
              if (dbSyncHasBeenSetupStatus === 'WORKING') {
                // TODO: Show progress bar
                return (
                  <>
                    <Text style={styles.text}>
                      Progress: {initialSyncDoneProgress}/
                      {initialSyncRemainingProgress}
                    </Text>
                  </>
                );
              }

              return null;
            })()}
          </UIGroup>
          {(() => {
            if (dbSyncHasBeenSetupStatus === 'DONE') {
              return (
                <UIGroup>
                  <Button
                    mode="contained"
                    title="Done"
                    style={commonStyles.alignSelfStretch}
                    onPress={() => navigation.goBack()}
                  />
                </UIGroup>
              );
            }

            if (dbSyncHasBeenSetupStatus === 'ERROR') {
              return (
                <UIGroup>
                  <Button
                    mode="contained"
                    title="Go Back"
                    style={commonStyles.alignSelfStretch}
                    onPress={() =>
                      props.navigation.navigate('RestoreFromCouchDB')
                    }
                  />
                </UIGroup>
              );
            }

            if (
              dbSyncHasBeenSetupStatus === 'WORKING' &&
              initialSyncDoneProgress > 100
            ) {
              return (
                <UIGroup>
                  <Text style={styles.smallerText}>
                    While it's recommended to wait until the initial sync to be
                    completed, you can still{' '}
                    <Link onPress={() => navigation.goBack()}>
                      skip waiting and start using the app now
                    </Link>
                    .
                  </Text>
                </UIGroup>
              );
            }

            return null;
          })()}
        </ScrollView>
      );
    },
    [
      backgroundColor,
      dbSyncHasBeenSetupStatus,
      initialSyncDoneProgress,
      initialSyncRemainingProgress,
      navigation,
      scrollViewContentContainerPaddingTop,
      syncServerStatus.lastErrorMessage,
    ],
  );
  useEffect(() => {
    if (dbSyncHasBeenSetupStatus === 'DONE') {
      dispatch(actions.profiles.markCurrentProfileAsSetupDone());
    } else if (
      dbSyncHasBeenSetupStatus === 'WORKING' &&
      initialSyncDoneProgress > 10
    ) {
      dispatch(actions.profiles.markCurrentProfileAsSetupDone());
    }
  }, [dbSyncHasBeenSetupStatus, dispatch, navigation, initialSyncDoneProgress]);

  const canGoBack =
    dbSyncHasBeenSetupStatus !== 'WORKING' &&
    dbSyncHasBeenSetupStatus !== 'DONE';
  const canGoBackRef = useRef(canGoBack);
  canGoBackRef.current = canGoBack;

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      function () {
        if (canGoBackRef.current) {
          return false;
        }

        return true;
      },
    );
    return () => backHandler.remove();
  }, []);

  return (
    <Stack.Navigator
      screenOptions={{
        headerTitle: '',
        headerBackTitle: 'Back',
        headerTransparent: true,
        headerBackVisible: canGoBack,
        gestureEnabled: canGoBack,
        ...(Platform.OS === 'ios'
          ? ({ headerBlurEffect: 'regular' } as any)
          : TransitionPresets.SlideFromRightIOS),
        ...(Platform.OS === 'android'
          ? {
              headerLeft: canGoBack
                ? // Appbar.BackAction is used because the default back button do not work well on dark theme.
                  // eslint-disable-next-line react/no-unstable-nested-components
                  (props: any) => <Appbar.BackAction {...props} />
                : null,
            }
          : {}),
      }}
    >
      <Stack.Screen
        name="Welcome"
        options={{
          headerBackVisible: false,
          header: Platform.OS === 'android' ? () => null : undefined,
        }}
      >
        {welcomeUI}
      </Stack.Screen>
      <Stack.Screen name="NewOrRestore">{newOrRestoreUI}</Stack.Screen>
      <Stack.Screen name="RestoreFromCouchDB">
        {restoreFromCouchDBUI}
      </Stack.Screen>
      <Stack.Screen
        name="DBSyncHasBeenSetup"
        options={{ headerBackVisible: false }}
      >
        {dbSyncHasBeenSetupUI}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  scrollViewContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 100,
  },
  titleText: {
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
  },
  text: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 10,
  },
  smallerText: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 10,
  },
  inGroupSpacing: {
    height: 12,
    width: 12,
  },
  absoluteFooter: {
    position: 'absolute',
    bottom: -100,
    left: 0,
    right: 0,
    paddingBottom: 100,
    paddingTop: 16,
  },
});

export default OnboardingScreen;
