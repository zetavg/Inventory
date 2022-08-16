import React from 'react';
import { View, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useColors from '@app/hooks/useColors';
import commonStyles from '@app/utils/commonStyles';
import AppBarIOS from './AppBarIOS';

type Props = {
  statusBarStyle: React.ComponentProps<typeof StatusBar>['barStyle'];
  showAppBar?: boolean;
  title: string;
  children: JSX.Element;
  action1Label?: string;
  action2Label?: string;
  onAction1Press?: () => void;
  action1Variant?: 'normal' | 'strong' | 'destructive';
  onAction2Press?: () => void;
  action2Variant?: 'normal' | 'strong' | 'destructive';
  footer?: React.ReactNode;
};

function ModalContent({
  statusBarStyle,
  showAppBar = true,
  title,
  children,
  action1Label,
  action2Label,
  onAction1Press,
  action1Variant,
  onAction2Press,
  action2Variant,
  footer,
}: Props) {
  const safeAreaInsets = useSafeAreaInsets();
  const { backgroundColor } = useColors();

  return (
    <View style={commonStyles.flex1}>
      <StatusBar barStyle={statusBarStyle} />
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
                bottom: safeAreaInsets.bottom,
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
          left={
            action2Label && onAction2Press ? (
              <AppBarIOS.Button
                onPress={onAction2Press}
                destructive={action2Variant === 'destructive'}
                strong={action2Variant === 'strong'}
              >
                {action2Label}
              </AppBarIOS.Button>
            ) : undefined
          }
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
    </View>
  );
}

export default ModalContent;
