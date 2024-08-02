import React, { useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import cs from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';

import InsetGroup from '@app/components/InsetGroup';
import ScreenContent from '@app/components/ScreenContent';
import ScreenContentScrollView from '@app/components/ScreenContentScrollView';

function CounterScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Counter'>) {
  const scrollViewRef = useRef<ScrollView>(null);

  const count = useAppSelector(selectors.counter.counterValue);
  const dispatch = useAppDispatch();

  const [incrementAmount, setIncrementAmount] = useState('2');
  const incrementValue = Number(incrementAmount) || 0;

  return (
    <ScreenContent navigation={navigation} title="Counter">
      <ScreenContentScrollView ref={scrollViewRef}>
        <InsetGroup style={cs.mt16}>
          <InsetGroup.Item label="Count" detail={count} />
        </InsetGroup>

        <InsetGroup>
          <InsetGroup.Item
            button
            label="Increase"
            onPress={() => dispatch(actions.counter.increment())}
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            button
            label="Decrease"
            onPress={() => dispatch(actions.counter.decrement())}
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
            onPress={() =>
              dispatch(actions.counter.incrementByAmount(incrementValue))
            }
          />
        </InsetGroup>
      </ScreenContentScrollView>
    </ScreenContent>
  );
}

export default CounterScreen;
