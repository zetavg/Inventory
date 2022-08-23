import React, { useRef } from 'react';
import { ScrollView } from 'react-native';

import { diff } from 'deep-object-diff';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import cs from '@app/utils/commonStyles';

import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';

function ReduxActionDetailScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'ReduxActionDetail'>) {
  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  const { action, prevState, nextState } = route.params;

  return (
    <ScreenContent
      navigation={navigation}
      title={action?.type || JSON.stringify(action)}
    >
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <InsetGroup style={cs.mt16}>
          <InsetGroup.Item
            vertical2
            label="Action"
            detail={JSON.stringify(action, null, 2)}
          />
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            vertical2
            label="State Diff"
            detail={JSON.stringify(diff(prevState, nextState), null, 2)}
          />
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            vertical2
            label="Prev State"
            detail={JSON.stringify(prevState, null, 2)}
          />
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            vertical2
            label="Next State"
            detail={JSON.stringify(nextState, null, 2)}
          />
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default ReduxActionDetailScreen;