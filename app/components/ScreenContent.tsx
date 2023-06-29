import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  TextInput,
  BackHandler,
} from 'react-native';
import { Appbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTabBarInsets from '@app/hooks/useTabBarInsets';
import { SFSymbol } from 'react-native-sfsymbols';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import useColors from '@app/hooks/useColors';
import verifyMaterialCommunityIconName from '@app/utils/verifyMaterialCommunityIconName';
import commonStyles from '@app/utils/commonStyles';
import ScreenContentScrollView from './ScreenContentScrollView';

type Props = {
  navigation: StackScreenProps<StackParamList>['navigation'];
  showAppBar?: boolean;
  showSearch?: boolean;
  onSearchBlur?: () => void;
  searchHideWhenScrollingIOS?: boolean;
  searchCanBeClosedAndroid?: boolean;
  // autoFocusSearch?: boolean;

  title: string;
  headerLargeTitle?: boolean;
  children: JSX.Element;

  onSearchChangeText?: (v: string) => void;

  action1Label?: string;
  action1SFSymbolName?: string;
  /** See: https://materialdesignicons.com */
  action1MaterialIconName?: string;
  onAction1Press?: () => void;
  action1Color?: string;

  action2Label?: string;
  action2SFSymbolName?: string;
  /** See: https://materialdesignicons.com */
  action2MaterialIconName?: string;
  onAction2Press?: () => void;

  action3Label?: string;
  action3SFSymbolName?: string;
  /** See: https://materialdesignicons.com */
  action3MaterialIconName?: string;
  onAction3Press?: () => void;

  overlay?: JSX.Element;

  route?: unknown;
};

function ScreenContent({
  navigation,
  showAppBar = true,
  showSearch,
  onSearchBlur,
  searchHideWhenScrollingIOS = true,
  searchCanBeClosedAndroid = true,
  // autoFocusSearch,
  onSearchChangeText,
  title,
  headerLargeTitle = true,
  children,
  action1Label,
  action1SFSymbolName,
  action1MaterialIconName,
  onAction1Press,
  action1Color,
  action2Label,
  action2SFSymbolName,
  action2MaterialIconName,
  onAction2Press,
  action3Label,
  action3SFSymbolName,
  action3MaterialIconName,
  onAction3Press,
  overlay,
  route,
}: Props) {
  const safeAreaInsets = useSafeAreaInsets();
  const tabBarInsets = useTabBarInsets();
  const { backgroundColor, iosHeaderTintColor } = useColors();

  // For Android
  const [searchText, setSearchText] = useState('');

  // iOS native navigation bar
  useLayoutEffect(() => {
    if (Platform.OS !== 'ios') return;

    if (!showAppBar) {
      navigation.setOptions({ headerShown: false });
      return;
    }

    navigation.setOptions({
      headerShown: true,
      ...({ headerLargeTitle } as any),
      title,
      ...(showSearch
        ? {
            headerSearchBarOptions: {
              // autoFocus: autoFocusSearch,
              hideWhenScrolling: searchHideWhenScrollingIOS,
              onChangeText: (event: any) =>
                onSearchChangeText &&
                onSearchChangeText(event?.nativeEvent?.text || ''),
              onBlur: onSearchBlur,
            },
          }
        : {}),
      headerRight: () => (
        <View
          style={[
            commonStyles.row,
            commonStyles.centerChildren,
            commonStyles.mrm4,
          ]}
        >
          {(action3Label || action3SFSymbolName) && (
            <TouchableOpacity
              onPress={onAction3Press}
              style={[
                !!action3SFSymbolName &&
                  commonStyles.touchableSFSymbolContainer,
                action3SFSymbolName
                  ? styles.touchableSFSymbolContainer
                  : styles.touchableTextContainer,
              ]}
            >
              {action3SFSymbolName ? (
                <SFSymbol
                  name={action3SFSymbolName}
                  color={iosHeaderTintColor}
                  size={22}
                />
              ) : (
                <Text
                  style={[
                    styles.iosHeaderButtonText,
                    { color: iosHeaderTintColor },
                  ]}
                >
                  {action3Label}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {(action2Label || action2SFSymbolName) && (
            <TouchableOpacity
              onPress={onAction2Press}
              style={[
                !!action2SFSymbolName &&
                  commonStyles.touchableSFSymbolContainer,
                action2SFSymbolName
                  ? styles.touchableSFSymbolContainer
                  : styles.touchableTextContainer,
              ]}
            >
              {action2SFSymbolName ? (
                <SFSymbol
                  name={action2SFSymbolName}
                  color={iosHeaderTintColor}
                  size={22}
                />
              ) : (
                <Text
                  style={[
                    styles.iosHeaderButtonText,
                    { color: iosHeaderTintColor },
                  ]}
                >
                  {action2Label}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {(action1Label || action1SFSymbolName) && (
            <TouchableOpacity
              onPress={onAction1Press}
              style={[
                !!action1SFSymbolName &&
                  commonStyles.touchableSFSymbolContainer,
                action1SFSymbolName
                  ? styles.touchableSFSymbolContainer
                  : styles.touchableTextContainer,
              ]}
            >
              {action1SFSymbolName ? (
                <SFSymbol
                  name={action1SFSymbolName}
                  color={action1Color || iosHeaderTintColor}
                  size={22}
                />
              ) : (
                <Text
                  style={[
                    styles.iosHeaderButtonText,
                    { color: iosHeaderTintColor },
                  ]}
                >
                  {action1Label}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      ),
    });
  }, [
    action1Label,
    action1SFSymbolName,
    action1Color,
    action2Label,
    action2SFSymbolName,
    action3Label,
    action3SFSymbolName,
    // autoFocusSearch,
    iosHeaderTintColor,
    navigation,
    onAction1Press,
    onAction2Press,
    onAction3Press,
    onSearchChangeText,
    showAppBar,
    showSearch,
    onSearchBlur,
    searchHideWhenScrollingIOS,
    title,
    headerLargeTitle,
  ]);

  const verifiedAction1MaterialIconName = verifyMaterialCommunityIconName(
    action1MaterialIconName,
  );
  const verifiedAction2MaterialIconName = verifyMaterialCommunityIconName(
    action2MaterialIconName,
  );
  const verifiedAction3MaterialIconName = verifyMaterialCommunityIconName(
    action3MaterialIconName,
  );

  const [searchEnabled, setSearchEnabled] = useState(
    searchCanBeClosedAndroid ? false : true,
  );
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (searchEnabled && searchCanBeClosedAndroid) {
          setSearchEnabled(false);
          return true;
        } else {
          return false;
        }
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [searchEnabled, searchCanBeClosedAndroid]),
  );

  React.useEffect(() => {
    if (typeof route !== 'object') return;
    const params = (route as Record<string, unknown>)?.params;
    if (typeof params !== 'object') return;
    const beforeRemove = (params as Record<string, unknown>)?.beforeRemove;
    if (typeof beforeRemove !== 'function') return;

    const unsubscribe = navigation.addListener('beforeRemove', () => {
      beforeRemove();
    });

    return unsubscribe;
  }, [navigation, route]);

  const searchInputRef = useRef<TextInput>(null);

  return (
    <View style={commonStyles.flex1}>
      {Platform.OS !== 'ios' && showAppBar && (
        <Appbar.Header
          elevated
          style={{
            paddingTop: safeAreaInsets.top,
            height: 56 + safeAreaInsets.top,
          }}
        >
          {navigation.canGoBack() ||
          (searchEnabled && searchCanBeClosedAndroid) ? (
            <Appbar.BackAction
              onPress={() =>
                searchEnabled ? setSearchEnabled(false) : navigation.goBack()
              }
            />
          ) : searchCanBeClosedAndroid ? (
            <View style={styles.appBarSpacer} />
          ) : (
            <Appbar.Action
              icon="magnify"
              onPress={() => searchInputRef.current?.focus()}
            />
          )}
          {searchEnabled ? (
            <>
              <TextInput
                ref={searchInputRef}
                style={styles.searchTextInput}
                autoFocus={searchCanBeClosedAndroid}
                placeholder="Search"
                value={searchText}
                onChangeText={text => {
                  setSearchText(text);
                  onSearchChangeText && onSearchChangeText(text);
                }}
                returnKeyType="search"
                onBlur={onSearchBlur}
              />
              {!searchCanBeClosedAndroid && (
                <>
                  {searchText && (
                    <Appbar.Action
                      icon="close"
                      onPress={() => {
                        searchInputRef.current?.clear();
                        onSearchChangeText && onSearchChangeText('');
                      }}
                    />
                  )}
                  {verifiedAction3MaterialIconName && onAction2Press && (
                    <Appbar.Action
                      icon={verifiedAction3MaterialIconName}
                      onPress={onAction3Press}
                    />
                  )}
                  {verifiedAction2MaterialIconName && onAction2Press && (
                    <Appbar.Action
                      icon={verifiedAction2MaterialIconName}
                      onPress={onAction2Press}
                    />
                  )}
                  {verifiedAction1MaterialIconName && onAction1Press && (
                    <Appbar.Action
                      icon={verifiedAction1MaterialIconName}
                      onPress={onAction1Press}
                    />
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <Appbar.Content title={title} />
              {showSearch && (
                <Appbar.Action
                  icon="magnify"
                  onPress={() => setSearchEnabled(true)}
                />
              )}
              {verifiedAction3MaterialIconName && onAction2Press && (
                <Appbar.Action
                  icon={verifiedAction3MaterialIconName}
                  onPress={onAction3Press}
                />
              )}
              {verifiedAction2MaterialIconName && onAction2Press && (
                <Appbar.Action
                  icon={verifiedAction2MaterialIconName}
                  onPress={onAction2Press}
                />
              )}
              {verifiedAction1MaterialIconName && onAction1Press && (
                <Appbar.Action
                  icon={verifiedAction1MaterialIconName}
                  onPress={onAction1Press}
                />
              )}
            </>
          )}
        </Appbar.Header>
      )}
      {Platform.OS === 'ios'
        ? {
            ...children,
            props: {
              contentInsetAdjustmentBehavior: 'automatic',
              automaticallyAdjustContentInsets: true,
              automaticallyAdjustsScrollIndicatorInsets: true,
              ...children.props,
              contentInset: {
                bottom: tabBarInsets.scrollViewBottom,
              },
              style: [
                ...(Array.isArray(children.props.style)
                  ? children.props.style
                  : [children.props.style]),
                { backgroundColor },
              ],
            },
          }
        : {
            ...children,
            props: {
              ...children.props,
              style: [
                ...(Array.isArray(children.props.style)
                  ? children.props.style
                  : [children.props.style]),
                { backgroundColor },
              ],
              contentContainerStyle: [
                ...(Array.isArray(children.props.contentContainerStyle)
                  ? children.props.contentContainerStyle
                  : [children.props.contentContainerStyle]),
                { paddingTop: 16 },
              ],
            },
          }}
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  touchableSFSymbolContainer: {
    marginLeft: 2,
  },
  touchableTextContainer: {
    marginLeft: 12,
    marginRight: 4,
  },
  iosHeaderButtonText: {
    fontSize: 17,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 16,
  },
  appBarSpacer: {
    width: 24,
  },
});

ScreenContent.ScrollView = ScreenContentScrollView;

export default ScreenContent;
