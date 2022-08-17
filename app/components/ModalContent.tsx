import React from 'react';
import { View, Platform, StatusBar } from 'react-native';
import { Appbar } from 'react-native-paper';
// import { BlurView } from '@react-native-community/blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';
// import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useColors from '@app/hooks/useColors';
import useModalClosingHandler, {
  defaultConfirmCloseFn,
} from '@app/hooks/useModalClosingHandler';
import verifyMaterialCommunityIconName from '@app/utils/verifyMaterialCommunityIconName';
import commonStyles from '@app/utils/commonStyles';
import AppBarIOS from './AppBarIOS';

type Props = {
  navigation: StackScreenProps<RootStackParamList>['navigation'];
  showAppBar?: boolean;
  showBackButton?: boolean;
  backButtonLabel?: string;
  preventClose?: boolean;
  confirmCloseFn?: typeof defaultConfirmCloseFn;
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
}: Props) {
  const safeAreaInsets = useSafeAreaInsets();
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
                top: showAppBar ? AppBarIOS.HEIGHT : 0,
                bottom: safeAreaInsets.bottom,
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
          left={(() => {
            if (action2Label) {
              return (
                onAction2Press && (
                  <AppBarIOS.Button
                    onPress={onAction2Press}
                    destructive={action2Variant === 'destructive'}
                    strong={action2Variant === 'strong'}
                  >
                    {action2Label}
                  </AppBarIOS.Button>
                )
              );
            }

            if (showBackButton) {
              return (
                navigation.canGoBack() && (
                  <AppBarIOS.Button onPress={() => navigation.goBack()}>
                    {backButtonLabel}
                  </AppBarIOS.Button>
                )
              );
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

export default ModalContent;
