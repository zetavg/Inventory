import React from 'react';
import { Platform } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { Appbar as PaperAppbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Optional } from '@app/utils/types';

import { StackParamList } from '@app/navigation/MainStack';

type Props = {
  title?: string;
  navigation?: StackScreenProps<StackParamList>['navigation'];
} & Optional<React.ComponentProps<typeof PaperAppbar>, 'children'>;

function Appbar({ title, navigation, children, ...props }: Props) {
  const safeAreaInsets = useSafeAreaInsets();
  // iOS uses native Appbar
  if (Platform.OS === 'ios') {
    return null;
  }

  return (
    <PaperAppbar.Header
      elevated
      style={{
        paddingTop: safeAreaInsets.top,
        height: 56 + safeAreaInsets.top,
      }}
      {...props}
    >
      {navigation && navigation.canGoBack() && (
        <PaperAppbar.BackAction onPress={() => navigation.goBack()} />
      )}
      {title && <PaperAppbar.Content title={title} />}
      {children}
    </PaperAppbar.Header>
  );
}

Appbar.Action = PaperAppbar.Action;
Appbar.BackAction = PaperAppbar.BackAction;
Appbar.Content = PaperAppbar.Content;
Appbar.Header = PaperAppbar.Header;

export default Appbar;
