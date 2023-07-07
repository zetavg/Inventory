import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Button,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { GITHUB_PROJECT_URL, USER_DOCUMENTS_URL } from '@app/consts/info';

import {
  persistor,
  selectors,
  actions,
  useAppDispatch,
  useAppSelector,
} from '@app/redux';
import { ActionLog, addCallback } from '@app/redux/middlewares/logger';

import cs from '@app/utils/commonStyles';
import commonStyles from '@app/utils/commonStyles';
import removePasswordFromJSON from '@app/utils/removePasswordFromJSON';

import { RootStackParamList } from '@app/navigation';
import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useColors from '@app/hooks/useColors';
import useScrollTo from '@app/hooks/useScrollTo';
import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import InsetGroup from '@app/components/InsetGroup';
import ModalContent from '@app/components/ModalContent';
import ScreenContent from '@app/components/ScreenContent';
import ScreenContentScrollView from '@app/components/ScreenContentScrollView';
import Text, { Link } from '@app/components/Text';

function OnboardingScreen({
  navigation,
}: StackScreenProps<RootStackParamList, 'Onboarding'>) {
  const dispatch = useAppDispatch();
  const currentProfileName = useAppSelector(
    selectors.profiles.currentProfileName,
  );
  // const rootNavigation = useRootNavigation();
  // const { contentTextColor } = useColors();

  const scrollViewRef = useRef<ScrollView>(null);
  // useScrollViewContentInsetFix(scrollViewRef);

  const [step, setStep] = useState<'welcome' | 'start'>('welcome');
  const handleBack = useMemo(() => {
    switch (step) {
      case 'start':
        return () => setStep('welcome');
      default:
        return undefined;
    }
  }, [step]);
  const handleNext = useMemo(() => {
    switch (step) {
      case 'welcome':
        return () => setStep('start');
      default:
        return undefined;
    }
  }, [step]);

  const handleCreateDefaultProfile = useCallback(() => {
    dispatch(actions.profiles.newProfile({ name: 'Default', color: 'blue' }));
  }, [dispatch]);

  // const state = useAppSelector(s => s);
  // const dispatch = useAppDispatch();

  // const [actionStr, setActionStr] = useState(INITIAL_ACTION_STR);
  // let isActionInvalid = false;
  // try {
  //   JSON.parse(actionStr);
  // } catch (e) {
  //   isActionInvalid = true;
  // }

  // const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  // const logAction = useCallback((log: ActionLog) => {
  //   setActionLogs(logs => [log, ...logs]);
  // }, []);
  // useEffect(() => addCallback(logAction), [logAction]);

  // const dispatchActionGroup = useRef<View>(null);
  // const dispatchActionInput = useRef<TextInput>(null);

  const scrollTo = useScrollTo(scrollViewRef);

  return (
    <ModalContent
      navigation={navigation}
      title="Inventory"
      action2Label="Back"
      action2MaterialIconName="arrow-left"
      onAction2Press={handleBack}
      action1Label="Next"
      action1MaterialIconName="arrow-right"
      onAction1Press={handleNext}
      showBackButton={!!currentProfileName}
      backButtonLabel="Done"
      preventClose
      confirmCloseFn={confirm => {
        if (currentProfileName) {
          confirm();
        }
      }}
    >
      <ScreenContentScrollView ref={scrollViewRef}>
        {(() => {
          switch (step) {
            case 'welcome': {
              return (
                <View style={[cs.centerChildren, cs.p16]}>
                  <View style={cs.mt128} />
                  <Text style={styles.titleText}>Welcome</Text>
                  <Text style={styles.text}>
                    This is an RFID asset management app for home or small
                    businesses.
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
                  <Button title="Start" onPress={handleNext} />
                </View>
              );
            }
            case 'start': {
              return (
                <View style={[cs.centerChildren, cs.p16]}>
                  <View style={cs.mt128} />
                  <Text style={styles.titleText}>Welcome</Text>
                  <Text style={styles.text}>Press the button to setup.</Text>
                  <Button title="Setup" onPress={handleCreateDefaultProfile} />
                </View>
              );
            }
          }
        })()}
      </ScreenContentScrollView>
    </ModalContent>
  );
}

const styles = StyleSheet.create({
  titleText: {
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  text: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 10,
  },
});

export default OnboardingScreen;
