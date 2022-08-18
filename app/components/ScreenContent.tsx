import React, { useLayoutEffect } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Appbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTabBarInsets from '@app/hooks/useTabBarInsets';
import { SFSymbol } from 'react-native-sfsymbols';
import { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import useColors from '@app/hooks/useColors';
import verifyMaterialCommunityIconName from '@app/utils/verifyMaterialCommunityIconName';
import commonStyles from '@app/utils/commonStyles';

type Props = {
  navigation: StackScreenProps<StackParamList>['navigation'];
  showAppBar?: boolean;

  title: string;
  children: JSX.Element;

  action1Label?: string;
  action1SFSymbolName?: string;
  action1MaterialIconName?: string;
  onAction1Press?: () => void;

  action2Label?: string;
  action2SFSymbolName?: string;
  action2MaterialIconName?: string;
  onAction2Press?: () => void;

  action3Label?: string;
  action3SFSymbolName?: string;
  action3MaterialIconName?: string;
  onAction3Press?: () => void;
};

function ScreenContent({
  navigation,
  showAppBar = true,
  title,
  children,
  action1Label,
  action1SFSymbolName,
  action1MaterialIconName,
  onAction1Press,
  action2Label,
  action2SFSymbolName,
  action2MaterialIconName,
  onAction2Press,
  action3Label,
  action3SFSymbolName,
  action3MaterialIconName,
  onAction3Press,
}: Props) {
  const safeAreaInsets = useSafeAreaInsets();
  const tabBarInsets = useTabBarInsets();
  const { backgroundColor, iosHeaderTintColor } = useColors();

  // iOS native navigation bar
  useLayoutEffect(() => {
    if (Platform.OS !== 'ios') return;

    if (!showAppBar) {
      navigation.setOptions({ headerShown: false });
      return;
    }

    navigation.setOptions({
      headerShown: true,
      title,
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
    action2Label,
    action2SFSymbolName,
    action3Label,
    action3SFSymbolName,
    iosHeaderTintColor,
    navigation,
    onAction1Press,
    onAction2Press,
    onAction3Press,
    showAppBar,
    title,
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
          {navigation.canGoBack() && (
            <Appbar.BackAction onPress={() => navigation.goBack()} />
          )}
          <Appbar.Content title={title} />
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
            },
          }}
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
});

export default ScreenContent;
