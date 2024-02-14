import React from 'react';
import type { StackScreenProps } from '@react-navigation/stack';

import type { StackParamList } from '@app/navigation/MainStack';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

function NotImplementedScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'NotImplemented'>) {
  return (
    <ScreenContent
      navigation={navigation}
      title={route.params?.title || 'Not NotImplemented'}
    >
      <ScreenContent.ScrollView>
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        <UIGroup placeholder="This feature is not implemented yet." />
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default NotImplementedScreen;
