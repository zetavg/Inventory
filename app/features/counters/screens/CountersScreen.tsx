import React, { useRef, useState } from 'react';
import { Alert, ScrollView } from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';

import { useAppSelector, useAppDispatch, selectors } from '@app/redux';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import cs from '@app/utils/commonStyles';

import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';

import { actions } from '../slice';

function CountersScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Counters'>) {
  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  const currentCounter = useAppSelector(selectors.currentCounter);
  const counterNames = useAppSelector(selectors.counterNames);
  const dispatch = useAppDispatch();

  const [inputCounterName, setInputCounterName] = useState('');

  return (
    <ScreenContent navigation={navigation} title="Counters">
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <InsetGroup style={cs.mt16}>
          {counterNames
            .map(name => (
              <InsetGroup.Item
                key={name}
                label={name}
                selected={name === currentCounter}
                onPress={() => dispatch(actions.setCurrentCounter(name))}
              />
            ))
            .flatMap((element, i) => [
              element,
              <InsetGroup.ItemSeparator key={i} />,
            ])
            .slice(0, -1)}
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            vertical2
            label="Counter Name"
            detail={
              <InsetGroup.TextInput
                value={inputCounterName}
                onChangeText={setInputCounterName}
                placeholder="Enter name..."
              />
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="New Counter"
            button
            onPress={() => {
              if (!inputCounterName) {
                Alert.alert('Please enter a name');
                return;
              }

              dispatch(actions.newCounter(inputCounterName));
            }}
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Delete Counter"
            button
            destructive
            onPress={() => {
              if (!inputCounterName) {
                Alert.alert('Please enter a name');
                return;
              }

              try {
                dispatch(actions.deleteCounter(inputCounterName));
              } catch (e: any) {
                Alert.alert('Error', e.message);
              }
            }}
          />
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default CountersScreen;
