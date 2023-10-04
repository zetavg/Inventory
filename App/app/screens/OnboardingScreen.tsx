import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BackHandler,
  Image,
  LayoutAnimation,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps, TransitionPresets } from '@react-navigation/stack';
import { createStackNavigator } from '@react-navigation/stack';
import { Appbar } from 'react-native-paper';

import { BlurView as RNBlurView } from '@react-native-community/blur';
import { ProgressView } from '@react-native-community/progress-view';
import { v4 as uuidv4 } from 'uuid';

import EPCUtils from '@deps/epc-utils';

import { DEFAULT_LAYOUT_ANIMATION_CONFIG } from '@app/consts/animations';
import { GITHUB_PROJECT_URL, URLS, USER_DOCUMENTS_URL } from '@app/consts/info';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';
import useNewOrEditServerUI from '@app/features/db-sync/hooks/useNewOrEditServerUI';
import { DBSyncServerEditableData } from '@app/features/db-sync/slice';
import { getTagAccessPassword } from '@app/features/rfid/utils';

import { useConfig } from '@app/data';

import cs from '@app/utils/commonStyles';
import commonStyles from '@app/utils/commonStyles';

import { RootStackParamList } from '@app/navigation';

import useColors from '@app/hooks/useColors';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useScrollViewAutomaticallyAdjustKeyboardInsetsFix from '@app/hooks/useScrollViewAutomaticallyAdjustKeyboardInsetsFix';

import Button from '@app/components/Button';
import Configuration from '@app/components/Configuration';
import FullWidthImage from '@app/components/FullWidthImage';
import Icon from '@app/components/Icon';
import Text, { Link } from '@app/components/Text';
import UIGroup from '@app/components/UIGroup';

import { howToSwitchProfile } from '@app/images';

const R_GS1_COMPANY_PREFIX = '0000000';

