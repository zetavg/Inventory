import React, { useRef, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import cs from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import InsetGroup from '@app/components/InsetGroup';
import ScreenContent from '@app/components/ScreenContent';

function CountersScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Counters'>) {
  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  const currentCounter = useAppSelector(selectors.counters.currentCounter);
  const counterNames = useAppSelector(selectors.counters.counterNames);
  const dispatch = useAppDispatch();

  const [inputCounterName, setInputCounterName] = useState('');

  const [counterNamesGroupHeight, setCounterNamesGroupHeight] = useState(0);

  return (
    <ScreenContent navigation={navigation} title="Counters">
      <ScreenContent.ScrollView ref={scrollViewRef}>
        <InsetGroup
          onLayout={event =>
            setCounterNamesGroupHeight(event.nativeEvent.layout.height)
          }
          style={cs.mt16}
        >
          {counterNames
            .map(name => (
              <InsetGroup.Item
                key={`${name}-item`}
                label={name}
                selected={name === currentCounter}
                onPress={() =>
                  dispatch(actions.counters.setCurrentCounter(name))
                }
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
                {...kiaTextInputProps}
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

              dispatch(actions.counters.newCounter(inputCounterName));
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
                dispatch(actions.counters.deleteCounter(inputCounterName));
              } catch (e: any) {
                Alert.alert('Error', e.message);
              }
            }}
          />
        </InsetGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default CountersScreen;
