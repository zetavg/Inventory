import React, { useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import cs from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import InsetGroup from '@app/components/InsetGroup';
import ScreenContent from '@app/components/ScreenContent';

function CounterScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Counter'>) {
  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  const count = useAppSelector(selectors.counterValue);
  const dispatch = useAppDispatch();

  const [incrementAmount, setIncrementAmount] = useState('2');
  const incrementValue = Number(incrementAmount) || 0;

  return (
    <ScreenContent navigation={navigation} title="Counter">
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <InsetGroup style={cs.mt16}>
          <InsetGroup.Item label="Count" detail={count} />
        </InsetGroup>

        <InsetGroup>
          <InsetGroup.Item
            button
            label="Increase"
            onPress={() => dispatch(actions.increment())}
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            button
            label="Decrease"
            onPress={() => dispatch(actions.decrement())}
          />
        </InsetGroup>

        <InsetGroup>
          <InsetGroup.Item
            vertical2
            label="Increment Amount"
            detail={
              <InsetGroup.TextInput
                value={incrementAmount}
                onChangeText={setIncrementAmount}
                placeholder="0"
                keyboardType="numeric"
              />
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            button
            label="Increase By Amount"
            onPress={() => dispatch(actions.incrementByAmount(incrementValue))}
          />
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default CounterScreen;
