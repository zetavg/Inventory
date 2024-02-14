import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps, TransitionPresets } from '@react-navigation/stack';
import { createStackNavigator } from '@react-navigation/stack';
import { Appbar } from 'react-native-paper';

import { fixDataConsistency, getHumanName } from '@invt/data/utils';
import type { Progress } from '@invt/data/utils/fixDataConsistency';

import { DEFAULT_LAYOUT_ANIMATION_CONFIG } from '@app/consts/animations';

import { getGetData, getGetDataCount, getSaveDatum } from '@app/data/functions';

import { useDB } from '@app/db';

import cs from '@app/utils/commonStyles';

import { RootStackParamList } from '@app/navigation';

import useColors from '@app/hooks/useColors';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useLogger from '@app/hooks/useLogger';

import AppBarIOS from '@app/components/AppBarIOS';
import Text from '@app/components/Text';
import UIGroup from '@app/components/UIGroup';

const Stack =
  Platform.OS === 'ios' ? createNativeStackNavigator() : createStackNavigator();

function useComponentColors() {
  const isDarkMode = useIsDarkMode();
  const { contentBackgroundColor: originalContentBackgroundColor } =
    useColors();
  const contentBackgroundColor = isDarkMode ? '#2C2C2E' : '#F5F5F9';
  const backgroundColor = originalContentBackgroundColor;
  const listItemSeparatorColor = isDarkMode ? '#555557' : '#E0E0E4';

  return {
    contentBackgroundColor,
    backgroundColor,
    listItemSeparatorColor,
  };
}

type Context = {
  isWorking?: boolean;
  setIsWorking?: React.Dispatch<React.SetStateAction<boolean>>;
  navigation?: StackScreenProps<
    RootStackParamList,
    'FixDataConsistency'
  >['navigation'];
  progressRef?: React.MutableRefObject<Progress | null>;
};

const FixDataConsistencyContext = createContext<Context>({});

export type ParamList = {
  Main: undefined;
  Errors: {
    title: string;
    errors: Array<{ type: string; id: string; error: unknown }>;
  };
  Error: { type: string; id: string; error: unknown };
};

function FixDataConsistencyScreen({
  navigation,
}: StackScreenProps<RootStackParamList, 'FixDataConsistency'>) {
  const [isWorking, setIsWorking] = useState(false);
  const isWorkingRef = useRef(isWorking);
  isWorkingRef.current = isWorking;
  const progressRef = useRef<Progress | null>(null);

  const leaveConfirmed = useRef(false);
  useEffect(() => {
    // Prevent the user from closing the onboarding screen if setup is not done
    navigation.addListener('beforeRemove', e => {
      if (isWorkingRef.current) {
        e.preventDefault();
        return;
      }

      if (leaveConfirmed.current) return;

      const errorEntries = Object.entries(progressRef.current || {}).filter(
        ([_, p]) => p.errored,
      );

      if (errorEntries.length > 0) {
        e.preventDefault();

        Alert.alert(
          'Are you sure you want to leave?',
          'You will not be able to view the results again after you leave.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Leave',
              style: 'destructive',
              onPress: () => {
                leaveConfirmed.current = true;
                navigation.goBack();
              },
            },
          ],
        );
      }
    });

    navigation.setOptions({
      cardStyle: styles.cardStyle,
    });
  }, [navigation]);

  const context: Context = useMemo(
    () => ({
      isWorking,
      setIsWorking,
      navigation,
      progressRef,
    }),
    [isWorking, navigation],
  );

  return (
    <FixDataConsistencyContext.Provider value={context}>
      <Stack.Navigator
        screenOptions={{
          // headerTitle: '',
          // headerBackTitle: 'Back',
          headerTransparent: true,
          // headerBackVisible: canGoBack,
          gestureEnabled: !isWorking,
          ...(Platform.OS === 'ios'
            ? ({ headerBlurEffect: 'regular' } as any)
            : TransitionPresets.SlideFromRightIOS),
          ...(Platform.OS === 'android'
            ? {
                // Appbar.BackAction is used because the default back button do not work well on dark theme.
                // eslint-disable-next-line react/no-unstable-nested-components
                headerLeft: (props: any) => <Appbar.BackAction {...props} />,
              }
            : {}),
        }}
      >
        <Stack.Screen
          name="Main"
          options={{
            headerTitle: 'Fix Data Consistency',
            headerTitleStyle: { color: 'transparent' },
            header: Platform.OS === 'android' ? () => null : undefined,

            headerLeft: !isWorking
              ? // eslint-disable-next-line react/no-unstable-nested-components
                () =>
                  Platform.OS === 'ios' ? (
                    <AppBarIOS.Button
                      onPress={() => navigation.goBack()}
                      strong
                    >
                      Close
                    </AppBarIOS.Button>
                  ) : (
                    <Appbar.BackAction onPress={() => navigation.goBack()} />
                  )
              : undefined,
          }}
          component={MainScreen}
        />
        <Stack.Screen
          name="Errors"
          options={{
            headerTitle: 'Errors',
            headerBackVisible: true,
            // header: Platform.OS === 'android' ? () => null : undefined,
          }}
          component={ErrorsScreen}
        />
        <Stack.Screen
          name="Error"
          options={{
            headerTitle: 'Error Details',
            headerBackVisible: true,
            // header: Platform.OS === 'android' ? () => null : undefined,
          }}
          component={ErrorScreen}
        />
      </Stack.Navigator>
    </FixDataConsistencyContext.Provider>
  );
}