const SERVER_INITIAL_DATA: Partial<DBSyncServerEditableData> = {
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
  const contentBackgroundColor = isDarkMode ? '#2C2C2E' : '#F5F5F9';
  const backgroundColor = originalContentBackgroundColor;
  const listItemSeparatorColor = isDarkMode ? '#555557' : '#E0E0E4';

  return {
    contentBackgroundColor,
    backgroundColor,
    listItemSeparatorColor,
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

  const { config, updateConfig } = useConfig();

  const isSetupNotDone = useAppSelector(selectors.profiles.isSetupNotDone);
  const isSetupNotDoneRef = useRef(isSetupNotDone);
  isSetupNotDoneRef.current = isSetupNotDone;

  const [showSkipBtnCounter, setShowSkipBtnCounter] = useState(0);

  useEffect(() => {
    // Prevent the user from closing the onboarding screen if setup is not done
    navigation.addListener('beforeRemove', e => {
      if (isSetupNotDoneRef.current) {
        e.preventDefault();
      }
    });

    navigation.setOptions({
      cardStyle: styles.cardStyle,
    });
  }, [navigation]);

  const scrollViewContentContainerPaddingTop =
    useScrollViewContentContainerPaddingTop();
  const { contentBackgroundColor, backgroundColor, listItemSeparatorColor } =
    useComponentColors();

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
            <Image
              source={require('@app/images/app-icons/default.png')}
              style={styles.welcomeAppIcon}
            />
            <Text style={styles.titleText}>Welcome to Inventory</Text>
            <Text style={styles.text}>
              This is an RFID asset management app for home or small businesses.
            </Text>
            <Text style={styles.text}>
              To utilize all functionalities of this app, a compatible RFID
              reader is required. View a list of supported devices{' '}
              <Link
                onPress={() => Linking.openURL(URLS.supported_rfid_devices)}
              >
                here
              </Link>
              .
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
              onPress={() => {
                // If we already have a saved config, that means we should continue the previous setup.
                if (config?._id) {
                  props.navigation.navigate('Setup');
                } else {
                  props.navigation.navigate('NewOrRestore');
                }
              }}
            />
            {hasOtherProfiles && (
              <>
                <View style={styles.inGroupSpacing} />
                <Button
                  mode="text"
                  title="Switch to Another Profile"
                  style={commonStyles.alignSelfStretch}
                  onPress={() => {
                    navigation.push('SwitchProfile');

                    // Show the "skip" button if the user press this button for and come back for over n times (for developer).
                    setShowSkipBtnCounter(x => x + 1);
                  }}
                />
              </>
            )}
            {showSkipBtnCounter > 8 && (
              // Skip button to force close this screen, only for developers.
              <>
                <View style={styles.inGroupSpacing} />
                <View style={styles.inGroupSpacing} />
                <Link
                  onPress={() => {
                    isSetupNotDoneRef.current = false;
                    navigation.goBack();
                  }}
                  style={commonStyles.tac}
                >
                  Skip
                </Link>
              </>
            )}
          </UIGroup>
        </ScrollView>
      );
    },
    [
      backgroundColor,
      config?._id,
      hasOtherProfiles,
      navigation,
      scrollViewContentContainerPaddingTop,
      showSkipBtnCounter,
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
            <Text style={styles.titleText}>Restore or Setup New</Text>
            <Text style={styles.text}>
              Have you used this app previously and wish to restore your data,
              or are you starting new?
            </Text>
          </UIGroup>

          {/*
          <UIGroup style={{ backgroundColor: contentBackgroundColor }}>
            <UIGroup.ListItem
              button
              label="Restore from CouchDB..."
              onPress={() => props.navigation.navigate('RestoreFromCouchDB')}
            />
            <UIGroup.ListItemSeparator />
            <UIGroup.ListItem
              button
              label="Start Fresh..."
              onPress={() => props.navigation.navigate('Setup')}
            />
          </UIGroup>
          */}

          <UIGroup style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              title="Restore Data"
              onPress={() => props.navigation.navigate('RestoreFromCouchDB')}
            />
            <View style={styles.inGroupSpacing} />
            <Button
              style={commonStyles.flex1}
              title="Setup New"
              mode="contained"
              onPress={() => props.navigation.navigate('Setup')}
            />
          </UIGroup>
        </ScrollView>
      );
    },
    [backgroundColor, scrollViewContentContainerPaddingTop],
  );

  const [userJustWantToTry, setUserJustWantToTry] = useState(false);
  const [haveGs1CompanyPrefix, setHaveGs1CompanyPrefix] = useState<
    boolean | null
  >(null);
  const [gs1CompanyPrefix, setGs1CompanyPrefix] = useState('');
  const gs1CompanyPrefixErrorMessage = useMemo(() => {
    if (!gs1CompanyPrefix) return null;

    if (gs1CompanyPrefix.length < 6 || gs1CompanyPrefix.length > 12) {
      return '⚠ A Company Prefix should contain between 6 and 12 digits';
    }

    return null;
  }, [gs1CompanyPrefix]);

  const [isIarPrefixManuallySet, setIsIarPrefixManuallySet] = useState(false);
  const [iarPrefix, setIarPrefix] = useState('');

  const [
    noGS1CompanyPrefixUIDelayShowNext,
    setNoGS1CompanyPrefixUIDelayShowNext,
  ] = useState(false);
  useEffect(() => {
    if (!noGS1CompanyPrefixUIDelayShowNext) return;

    const timer = setTimeout(() => {
      LayoutAnimation.configureNext(DEFAULT_LAYOUT_ANIMATION_CONFIG);
      setNoGS1CompanyPrefixUIDelayShowNext(false);
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [noGS1CompanyPrefixUIDelayShowNext]);

  const setupGS1CompanyPrefixUIScrollViewRef = useRef<ScrollView>(null);
  useEffect(() => {
    haveGs1CompanyPrefix;
    for (let i = 1; i <= 3; i++) {
      setTimeout(() => {
        setupGS1CompanyPrefixUIScrollViewRef.current?.scrollTo({
          x: 0,
          y: 99999,
        });
      }, DEFAULT_LAYOUT_ANIMATION_CONFIG.duration * i);
    }
  }, [haveGs1CompanyPrefix]);

  const setupGS1CompanyPrefixUI = useCallback(
    (props: StackScreenProps<any>) => {
      return (
        <>
          <ScrollView
            ref={setupGS1CompanyPrefixUIScrollViewRef}
            style={{ backgroundColor }}
            contentContainerStyle={[
              styles.scrollViewContentContainer,
              { paddingTop: scrollViewContentContainerPaddingTop },
            ]}
            automaticallyAdjustKeyboardInsets
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          >
            <UIGroup.FirstGroupSpacing />
            <UIGroup style={[cs.centerChildren, cs.mb4]}>
              <Text style={styles.titleText}>
                Set Your GS1 Company Prefix for RFID Tags
              </Text>

              <Text style={styles.text}>
                This app uses{' '}
                <Link onPress={() => Linking.openURL(URLS.what_is_giai)}>
                  Global Individual Asset Identifier (GIAI)
                </Link>{' '}
                to tag your items. This unique identifier is comprised of a{' '}
                <Link
                  onPress={() =>
                    Linking.openURL(URLS.what_is_gs1_company_prefix)
                  }
                >
                  GS1 Company Prefix
                </Link>{' '}
                and an Individual Asset Reference.{' '}
              </Text>
              <Text style={styles.text}>
                A{' '}
                <Link
                  onPress={() =>
                    Linking.openURL(URLS.what_is_gs1_company_prefix)
                  }
                >
                  GS1 Company Prefix
                </Link>{' '}
                is a unique code issued by GS1 to businesses. This prefix
                ensures global uniqueness of RFID tags, preventing collisions
                between yours and those of others worldwide.
              </Text>

              <View style={styles.inGroupSpacing} />

              <Text style={styles.text}>Do you have a GS1 Company Prefix?</Text>
            </UIGroup>

            <UIGroup
              style={[{ backgroundColor: contentBackgroundColor }, cs.mb12]}
            >
              <UIGroup.ListItem
                label="Yes"
                selected={haveGs1CompanyPrefix === true ? true : undefined}
                onPress={() => {
                  LayoutAnimation.configureNext(
                    DEFAULT_LAYOUT_ANIMATION_CONFIG,
                  );
                  setNoGS1CompanyPrefixUIDelayShowNext(true);
                  setUserJustWantToTry(false);
                  setHaveGs1CompanyPrefix(true);
                }}
              />
              <UIGroup.ListItemSeparator color={listItemSeparatorColor} />
              <UIGroup.ListItem
                label="No"
                selected={
                  haveGs1CompanyPrefix === false
                    ? !userJustWantToTry
                    : undefined
                }
                onPress={() => {
                  LayoutAnimation.configureNext(
                    DEFAULT_LAYOUT_ANIMATION_CONFIG,
                  );
                  setUserJustWantToTry(false);
                  setHaveGs1CompanyPrefix(false);
                }}
              />
              <UIGroup.ListItemSeparator color={listItemSeparatorColor} />
              <UIGroup.ListItem
                label="Not sure, I just want to try this app"
                selected={
                  haveGs1CompanyPrefix === false ? userJustWantToTry : undefined
                }
                onPress={() => {
                  LayoutAnimation.configureNext(
                    DEFAULT_LAYOUT_ANIMATION_CONFIG,
                  );
                  setUserJustWantToTry(true);
                  setHaveGs1CompanyPrefix(false);
                }}
              />
            </UIGroup>

            {haveGs1CompanyPrefix === true && (
              <>
                <UIGroup style={[cs.centerChildren, cs.mb4]}>
                  <Text style={styles.text}>
                    Great! Enter your GS1 Company Prefix here:
                  </Text>
                </UIGroup>
                <UIGroup
                  style={{ backgroundColor: contentBackgroundColor }}
                  footer={
                    gs1CompanyPrefixErrorMessage
                      ? gs1CompanyPrefixErrorMessage
                      : undefined
                  }
                >
                  <UIGroup.ListTextInputItem
                    keyboardType="number-pad"
                    returnKeyType="done"
                    monospaced
                    placeholder={R_GS1_COMPANY_PREFIX}
                    value={gs1CompanyPrefix}
                    onChangeText={t =>
                      setGs1CompanyPrefix(t.replace(/\D/g, ''))
                    }
                  />
                </UIGroup>
              </>
            )}

            {haveGs1CompanyPrefix === false &&
              (!userJustWantToTry ? (
                <>
                  <UIGroup style={[cs.centerChildren, cs.mb4]}>
                    <Text style={styles.text}>
                      No problem!{' '}
                      <Text style={cs.fwBold}>
                        You can use RFID tags with the "{R_GS1_COMPANY_PREFIX}"
                        Company Prefix
                      </Text>{' '}
                      as it's reserved for issuing restricted reference numbers
                      within a company.
                    </Text>
                    <Text style={styles.text}>
                      Note that the uniqueness of your RFID tags will not be
                      guaranteed while doing this. You may have trouble
                      identifying, locating or checking your items as there may
                      be other items out there with the same RFID tag as yours.
                    </Text>
                    <Text style={styles.text}>
                      If you own a business and your items will not always be
                      within a restricted environment, you may consider{' '}
                      <Link
                        onPress={() =>
                          Linking.openURL(
                            'https://hackmd.io/@Inventory/get-gs1-company-prefix',
                          )
                        }
                      >
                        getting a unique GS1 Company Prefix
                      </Link>{' '}
                      before start using this app.
                    </Text>
                  </UIGroup>
                </>
              ) : (
                <>
                  <UIGroup style={[cs.centerChildren, cs.mb4]}>
                    <Text style={styles.text}>
                      No problem! We'll let you use the "{R_GS1_COMPANY_PREFIX}"
                      Company Prefix as it's reserved for issuing restricted
                      reference numbers within a company.
                    </Text>
                    <Text style={styles.text}>
                      <Text style={[styles.text, cs.fwBold]}>
                        Please feel free to set anything you'd like on the
                        following steps
                      </Text>
                      , and have fun with your exploration.
                    </Text>
                    <Text style={styles.text}>
                      When you want to try another setup or take things
                      seriously,{' '}
                      <Text style={cs.fwBold}>
                        ➊ switch to the "More" tab by pressing it on the bottom
                        right of the main screen,
                      </Text>{' '}
                      and then{' '}
                      <Text style={cs.fwBold}>
                        ➋ press the user icon on the top right to create and
                        switch to a new profile.
                      </Text>{' '}
                      You'll be able to have a fresh start with that new
                      profile.
                    </Text>
                    <FullWidthImage source={howToSwitchProfile} />
                  </UIGroup>
                </>
              ))}
          </ScrollView>

          {((haveGs1CompanyPrefix === false &&
            !noGS1CompanyPrefixUIDelayShowNext) ||
            (haveGs1CompanyPrefix === true &&
              !!gs1CompanyPrefix &&
              !gs1CompanyPrefixErrorMessage)) && (
            <BlurView
              blurType="regular"
              style={[
                styles.absoluteFooter,
                Platform.OS === 'ios' ? {} : { backgroundColor },
              ]}
            >
              <UIGroup>
                <Button
                  title="Next"
                  mode="contained"
                  onPress={() => {
                    if (!isIarPrefixManuallySet) {
                      // if (!haveGs1CompanyPrefix) {
                      //   setIarPrefix(generateRandomIarPrefix().toString());
                      // } else {
                      //   setIarPrefix('1');
                      // }
                    }
                    props.navigation.navigate('SetupIARPrefix');
                  }}
                />
              </UIGroup>
            </BlurView>
          )}
        </>
      );
    },
    [
      backgroundColor,
      contentBackgroundColor,
      gs1CompanyPrefix,
      gs1CompanyPrefixErrorMessage,
      userJustWantToTry,
      haveGs1CompanyPrefix,
      isIarPrefixManuallySet,
      listItemSeparatorColor,
      noGS1CompanyPrefixUIDelayShowNext,
      scrollViewContentContainerPaddingTop,
    ],
  );

  const iarPrefixInputY = useRef(0);

  const setupIarPrefixUIScrollViewRef = useRef<ScrollView>(null);
  // const { kiaTextInputProps: setupIarPrefixUIKiaTextInputProps } =
  //   useScrollViewAutomaticallyAdjustKeyboardInsetsFix(
  //     setupIarPrefixUIScrollViewRef,
  //   );

  const [iarPrefixShowSampleType, setIarPrefixShowSampleType] = useState<
    '123' | '000' | '999'
  >('123');

  const setupIarPrefixUI = useCallback(
    (props: StackScreenProps<any>) => {
      const maxIarPrefix = EPCUtils.getMaxIarPrefix({
        companyPrefix: haveGs1CompanyPrefix
          ? gs1CompanyPrefix
          : R_GS1_COMPANY_PREFIX,
      });

      const iarPrefixErrorMessage = (() => {
        if (iarPrefix.length === 0) return null;
        const n = parseInt(iarPrefix, 10);

        if (n < 1) {
          return '⚠ Prefix must be larger than 0.';
        }
        if (n > maxIarPrefix) {
          return `⚠ Prefix must not be larger than ${maxIarPrefix}.`;
        }

        if (!haveGs1CompanyPrefix && iarPrefix.length < 3) {
          return '⚠ Prefix must be at least 3 digits.';
        }

        if (!haveGs1CompanyPrefix && iarPrefix.startsWith('72')) {
          return '⚠ Prefix starting with "72" is reserved.';
        }
      })();

      const canGoNext = !!iarPrefix && !iarPrefixErrorMessage;

      const scrollToInput = () => {
        setTimeout(() => {
          setupIarPrefixUIScrollViewRef.current?.scrollTo({
            y: iarPrefixInputY.current - 100,
          });
        }, 200);
      };

      const collectionReferenceDigits = EPCUtils.getCollectionReferenceDigits({
        iarPrefix,
        companyPrefix: haveGs1CompanyPrefix
          ? gs1CompanyPrefix
          : R_GS1_COMPANY_PREFIX,
      });
      const itemReferenceDigits = EPCUtils.getItemReferenceDigits({
        iarPrefix,
        companyPrefix: haveGs1CompanyPrefix
          ? gs1CompanyPrefix
          : R_GS1_COMPANY_PREFIX,
      });

      const sampleCollectionReference = (() => {
        switch (iarPrefixShowSampleType) {
          case '123':
            return '12345678'.slice(0, collectionReferenceDigits);
          case '000':
            return '0'.repeat(collectionReferenceDigits);
          case '999':
            return '9'.repeat(collectionReferenceDigits);
        }
      })();

      const sampleItemReference = (() => {
        switch (iarPrefixShowSampleType) {
          case '123':
            return '12345678'.slice(0, itemReferenceDigits);
          case '000':
            return '0'.repeat(itemReferenceDigits);
          case '999':
            return '9'.repeat(itemReferenceDigits);
        }
      })();

      let sampleIndividualAssetReference = '';
      try {
        sampleIndividualAssetReference =
          EPCUtils.encodeIndividualAssetReference({
            iarPrefix,
            collectionReference: sampleCollectionReference,
            itemReference: sampleItemReference,
            serial: iarPrefixShowSampleType === '999' ? 9999 : 0,
            companyPrefix: haveGs1CompanyPrefix
              ? gs1CompanyPrefix
              : R_GS1_COMPANY_PREFIX,
          });
      } catch (error) {
        if (error instanceof Error) {
          sampleIndividualAssetReference = `Error: ${error.message}`;
        } else {
          sampleIndividualAssetReference = 'Error: Unknown error.';
        }
      }

      let sampleGiai = '';
      try {
        sampleGiai = EPCUtils.encodeGiaiFromIndividualAssetReference({
          iarPrefix,
          companyPrefix: haveGs1CompanyPrefix
            ? gs1CompanyPrefix
            : R_GS1_COMPANY_PREFIX,
          individualAssetReference: sampleIndividualAssetReference,
        });
      } catch (error) {
        if (error instanceof Error) {
          sampleGiai = `Error: ${error.message}`;
        } else {
          sampleGiai = 'Error: Unknown error.';
        }
      }

      let sampleEpcHex = '';
      try {
        sampleEpcHex = EPCUtils.encodeEpcHexFromGiai(sampleGiai);
      } catch (error) {
        if (error instanceof Error) {
          sampleEpcHex = `Error: ${error.message}`;
        } else {
          sampleEpcHex = 'Error: Unknown error.';
        }
      }

      let epcFilter = '';
      try {
        epcFilter = EPCUtils.getEpcFilter({
          iarPrefix,
          companyPrefix: haveGs1CompanyPrefix
            ? gs1CompanyPrefix
            : R_GS1_COMPANY_PREFIX,
        });
      } catch (error) {
        if (error instanceof Error) {
          epcFilter = `Error: ${error.message}`;
        } else {
          epcFilter = 'Error: Unknown error.';
        }
      }

      return (
        <>
          <ScrollView
            ref={setupIarPrefixUIScrollViewRef}
            style={{ backgroundColor }}
            contentContainerStyle={[
              styles.scrollViewContentContainer,
              { paddingTop: scrollViewContentContainerPaddingTop },
            ]}
            automaticallyAdjustKeyboardInsets
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          >
            <UIGroup.FirstGroupSpacing />
            <UIGroup style={[cs.centerChildren, cs.mb16]}>
              <Text style={styles.titleText}>
                Set A Individual Asset Reference Prefix
              </Text>

              {haveGs1CompanyPrefix ? (
                <Text style={styles.text}>
                  Setting a prefix for your Individual Asset Reference number
                  can help you distinguish assets managed by this or other apps.
                  This should be number larger than 0 and not bigger than{' '}
                  {maxIarPrefix}.
                </Text>
              ) : (
                <Text style={styles.text}>
                  Since you are not using a unique Company Prefix, please set a
                  3-4 digit (max: {maxIarPrefix}) prefix to reduce the chances
                  of RFID tag collisions.
                </Text>
              )}
            </UIGroup>

            <UIGroup
              style={{ backgroundColor: contentBackgroundColor }}
              footer={iarPrefixErrorMessage ? iarPrefixErrorMessage : undefined}
              onLayout={event => {
                iarPrefixInputY.current = event.nativeEvent.layout.y;
              }}
            >
              <UIGroup.ListTextInputItem
                keyboardType="number-pad"
                returnKeyType="done"
                monospaced
                placeholder="123"
                value={iarPrefix}
                onChangeText={t => {
                  setIsIarPrefixManuallySet(true);
                  LayoutAnimation.configureNext(
                    DEFAULT_LAYOUT_ANIMATION_CONFIG,
                  );
                  setIarPrefix(t.replace(/\D/g, '').replace(/^0+/, ''));
                  scrollToInput();
                }}
                maxLength={maxIarPrefix.toString().length}
                controlElement={
                  <UIGroup.ListTextInputItem.Button
                    onPress={() => {
                      setIsIarPrefixManuallySet(true);
                      let randomPrefix = 1;
                      randomPrefix = generateRandomIarPrefix({
                        companyPrefix: haveGs1CompanyPrefix
                          ? gs1CompanyPrefix
                          : R_GS1_COMPANY_PREFIX,
                        haveGs1CompanyPrefix: haveGs1CompanyPrefix || false,
                      });
                      if (randomPrefix > maxIarPrefix)
                        randomPrefix = (randomPrefix % maxIarPrefix) + 1;
                      LayoutAnimation.configureNext(
                        DEFAULT_LAYOUT_ANIMATION_CONFIG,
                      );
                      setIarPrefix(randomPrefix.toString());
                      scrollToInput();
                    }}
                  >
                    Generate Random
                  </UIGroup.ListTextInputItem.Button>
                }
                onFocus={scrollToInput}
                // {...setupIarPrefixUIKiaTextInputProps}
              />
            </UIGroup>
            {canGoNext && (
              <>
                <UIGroup style={[cs.centerChildren, cs.mb8]}>
                  {haveGs1CompanyPrefix ? (
                    <Text style={styles.text}>
                      By using the prefix "{iarPrefix}" with your company prefix
                      "{gs1CompanyPrefix}", you can have{' '}
                      <Text style={commonStyles.fwBold}>
                        collection reference numbers with{' '}
                        {collectionReferenceDigits} digits
                      </Text>{' '}
                      and{' '}
                      <Text style={commonStyles.fwBold}>
                        item reference number with {itemReferenceDigits} digits
                      </Text>
                      . This means you can have up to{' '}
                      {(
                        parseInt('9'.repeat(collectionReferenceDigits), 10) + 1
                      ).toLocaleString()}{' '}
                      collections and{' '}
                      {(
                        parseInt('9'.repeat(itemReferenceDigits), 10) + 1
                      ).toLocaleString()}{' '}
                      items under each collection.
                    </Text>
                  ) : (
                    <Text style={styles.text}>
                      By using the prefix "{iarPrefix}" with company prefix "
                      {R_GS1_COMPANY_PREFIX}", you can have{' '}
                      <Text style={commonStyles.fwBold}>
                        collection reference numbers with{' '}
                        {collectionReferenceDigits} digits
                      </Text>{' '}
                      and{' '}
                      <Text style={commonStyles.fwBold}>
                        item reference number with {itemReferenceDigits} digits
                      </Text>
                      . This means you can have up to{' '}
                      {(
                        parseInt('9'.repeat(collectionReferenceDigits), 10) + 1
                      ).toLocaleString()}{' '}
                      collections and{' '}
                      {(
                        parseInt('9'.repeat(itemReferenceDigits), 10) + 1
                      ).toLocaleString()}{' '}
                      items under each collection.
                    </Text>
                  )}
                  <Text style={styles.text}>
                    Here is a sample of an RFID tag on your item:
                  </Text>
                </UIGroup>
                <UIGroup
                  style={{ backgroundColor: contentBackgroundColor }}
                  footer={(() => {
                    if (!sampleEpcHex.startsWith(epcFilter)) {
                      return '⚠ EPC does not starts with EPC filter.';
                    }

                    return undefined;
                  })()}
                >
                  <TouchableWithoutFeedback
                    onPress={() => {
                      setIarPrefixShowSampleType(v => {
                        switch (v) {
                          case '123':
                            return '999';
                          case '999':
                            return '000';
                          case '000':
                            return '123';
                        }
                      });
                    }}
                  >
                    <UIGroup.ListItem
                      verticalArrangedLargeTextIOS
                      label="Individual Asset Reference"
                      monospaceDetail
                      detail={sampleIndividualAssetReference}
                    />
                  </TouchableWithoutFeedback>
                  <UIGroup.ListItemSeparator />
                  <UIGroup.ListItem
                    verticalArrangedLargeTextIOS
                    label="EPC Tag URI"
                    monospaceDetail
                    detail={sampleGiai}
                  />
                  <UIGroup.ListItemSeparator />
                  <UIGroup.ListItem
                    verticalArrangedLargeTextIOS
                    label="RFID Tag EPC Memory Bank Contents (hex)"
                    monospaceDetail
                    detail={sampleEpcHex}
                  />
                  {/*
                  <UIGroup.ListItemSeparator />
                  <UIGroup.ListItem
                    verticalArrangedLargeTextIOS
                    label="EPC Filter"
                    monospaceDetail
                    detail={epcFilter}
                  />
                  */}
                </UIGroup>
              </>
            )}
          </ScrollView>

          {canGoNext && (
            <BlurView
              blurType="regular"
              style={[
                styles.absoluteFooter,
                Platform.OS === 'ios' ? {} : { backgroundColor },
              ]}
            >
              <UIGroup>
                <Button
                  title="Next"
                  mode="contained"
                  onPress={() => {
                    props.navigation.navigate('SetupRFIDTagPassword');
                  }}
                />
              </UIGroup>
            </BlurView>
          )}
        </>
      );
    },
    [
      backgroundColor,
      contentBackgroundColor,
      gs1CompanyPrefix,
      haveGs1CompanyPrefix,
      iarPrefix,
      iarPrefixShowSampleType,
      scrollViewContentContainerPaddingTop,
    ],
  );

  const [rfidTagAccessPassword, setRfidTagAccessPassword] = useState('');
  const [showRfidTagAccessPassword, setShowRfidTagAccessPassword] =
    useState(false);
  const [rfidTagAccessPasswordEncoding, setRfidTagAccessPasswordEncoding] =
    useState('082a4c6e');
  // const [
  //   showRfidTagAccessPasswordEncoding,
  //   setShowRfidTagAccessPasswordEncoding,
  // ] = useState(false);

  // const [
  //   setupRfidTagPasswordUIShowAdvanced,
  //   setSetupRfidTagPasswordUIShowAdvanced,
  // ] = useState(false);
  const [useMixedAccessPassword, setUseMixedAccessPassword] = useState(false);

  const setupRfidTagPasswordUIScrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps: setupRfidTagPasswordUIKiaTextInputProps } =
    useScrollViewAutomaticallyAdjustKeyboardInsetsFix(
      setupRfidTagPasswordUIScrollViewRef,
    );

  const saveConfig = useCallback(async () => {
    return await updateConfig({
      rfid_tag_company_prefix: haveGs1CompanyPrefix
        ? gs1CompanyPrefix
        : R_GS1_COMPANY_PREFIX,
      rfid_tag_individual_asset_reference_prefix: iarPrefix,
      rfid_tag_access_password: rfidTagAccessPassword,
      default_use_mixed_rfid_tag_access_password: useMixedAccessPassword,
      ...(useMixedAccessPassword
        ? { rfid_tag_access_password_encoding: rfidTagAccessPasswordEncoding }
        : {}),
    });
  }, [
    gs1CompanyPrefix,
    haveGs1CompanyPrefix,
    iarPrefix,
    rfidTagAccessPassword,
    rfidTagAccessPasswordEncoding,
    updateConfig,
    useMixedAccessPassword,
  ]);

  const [delayConfirmAndProceedSeconds, setDelayConfirmAndProceedSeconds] =
    useState(0);
  useEffect(() => {
    if (delayConfirmAndProceedSeconds <= 0) return;

    const timer = setTimeout(() => {
      setDelayConfirmAndProceedSeconds(v => v - 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  });

  const setupRfidTagPasswordUI = useCallback(
    (props: StackScreenProps<any>) => {
      const rfidTagAccessPasswordErrorMessage = (() => {
        if (!rfidTagAccessPassword) {
          return 'Please set a password.';
        }

        if (rfidTagAccessPassword.length !== 8) {
          return '⚠ Should have length of 8.';
        }

        return undefined;
      })();

      const rfidTagAccessPasswordEncodingErrorMessage = (() => {
        if (!useMixedAccessPassword) {
          return undefined;
        }

        if (rfidTagAccessPasswordEncoding.length !== 8) {
          return '⚠ Password encoding should have length of 8.';
        }

        return undefined;
      })();

      return (
        <>
          <ScrollView
            ref={setupRfidTagPasswordUIScrollViewRef}
            style={{ backgroundColor }}
            contentContainerStyle={[
              styles.scrollViewContentContainer,
              { paddingTop: scrollViewContentContainerPaddingTop },
            ]}
            automaticallyAdjustKeyboardInsets
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          >
            <UIGroup.FirstGroupSpacing />
            <UIGroup style={[cs.centerChildren, cs.mb4]}>
              <Text style={styles.titleText}>
                Setup RFID Tag Access Password
              </Text>

              <Text style={styles.text}>
                To prevent unauthorized writes to your RFID tags, please setup a
                password that will be used to lock your tags from being
                modified.
              </Text>
              <View style={styles.inGroupSpacing} />
              <Text style={styles.text}>
                The password must contain only hex digits (0-9, a-f) and have a
                length of 8.
              </Text>
            </UIGroup>

            <UIGroup
              style={{ backgroundColor: contentBackgroundColor }}
              footer={rfidTagAccessPasswordErrorMessage}
            >
              <UIGroup.ListTextInputItem
                secureTextEntry={!showRfidTagAccessPassword}
                monospaced
                returnKeyType="done"
                placeholder="0f1e2d3c"
                value={rfidTagAccessPassword}
                onChangeText={t => {
                  setRfidTagAccessPassword(
                    t.replace(/[^0-9a-f]/, '').slice(0, 8),
                  );
                }}
                maxLength={8}
                controlElement={
                  <>
                    {!!rfidTagAccessPassword && (
                      <UIGroup.ListTextInputItem.Button
                        onPress={() => {
                          setShowRfidTagAccessPassword(v => !v);
                        }}
                      >
                        {showRfidTagAccessPassword ? 'Hide' : 'Show'}
                      </UIGroup.ListTextInputItem.Button>
                    )}
                    <UIGroup.ListTextInputItem.Button
                      onPress={() => {
                        setRfidTagAccessPassword(uuidv4().split('-')[0]);
                        if (showRfidTagAccessPassword === false) {
                          setShowRfidTagAccessPassword(true);
                          setTimeout(() => {
                            setShowRfidTagAccessPassword(false);
                          }, 500);
                        }
                      }}
                    >
                      Generate Random
                    </UIGroup.ListTextInputItem.Button>
                  </>
                }
                {...setupRfidTagPasswordUIKiaTextInputProps}
              />
            </UIGroup>

            {/*
            <UIGroup style={[cs.centerChildren]}>
              <Text style={styles.text}>
                <Link
                  onPress={() => {
                    LayoutAnimation.configureNext(
                      DEFAULT_LAYOUT_ANIMATION_CONFIG,
                    );
                    setSetupRfidTagPasswordUIShowAdvanced(v => !v);
                  }}
                >
                  {setupRfidTagPasswordUIShowAdvanced
                    ? 'Hide Advanced Configurations'
                    : 'Show Advanced Configurations'}
                </Link>
              </Text>
            </UIGroup>
            */}

            <UIGroup
              style={{ backgroundColor: contentBackgroundColor }}
              footer={
                rfidTagAccessPasswordEncodingErrorMessage ||
                (useMixedAccessPassword
                  ? `The password you set will be mixed with a per-item, randomly-generated hex to give each item a unique access password. This will mitigate the impact of password leakage.\n\nFor example, with the encoding "${rfidTagAccessPasswordEncoding}", if your global password is "12345678" and with an item with random hex "abcdef09", the item's RFID tag access password will be "${getTagAccessPassword(
                      '12345678',
                      'abcdef09',
                      true,
                      rfidTagAccessPasswordEncoding,
                    )}".`
                  : 'The same access password will be used to lock all of your RFID tags.')
              }
            >
              <UIGroup.ListTextInputItem
                horizontalLabel
                label="Use Mixed Password"
                inputElement={
                  <UIGroup.ListItem.Switch
                    value={useMixedAccessPassword}
                    onValueChange={v => {
                      LayoutAnimation.configureNext(
                        DEFAULT_LAYOUT_ANIMATION_CONFIG,
                      );
                      setUseMixedAccessPassword(v);
                    }}
                  />
                }
              />
              {useMixedAccessPassword && (
                <>
                  <UIGroup.ListItemSeparator />
                  <UIGroup.ListTextInputItem
                    horizontalLabel
                    label="Password Encoding"
                    monospaced
                    placeholder="082a4c6e"
                    value={rfidTagAccessPasswordEncoding}
                    onChangeText={t => {
                      setRfidTagAccessPasswordEncoding(
                        t.replace(/[^0-9a-f]/, '').slice(0, 8),
                      );
                    }}
                    maxLength={8}
                    controlElement={
                      <UIGroup.ListTextInputItem.Button
                        onPress={() => {
                          setRfidTagAccessPasswordEncoding(
                            generateRfidTagPasswordEncoding(),
                          );
                        }}
                      >
                        Generate
                      </UIGroup.ListTextInputItem.Button>
                    }
                    {...setupRfidTagPasswordUIKiaTextInputProps}
                  />
                </>
              )}
            </UIGroup>

            {/*
            {setupRfidTagPasswordUIShowAdvanced && (
              <>
                <UIGroup style={[cs.centerChildren, cs.mb4]}>
                  <Text style={styles.text}>Password encoding:</Text>
                </UIGroup>

                <UIGroup
                  style={{ backgroundColor: contentBackgroundColor }}
                  footer={
                    gs1CompanyPrefixErrorMessage
                      ? gs1CompanyPrefixErrorMessage
                      : undefined
                  }
                >
                  <UIGroup.ListTextInputItem
                    secureTextEntry={!showRfidTagAccessPasswordEncoding}
                    monospaced
                    placeholder="082a4c6e"
                    value={rfidTagAccessPasswordEncoding}
                    onChangeText={t => {
                      setRfidTagAccessPasswordEncoding(
                        t.replace(/[^0-9a-f]/, '').slice(0, 8),
                      );
                    }}
                    maxLength={8}
                    controlElement={
                      <>
                        {!!rfidTagAccessPasswordEncoding && (
                          <UIGroup.ListTextInputItem.Button
                            onPress={() => {
                              setShowRfidTagAccessPasswordEncoding(v => !v);
                            }}
                          >
                            {showRfidTagAccessPasswordEncoding
                              ? 'Hide'
                              : 'Show'}
                          </UIGroup.ListTextInputItem.Button>
                        )}
                        <UIGroup.ListTextInputItem.Button
                          onPress={() => {
                            setRfidTagAccessPasswordEncoding(
                              generateRfidTagPasswordEncoding(),
                            );
                            if (showRfidTagAccessPasswordEncoding === false) {
                              setShowRfidTagAccessPasswordEncoding(true);
                              setTimeout(() => {
                                setShowRfidTagAccessPasswordEncoding(false);
                              }, 500);
                            }
                          }}
                        >
                          Generate Random
                        </UIGroup.ListTextInputItem.Button>
                      </>
                    }
                    {...setupRfidTagPasswordUIKiaTextInputProps}
                  />
                </UIGroup>
              </>
            )}
            */}
          </ScrollView>

          {!rfidTagAccessPasswordErrorMessage &&
            !rfidTagAccessPasswordEncodingErrorMessage && (
              <BlurView
                blurType="regular"
                style={[
                  styles.absoluteFooter,
                  Platform.OS === 'ios' ? {} : { backgroundColor },
                ]}
              >
                <UIGroup>
                  <Button
                    title="Done"
                    mode="contained"
                    onPress={async () => {
                      const success = await saveConfig();
                      if (!success) return;
                      setDelayConfirmAndProceedSeconds(5);
                      props.navigation.navigate('ConfirmSetup');
                    }}
                  />
                </UIGroup>
              </BlurView>
            )}
        </>
      );
    },
    [
      backgroundColor,
      contentBackgroundColor,
      rfidTagAccessPassword,
      rfidTagAccessPasswordEncoding,
      saveConfig,
      scrollViewContentContainerPaddingTop,
      setupRfidTagPasswordUIKiaTextInputProps,
      showRfidTagAccessPassword,
      useMixedAccessPassword,
    ],
  );

  // const [
  //   confirmationShowPasswordEncoding,
  //   setConfirmationShowPasswordEncoding,
  // ] = useState(false);
  const confirmSetupUI = useCallback(
    (props: StackScreenProps<any>) => {
      return (
        <>
          <ScrollView
            style={{ backgroundColor }}
            contentContainerStyle={[
              styles.scrollViewContentContainer,
              { paddingTop: scrollViewContentContainerPaddingTop },
            ]}
          >
            <UIGroup.FirstGroupSpacing />
            <UIGroup style={[cs.centerChildren, cs.mb24]}>
              <Text style={styles.titleText}>Congratulations!</Text>
              <Text style={styles.text}>
                You're all set! Please confirm your setup below.
              </Text>
            </UIGroup>

            <Configuration
              uiGroupStyle={{ backgroundColor: contentBackgroundColor }}
              listItemSeparatorColor={listItemSeparatorColor}
            />

            <UIGroup style={[cs.centerChildren]}>
              <Text style={styles.text}>
                If there's anything you want to alter, press the back button to
                go back now. You might not be able to change them later.
              </Text>
            </UIGroup>
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
                title={`Confirm and Proceed${
                  delayConfirmAndProceedSeconds > 0
                    ? ` (${delayConfirmAndProceedSeconds})`
                    : ''
                }`}
                mode="contained"
                style={
                  delayConfirmAndProceedSeconds > 0 ? cs.opacity04 : undefined
                }
                onPress={
                  delayConfirmAndProceedSeconds <= 0
                    ? () => {
                        if (!config?.uuid) return;

                        dispatch(
                          actions.profiles.markCurrentProfileAsSetupDone({
                            configUuid: config.uuid,
                          }),
                        );
                        isSetupNotDoneRef.current = false;
                        navigation.goBack();
                      }
                    : undefined
                }
              />
            </UIGroup>
          </BlurView>
        </>
      );
    },
    [
      backgroundColor,
      config?.uuid,
      contentBackgroundColor,
      delayConfirmAndProceedSeconds,
      dispatch,
      listItemSeparatorColor,
      navigation,
      scrollViewContentContainerPaddingTop,
    ],
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
  const prevInitialSyncDoneProgress = useRef(0);
  useEffect(() => {
    if (initialSyncDoneProgress !== prevInitialSyncDoneProgress.current) {
      LayoutAnimation.configureNext(DEFAULT_LAYOUT_ANIMATION_CONFIG);
      prevInitialSyncDoneProgress.current = initialSyncDoneProgress;
    }
  }, [initialSyncDoneProgress]);

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
        <>
          <ScrollView
            ref={restoreFromCouchDBScrollViewRef}
            style={{ backgroundColor }}
            contentContainerStyle={[
              styles.scrollViewContentContainer,
              { paddingTop: scrollViewContentContainerPaddingTop },
            ]}
            automaticallyAdjustKeyboardInsets
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          >
            <UIGroup.FirstGroupSpacing />
            <UIGroup style={[cs.centerChildren, cs.mb16]}>
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
        </>
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
                    <ProgressView
                      progress={
                        initialSyncRemainingProgress > 0
                          ? initialSyncDoneProgress /
                            initialSyncRemainingProgress
                          : 0
                      }
                      style={[
                        commonStyles.alignSelfStretch,
                        commonStyles.mt8,
                        commonStyles.mb4,
                      ]}
                    />
                    <Text
                      style={[
                        styles.text,
                        styles.smallerText,
                        commonStyles.mt2,
                      ]}
                    >
                      {initialSyncDoneProgress}/{initialSyncRemainingProgress}{' '}
                      documents synced
                    </Text>
                    {initialSyncDoneProgress > 100 && (
                      <View style={commonStyles.mt8}>
                        <Text style={styles.smallerText}>
                          While it's recommended to wait until the initial sync
                          to be completed, you can still{' '}
                          <Link onPress={() => navigation.goBack()}>
                            skip waiting and start using the app now
                          </Link>
                          .
                        </Text>
                      </View>
                    )}
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
    if (!config?.uuid) return;

    if (dbSyncHasBeenSetupStatus === 'DONE') {
      dispatch(
        actions.profiles.markCurrentProfileAsSetupDone({
          configUuid: config.uuid,
        }),
      );
    } else if (
      dbSyncHasBeenSetupStatus === 'WORKING' &&
      initialSyncDoneProgress > 10
    ) {
      dispatch(
        actions.profiles.markCurrentProfileAsSetupDone({
          configUuid: config.uuid,
        }),
      );
    }
  }, [
    dbSyncHasBeenSetupStatus,
    dispatch,
    navigation,
    initialSyncDoneProgress,
    config?.uuid,
  ]);

  // Load form values from config
  useEffect(() => {
    if (config?.rfid_tag_access_password_encoding) {
      setRfidTagAccessPasswordEncoding(
        config.rfid_tag_access_password_encoding,
      );
    }

    // Leave other fields blank if the config is not saved.
    if (!config?._id) return;

    if (config?.rfid_tag_company_prefix) {
      if (config?.rfid_tag_company_prefix === R_GS1_COMPANY_PREFIX) {
        setHaveGs1CompanyPrefix(false);
      } else {
        setHaveGs1CompanyPrefix(true);
        setGs1CompanyPrefix(config.rfid_tag_company_prefix);
      }
    }

    if (config?.rfid_tag_individual_asset_reference_prefix) {
      setIarPrefix(config.rfid_tag_individual_asset_reference_prefix);
      setIsIarPrefixManuallySet(true);
    }

    if (config?.rfid_tag_access_password) {
      setRfidTagAccessPassword(config.rfid_tag_access_password);
    }

    if (
      typeof config?.default_use_mixed_rfid_tag_access_password === 'boolean'
    ) {
      setUseMixedAccessPassword(
        config?.default_use_mixed_rfid_tag_access_password,
      );
    }
  }, [config]);

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
        // headerTitle: '',
        // headerBackTitle: 'Back',
        headerTitleStyle: { color: 'transparent' },
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
          headerTitle: 'Welcome',
          headerBackVisible: false,
          header: Platform.OS === 'android' ? () => null : undefined,
        }}
      >
        {welcomeUI}
      </Stack.Screen>
      <Stack.Screen
        name="NewOrRestore"
        options={{
          headerTitle: 'Restore or Setup',
        }}
      >
        {newOrRestoreUI}
      </Stack.Screen>
      <Stack.Screen
        name="Setup"
        options={{
          headerTitle: 'Set GS1 Company Prefix',
        }}
      >
        {setupGS1CompanyPrefixUI}
      </Stack.Screen>
      <Stack.Screen
        name="SetupIARPrefix"
        options={{
          headerTitle: 'Set IAR Prefix',
        }}
      >
        {setupIarPrefixUI}
      </Stack.Screen>
      <Stack.Screen
        options={{
          headerTitle: 'Set RFID Tag Password',
        }}
        name="SetupRFIDTagPassword"
      >
        {setupRfidTagPasswordUI}
      </Stack.Screen>
      <Stack.Screen
        options={{
          headerTitle: 'Confirm',
        }}
        name="ConfirmSetup"
      >
        {confirmSetupUI}
      </Stack.Screen>
      <Stack.Screen
        options={{
          headerTitle: 'Restore from CouchDB',
        }}
        name="RestoreFromCouchDB"
      >
        {restoreFromCouchDBUI}
      </Stack.Screen>
      <Stack.Screen
        name="DBSyncHasBeenSetup"
        options={{
          headerTitle: 'Restore from CouchDB',
          headerBackVisible: false,
        }}
      >
        {dbSyncHasBeenSetupUI}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function generateRandomIarPrefix({
  companyPrefix,
  haveGs1CompanyPrefix,
}: {
  companyPrefix: string;
  haveGs1CompanyPrefix: boolean;
}) {
  const maxIarPrefix = EPCUtils.getMaxNsIarPrefix({ companyPrefix });
  let num;
  do {
    num = Math.floor(Math.random() * maxIarPrefix) + 1;
  } while (
    !haveGs1CompanyPrefix &&
    (num < 100 || num.toString().startsWith('72'))
  );
  return num;
}

function generateRfidTagPasswordEncoding() {
  const lowChars = '01234567';
  const highChars = '89abcdef';
  let combined = [];

  // Generate 4 unique low characters
  const uniqueLowChars = lowChars
    .split('')
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);

  // Generate 4 unique high characters
  const uniqueHighChars = highChars
    .split('')
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);

  // Combine them into a single array
  combined = uniqueLowChars.concat(uniqueHighChars);

  // Shuffle and join them into a string
  return combined.sort(() => 0.5 - Math.random()).join('');
}

const styles = StyleSheet.create({
  cardStyle: {
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  welcomeAppIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  scrollViewContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 20,
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
  inGroupSpacing: {
    height: 12,
    width: 12,
  },
  absoluteFooter: {
    position: 'absolute',
    bottom: -100,
    left: 0,
    right: 0,
    paddingBottom: 108,
    paddingTop: 16,
  },
});

export default OnboardingScreen;
