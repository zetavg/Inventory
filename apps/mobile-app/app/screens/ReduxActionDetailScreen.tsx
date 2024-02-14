import React, { useRef } from 'react';
import { ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { detailedDiff } from 'deep-object-diff';

import cs from '@app/utils/commonStyles';
import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import InsetGroup from '@app/components/InsetGroup';
import ScreenContent from '@app/components/ScreenContent';

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
            detailTextStyle={[commonStyles.devToolsMonospaced]}
          />
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            vertical2
            label="State Diff"
            detail={JSON.stringify(detailedDiff(prevState, nextState), null, 2)}
            detailTextStyle={[commonStyles.devToolsMonospaced]}
          />
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            vertical2
            label="Prev State"
            detail={JSON.stringify(prevState, null, 2)}
            detailTextStyle={commonStyles.devToolsMonospacedDetails}
          />
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            vertical2
            label="Next State"
            detail={JSON.stringify(nextState, null, 2)}
            detailTextStyle={commonStyles.devToolsMonospacedDetails}
          />
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default ReduxActionDetailScreen;