function MainScreen({
  navigation,
}: StackScreenProps<ParamList, 'Main'>): JSX.Element {
  const logger = useLogger('FixDataConsistencyScreen');
  const { db } = useDB();

  const { isWorking, setIsWorking, progressRef } = React.useContext(
    FixDataConsistencyContext,
  );

  const [progress, setProgress] = useState<Progress | null>(null);
  if (progressRef) {
    progressRef.current = progress;
  }
  const progressUpdatedEntries = useMemo(() => {
    if (progress === null) return [];

    const entries = Object.entries(progress).filter(([_, p]) => p.updated);

    if (entries.length !== prevProgressUpdatedEntries?.current.length) {
      LayoutAnimation.configureNext(DEFAULT_LAYOUT_ANIMATION_CONFIG);
    }

    return entries;
  }, [progress]);
  const prevProgressUpdatedEntries = useRef(progressUpdatedEntries);
  prevProgressUpdatedEntries.current = progressUpdatedEntries;
  const progressErroredEntries = useMemo(() => {
    if (progress === null) return [];

    const entries = Object.entries(progress).filter(([_, p]) => p.errored);

    if (entries.length !== prevProgressErroredEntries?.current.length) {
      LayoutAnimation.configureNext(DEFAULT_LAYOUT_ANIMATION_CONFIG);
    }

    return entries;
  }, [progress]);
  const prevProgressErroredEntries = useRef(progressErroredEntries);
  prevProgressErroredEntries.current = progressErroredEntries;
  const [shouldStop, setShouldStop] = useState<boolean>(false);
  const shouldStopRef = useRef(shouldStop);
  shouldStopRef.current = shouldStop;

  const handleStart = useCallback(async () => {
    if (!db) return;
    if (!setIsWorking) return;

    LayoutAnimation.configureNext(DEFAULT_LAYOUT_ANIMATION_CONFIG);

    setIsWorking(true);
    setShouldStop(false);
    setProgress(null);

    try {
      const getData = getGetData({ db, logger });
      const getDataCount = getGetDataCount({ db, logger });
      const saveDatum = getSaveDatum({ db, logger });

      for await (const p of fixDataConsistency({
        batchSize: 100,
        getData,
        getDataCount,
        saveDatum,
      })) {
        setProgress({ ...p });
        // Need this for UI to update
        await new Promise(resolve => setTimeout(resolve, 0));
        if (shouldStopRef.current) break;
      }
    } catch (e) {
      logger.error(e);
    } finally {
      const hasErrors = prevProgressErroredEntries.current.length > 0;

      const [title, message] = (() => {
        switch (
          `${shouldStopRef.current ? '1' : '0'}${hasErrors ? '1' : '0'}`
        ) {
          case '00':
            return ['Done', 'Fix data consistency has been done.'];
          case '01':
            return [
              'Done with Errors',
              'Fix data consistency has been done with errors.',
            ];
          case '10':
            return ['Aborted', 'Fix data consistency has been aborted.'];
          case '11':
            return [
              'Aborted with Errors',
              'Fix data consistency has been aborted with errors.',
            ];
          default:
            return ['Unknown', 'Unknown status.'];
        }
      })();

      setIsWorking(false);
      setShouldStop(false);

      Alert.alert(title, message);
    }
  }, [db, logger, setIsWorking]);

  const headerHeight = useHeaderHeight();
  const { contentBackgroundColor, backgroundColor, listItemSeparatorColor } =
    useComponentColors();

  return (
    <>
      <ScrollView
        style={{ backgroundColor }}
        contentContainerStyle={[
          styles.mainScrollViewContentContainer,
          {
            paddingTop: headerHeight,
            paddingBottom: headerHeight,
          },
        ]}
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <UIGroup style={[cs.centerChildren, cs.mb16, cs.ph8]}>
          <Text style={styles.titleText}>Fix Data Consistency</Text>

          {!isWorking ? (
            <Text style={styles.text}>
              Running this may resolve inconsistencies in your data.
            </Text>
          ) : (
            <Text style={styles.text}>
              Fixing data consistency, please keep this app opened.
            </Text>
          )}
          <Text style={styles.text}>
            It may take several minutes, depending on your database size.
          </Text>
        </UIGroup>

        {progressErroredEntries.length > 0 && (
          <UIGroup
            header="Errored Items"
            footer="Press on an item to see details."
            style={{ backgroundColor: contentBackgroundColor }}
          >
            {UIGroup.ListItemSeparator.insertBetween(
              progressErroredEntries.map(([type, p]) => (
                <UIGroup.ListItem
                  key={type}
                  label={getHumanName(type, { titleCase: true, plural: true })}
                  detail={p.errored}
                  navigable
                  onPress={() =>
                    navigation.push('Errors', {
                      errors: p.errors || [],
                      title: `${getHumanName(type, {
                        titleCase: true,
                        plural: false,
                      })} Errors`,
                    })
                  }
                />
              )),
              { color: listItemSeparatorColor },
            )}
          </UIGroup>
        )}

        {!!progress && (
          <UIGroup
            header="Progress"
            style={{ backgroundColor: contentBackgroundColor }}
          >
            {UIGroup.ListItemSeparator.insertBetween(
              Object.entries(progress).map(([type, p]) => (
                <UIGroup.ListItem
                  key={type}
                  label={getHumanName(type, { titleCase: true, plural: true })}
                  detail={`${p.done}/${p.total}`}
                />
              )),
              { color: listItemSeparatorColor },
            )}
          </UIGroup>
        )}

        {progressUpdatedEntries.length > 0 && (
          <UIGroup
            header="Updated Items"
            style={{ backgroundColor: contentBackgroundColor }}
          >
            {UIGroup.ListItemSeparator.insertBetween(
              progressUpdatedEntries.map(([type, p]) => (
                <UIGroup.ListItem
                  key={type}
                  label={getHumanName(type, { titleCase: true, plural: true })}
                  detail={p.updated}
                />
              )),
              { color: listItemSeparatorColor },
            )}
          </UIGroup>
        )}

        <UIGroup style={{ backgroundColor: contentBackgroundColor }}>
          <UIGroup.ListItem
            label="Start"
            button
            disabled={isWorking}
            onPress={handleStart}
          />
          <UIGroup.ListItemSeparator color={listItemSeparatorColor} />
          <UIGroup.ListItem
            label="Abort"
            destructive
            button
            disabled={!isWorking}
            onPress={() => setShouldStop(true)}
          />
        </UIGroup>
      </ScrollView>
    </>
  );
}

