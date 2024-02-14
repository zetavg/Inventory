import React, { useEffect } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { Appbar } from 'react-native-paper';
// import { BlurView } from '@react-native-community/blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import commonStyles from '@app/utils/commonStyles';
import verifyMaterialCommunityIconName from '@app/utils/verifyMaterialCommunityIconName';

import type { RootStackParamList } from '@app/navigation/Navigation';

// import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useColors from '@app/hooks/useColors';
import useModalClosingHandler, {
  defaultConfirmCloseFn,
} from '@app/hooks/useModalClosingHandler';

import AppBarIOS from './AppBarIOS';
import ModalContentScrollView from './ModalContentScrollView';

export type ConfirmCloseFn = typeof defaultConfirmCloseFn;

type Props = {
  navigation: StackScreenProps<RootStackParamList>['navigation'];
  showAppBar?: boolean;
  showBackButton?: boolean;
  backButtonLabel?: string;
  preventClose?: boolean;
  confirmCloseFn?: ConfirmCloseFn;
  title: string;
  children: JSX.Element;
  action1Label?: string;
  action2Label?: string;
  /** See: https://materialdesignicons.com */
  action1MaterialIconName?: string;
  /** See: https://materialdesignicons.com */
  action2MaterialIconName?: string;
  onAction1Press?: () => void;
  action1Variant?: 'normal' | 'strong' | 'destructive';
  onAction2Press?: () => void;
  action2Variant?: 'normal' | 'strong' | 'destructive';
  footer?: React.ReactNode;
  disableSwipeToDismissInContent?: boolean;
};

function ModalContent({
  navigation,
  showAppBar = true,
  showBackButton = true,
  backButtonLabel = 'Back',
  preventClose = false,
  confirmCloseFn,
  title,
  children,
  action1Label,
  action2Label,
  action1MaterialIconName,
  action2MaterialIconName,
  onAction1Press,
  action1Variant,
  onAction2Press,
  action2Variant,
  footer,
  disableSwipeToDismissInContent,
}: Props) {
  const safeAreaInsets = useSafeAreaInsets();

  useEffect(() => {
    navigation.setOptions({
      cardStyle: styles.cardStyle,
      ...(disableSwipeToDismissInContent
        ? { gestureResponseDistance: safeAreaInsets.top + 50 }
        : {}),
    });
  }, [disableSwipeToDismissInContent, navigation, safeAreaInsets.top]);

  // const isDarkMode = useIsDarkMode();
  const { backgroundColor } = useColors();

  const { statusBarStyle } = useModalClosingHandler(
    navigation,
    preventClose,
    confirmCloseFn || defaultConfirmCloseFn,
  );

  const verifiedAction1MaterialIconName = verifyMaterialCommunityIconName(
    action1MaterialIconName,
  );
  const verifiedAction2MaterialIconName = verifyMaterialCommunityIconName(
    action2MaterialIconName,
  );

  return (
    <View style={commonStyles.flex1}>
      <StatusBar barStyle={statusBarStyle} />
      {Platform.OS !== 'ios' && showAppBar && (
        <Appbar.Header elevated>
          {showBackButton && navigation.canGoBack() && (
            <Appbar.BackAction onPress={() => navigation.goBack()} />
          )}
          <Appbar.Content title={title} />
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
              ...children.props,
              contentInset: {
                top:
                  (showAppBar ? AppBarIOS.HEIGHT : 0) +
                  (children.props.contentInset?.topA || 0),
                bottom: safeAreaInsets.bottom,
                ...children.props.contentInset,
                ...children.props.contentInsets,
              },
              scrollIndicatorInsets: {
                top: showAppBar ? AppBarIOS.HEIGHT : 0,
                bottom: safeAreaInsets.bottom,
                ...children.props.scrollIndicatorInsets,
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
              contentInset: {
                top: 0,
                bottom: safeAreaInsets.bottom + 8,
              },
              scrollIndicatorInsets: {
                top: 0,
                bottom: safeAreaInsets.bottom + 8,
              },
              style: [
                ...(Array.isArray(children.props.style)
                  ? children.props.style
                  : [children.props.style]),
                { backgroundColor },
              ],
            },
          }}
      {Platform.OS === 'ios' && showAppBar && (
        <AppBarIOS
          title={title}
          // eslint-disable-next-line react/no-unstable-nested-components
          left={(() => {
            if (action2Label) {
              return onAction2Press ? (
                <AppBarIOS.Button
                  onPress={onAction2Press}
                  destructive={action2Variant === 'destructive'}
                  strong={action2Variant === 'strong'}
                >
                  {action2Label}
                </AppBarIOS.Button>
              ) : undefined;
            }

            if (showBackButton) {
              return navigation.canGoBack() ? (
                <AppBarIOS.Button onPress={() => navigation.goBack()}>
                  {backButtonLabel}
                </AppBarIOS.Button>
              ) : undefined;
            }
          })()}
          right={
            action1Label && onAction1Press ? (
              <AppBarIOS.Button
                onPress={onAction1Press}
                destructive={action1Variant === 'destructive'}
                strong={action1Variant === 'strong'}
              >
                {action1Label}
              </AppBarIOS.Button>
            ) : undefined
          }
        />
      )}
      {footer}
      {/*{Platform.OS === 'android' && (
        <BlurView
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            right: 0,
            height: safeAreaInsets.bottom,
          }}
          blurType={isDarkMode ? 'dark' : 'light'}
          overlayColor="transparent"
        />
      )}*/}
    </View>
  );
}

ModalContent.ScrollView = ModalContentScrollView;

const styles = StyleSheet.create({
  cardStyle: {
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
});

export default ModalContent;
