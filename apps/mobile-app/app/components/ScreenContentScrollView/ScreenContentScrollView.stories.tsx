/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { Button, ScrollView, Text, TextInput, View } from 'react-native';
import { Alert } from 'react-native';

import ScreenContentScrollView from './ScreenContentScrollView';

export default {
  title: '[L] ScreenContentScrollView',
  component: ScreenContentScrollView,
  // args: {
  // },
  // parameters: {
  //   notes: '...',
  // },
};

export const Basic = ({
  ...args
}: React.ComponentProps<typeof ScreenContentScrollView>) => {
  return (
    <ScreenContentScrollView {...args}>
      {new Array(10).fill(null).map((_, i) => (
        <View key={i} style={{ padding: 8, gap: 8 }}>
          <TextInput placeholder="Sample Text Input" />
          <Button
            title="Sample Button"
            onPress={() => Alert.alert('Button Pressed')}
          />
          <Text>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
            culpa qui officia deserunt mollit anim id est laborum.
          </Text>
        </View>
      ))}
    </ScreenContentScrollView>
  );
};

function WithRefComponent(
  args: React.ComponentProps<typeof ScreenContentScrollView>,
) {
  const scrollViewRef = React.useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ScreenContentScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  return (
    <ScreenContentScrollView {...args} ref={scrollViewRef}>
      {new Array(10).fill(null).map((_, i) => (
        <View key={i} style={{ padding: 8, gap: 8 }}>
          <TextInput
            placeholder={`Sample Text Input ${i}`}
            {...kiaTextInputProps}
          />
          <Button
            title="Sample Button"
            onPress={() => Alert.alert('Button Pressed')}
          />
          <Button
            title="Scroll To End"
            onPress={() => scrollViewRef.current?.scrollToEnd()}
          />
          <Text>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
            culpa qui officia deserunt mollit anim id est laborum.
          </Text>
        </View>
      ))}
    </ScreenContentScrollView>
  );
}

export const WithRef = ({
  ...args
}: React.ComponentProps<typeof ScreenContentScrollView>) => {
  return <WithRefComponent {...args} />;
};