function ErrorsScreen({
  navigation,
  route,
}: StackScreenProps<ParamList, 'Errors'>): JSX.Element {
  const { errors, title } = route.params;

  useEffect(() => {
    navigation.setOptions({
      headerTitle: title,
    });
  }, [navigation, title]);

  const headerHeight = useHeaderHeight();
  const { contentBackgroundColor, backgroundColor, listItemSeparatorColor } =
    useComponentColors();

  return (
    <>
      <ScrollView
        style={{ backgroundColor }}
        contentContainerStyle={[
          styles.scrollViewContentContainer,
          {
            paddingTop: headerHeight,
          },
        ]}
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <UIGroup
          style={{ backgroundColor: contentBackgroundColor }}
          header={
            errors.length > 1
              ? `${errors.length} Errors`
              : `${errors.length} Error`
          }
          footer="Press on an error to see details."
        >
          {UIGroup.ListItemSeparator.insertBetween(
            errors.map((error, i) => (
              <UIGroup.ListItem
                key={i}
                label={`ID: ${error.id}`}
                detail={
                  error.error instanceof Error
                    ? error.error.message
                    : 'Unknown error'
                }
                verticalArrangedIOS
                navigable
                onPress={() => navigation.push('Error', error)}
              />
            )),
            { color: listItemSeparatorColor },
          )}
        </UIGroup>
      </ScrollView>
    </>
  );
}

