import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { Appbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SFSymbol } from 'react-native-sfsymbols';

import commonStyles from '@app/utils/commonStyles';
import verifyMaterialCommunityIconName from '@app/utils/verifyMaterialCommunityIconName';

import type { StackParamList } from '@app/navigation/MainStack';

import useActionSheet from '@app/hooks/useActionSheet';
import useColors from '@app/hooks/useColors';
import useTabBarInsets from '@app/hooks/useTabBarInsets';

import { MenuAction, MenuView } from '@app/components/Menu';

import ScreenContentScrollView from './ScreenContentScrollView';

type Props = {
  navigation: StackScreenProps<StackParamList>['navigation'];
  showAppBar?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearchFocus?: () => void;
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
  action1MenuActions?: ReadonlyArray<MenuAction>;
  action1Color?: string;

  action2Label?: string;
  action2SFSymbolName?: string;
  /** See: https://materialdesignicons.com */
  action2MaterialIconName?: string;
  onAction2Press?: () => void;
  action2MenuActions?: ReadonlyArray<MenuAction>;

  action3Label?: string;
  action3SFSymbolName?: string;
  /** See: https://materialdesignicons.com */
  action3MaterialIconName?: string;
  onAction3Press?: () => void;
  action3MenuActions?: ReadonlyArray<MenuAction>;

  headerRight?: JSX.Element;

  overlay?: JSX.Element;

  route?: unknown;
};

function ScreenContent({
  navigation,
  showAppBar = true,
  showSearch,
  searchPlaceholder,
  onSearchFocus,
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
  action1MenuActions,
  action1Color,
  action2Label,
  action2SFSymbolName,
  action2MaterialIconName,
  onAction2Press,
  action2MenuActions,
  action3Label,
  action3SFSymbolName,
  action3MaterialIconName,
  onAction3Press,
  action3MenuActions,
  headerRight,
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
              placeholder: searchPlaceholder,
              onFocus: onSearchFocus,
              onBlur: onSearchBlur,
            },
          }
        : {}),
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <View
          style={[
            commonStyles.row,
            commonStyles.centerChildren,
            commonStyles.mrm4,
          ]}
        >
          {(
            [
              {
                key: 3,
                actionLabel: action3Label,
                actionSFSymbolName: action3SFSymbolName,
                actionColor: undefined,
                onActionPress: onAction3Press,
                actionMenuActions: action3MenuActions,
              },
              {
                key: 2,
                actionLabel: action2Label,
                actionSFSymbolName: action2SFSymbolName,
                actionColor: undefined,
                onActionPress: onAction2Press,
                actionMenuActions: action2MenuActions,
              },
              {
                key: 1,
                actionLabel: action1Label,
                actionSFSymbolName: action1SFSymbolName,
                actionColor: action1Color,
                onActionPress: onAction1Press,
                actionMenuActions: action1MenuActions,
              },
            ] as const
          )
            .map(
              ({
                key,
                actionLabel,
                actionSFSymbolName,
                actionColor,
                onActionPress,
                actionMenuActions,
              }) =>
                (actionLabel || actionSFSymbolName) &&
                (() => {
                  const c = (
                    <TouchableOpacity
                      key={key}
                      onPress={onActionPress}
                      style={[
                        !!actionSFSymbolName &&
                          commonStyles.touchableSFSymbolContainer,
                        actionSFSymbolName
                          ? styles.touchableSFSymbolContainer
                          : styles.touchableTextContainer,
                      ]}
                    >
                      {actionSFSymbolName ? (
                        <SFSymbol
                          name={actionSFSymbolName}
                          color={actionColor || iosHeaderTintColor}
                          size={22}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.iosHeaderButtonText,
                            { color: iosHeaderTintColor },
                          ]}
                        >
                          {actionLabel}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                  if (actionMenuActions) {
                    return (
                      <MenuView key={key} actions={actionMenuActions}>
                        {c}
                      </MenuView>
                    );
                  }
                  return c;
                })(),
            )
            .filter(a => !!a)}

          {headerRight}
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
    iosHeaderTintColor,
    navigation,
    onAction1Press,
    onAction2Press,
    onAction3Press,
    action1MenuActions,
    action2MenuActions,
    action3MenuActions,
    onSearchChangeText,
    showAppBar,
    showSearch,
    onSearchBlur,
    searchHideWhenScrollingIOS,
    title,
    headerLargeTitle,
    searchPlaceholder,
    onSearchFocus,
    headerRight,
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
          setSearchText('');
          onSearchChangeText && onSearchChangeText('');
          return true;
        } else {
          return false;
        }
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [searchEnabled, searchCanBeClosedAndroid, onSearchChangeText]),
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

  const { showActionSheet } = useActionSheet();

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
              onPress={() => {
                if (searchEnabled) {
                  setSearchEnabled(false);
                  setSearchText('');
                  onSearchChangeText && onSearchChangeText('');
                } else {
                  navigation.goBack();
                }
              }}
            />
          ) : searchCanBeClosedAndroid ? (
            <View style={styles.appBarSpacer} />
          ) : (
            <Appbar.Action
              icon="magnify"
              onPress={() => searchInputRef.current?.focus()}
            />
          )}
          {(() => {
            const actionButtons = (
              [
                {
                  key: 3,
                  verifiedActionMaterialIconName:
                    verifiedAction3MaterialIconName,
                  actionMenuActions: action3MenuActions,
                  onActionPress: onAction3Press,
                },
                {
                  key: 2,
                  verifiedActionMaterialIconName:
                    verifiedAction2MaterialIconName,
                  actionMenuActions: action2MenuActions,
                  onActionPress: onAction2Press,
                },
                {
                  key: 1,
                  verifiedActionMaterialIconName:
                    verifiedAction1MaterialIconName,
                  actionMenuActions: action1MenuActions,
                  onActionPress: onAction1Press,
                },
              ] as const
            )
              .map(
                ({
                  key,
                  verifiedActionMaterialIconName,
                  actionMenuActions,
                  onActionPress,
                }) =>
                  !!verifiedActionMaterialIconName &&
                  (actionMenuActions ? (
                    <MenuView key={key} actions={actionMenuActions}>
                      <Appbar.Action
                        icon={verifiedActionMaterialIconName}
                        onPress={onActionPress}
                      />
                    </MenuView>
                  ) : (
                    <Appbar.Action
                      key={key}
                      icon={verifiedActionMaterialIconName}
                      onPress={onActionPress}
                    />
                  )),
              )
              .filter(a => !!a);
            return searchEnabled ? (
              <>
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchTextInput}
                  autoFocus={searchCanBeClosedAndroid}
                  placeholder={searchPlaceholder || 'Search'}
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
                          setSearchText('');
                          onSearchChangeText && onSearchChangeText('');
                        }}
                      />
                    )}
                    {actionButtons}
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

                {actionButtons}
              </>
            );
          })()}
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
              contentInsets: {
                // For TableView
                bottom:
                  tabBarInsets.scrollViewBottom * 2 - safeAreaInsets.bottom,
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