function ErrorScreen({
  navigation,
  route,
}: StackScreenProps<ParamList, 'Error'>): JSX.Element {
  const { type, id, error } = route.params;

  const headerHeight = useHeaderHeight();
  const { contentBackgroundColor, backgroundColor, listItemSeparatorColor } =
    useComponentColors();

  return (
    <>
      <ScrollView
        style={{ backgroundColor }}
        contentContainerStyle={[
          styles.scrollViewContentContainer,
          {
            paddingTop: headerHeight,
          },
        ]}
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <UIGroup style={{ backgroundColor: contentBackgroundColor }}>
          <UIGroup.ListItem
            label="Data Type"
            detail={type}
            verticalArrangedLargeTextIOS
            monospaceDetail
          />
          <UIGroup.ListItemSeparator color={listItemSeparatorColor} />
          <UIGroup.ListItem
            label="Data ID"
            detail={id}
            verticalArrangedLargeTextIOS
            monospaceDetail
          />
        </UIGroup>
        <UIGroup style={{ backgroundColor: contentBackgroundColor }}>
          <UIGroup.ListItem
            label="Error Message"
            detail={error instanceof Error ? error.message : 'Unknown error'}
            verticalArrangedLargeTextIOS
          />
          <UIGroup.ListItemSeparator color={listItemSeparatorColor} />
          <UIGroup.ListItem
            label="Error Type"
            detail={error?.constructor?.name}
            verticalArrangedLargeTextIOS
            monospaceDetail
          />
          <UIGroup.ListItemSeparator color={listItemSeparatorColor} />
          <UIGroup.ListItem
            label="Details"
            detail={JSON.stringify(error, null, 2)}
            verticalArrangedLargeTextIOS
            monospaceDetail
          />
        </UIGroup>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  cardStyle: {
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  mainScrollViewContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: Platform.OS === 'ios' ? 20 : 100,
  },
  scrollViewContentContainer: {
    flexGrow: 1,
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
    opacity: 0.95,
  },
  smallerText: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 10,
    opacity: 0.9,
  },
});

export default FixDataConsistencyScreen;
