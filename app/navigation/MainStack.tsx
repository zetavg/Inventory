import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import {
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack';
import type { StackScreenProps } from '@react-navigation/stack';
import randomHex from '@app/utils/randomHex';
import BlackText from '@app/components/BlackText';

import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import StorybookUIRoot from '@app/StorybookUIRoot';

import NewAppScreen from '@app/screens/NewAppScreen';

type StackParamList = {
  Storybook: undefined;
  NewAppScreen: undefined;
  DemoHome: undefined;
  DemoDetails: { id: string };
};

const demoScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    marginBottom: 12,
  },
});

function StorybookScreen({}: StackScreenProps<StackParamList, 'Storybook'>) {
  return <StorybookUIRoot />;
}

function DemoHomeScreen({
  navigation,
}: StackScreenProps<StackParamList, 'DemoHome'>) {
  const rootNavigation = useRootNavigation();

  return (
    <View style={demoScreenStyles.container}>
      <BlackText style={demoScreenStyles.item}>Demo Home Screen</BlackText>
      <View style={demoScreenStyles.item} />
      <Button
        title="Go to Demo Details"
        onPress={() => navigation.push('DemoDetails', { id: randomHex() })}
      />
      <View style={demoScreenStyles.item} />
      <Button
        title="Go To Storybook"
        onPress={() => navigation.push('Storybook')}
      />
      <View style={demoScreenStyles.item} />
      <Button
        title="Go To NewAppScreen"
        onPress={() => navigation.push('NewAppScreen')}
      />
      <View style={demoScreenStyles.item} />
      <Button
        title="Open Demo Details Modal"
        onPress={() =>
          rootNavigation &&
          rootNavigation.push('DemoDetails', { id: randomHex() })
        }
      />
    </View>
  );
}

export function DemoDetailsScreen({
  navigation,
  route: { params },
}: StackScreenProps<StackParamList, 'DemoDetails'>) {
  const rootNavigation = useRootNavigation();

  return (
    <View style={demoScreenStyles.container}>
      <BlackText style={demoScreenStyles.item}>Demo Details Screen</BlackText>
      <BlackText style={demoScreenStyles.item}>
        Params: {JSON.stringify(params, null, 2)}
      </BlackText>
      <View style={demoScreenStyles.item} />
      <Button
        title="Go to another Demo Details..."
        onPress={() => navigation.push('DemoDetails', { id: randomHex() })}
      />
      <View style={demoScreenStyles.item} />
      <Button title="Go back" onPress={() => navigation.goBack()} />
      <View style={demoScreenStyles.item} />
      <Button
        title="Open Demo Details Modal"
        onPress={() =>
          rootNavigation &&
          rootNavigation.push('DemoDetails', { id: randomHex() })
        }
      />
      <View style={demoScreenStyles.item} />
      <Button
        title="Go To Storybook"
        onPress={() => navigation.push('Storybook')}
      />
      <View style={demoScreenStyles.item} />
      <Button
        title="Go to Demo Home"
        onPress={() => navigation.navigate('DemoHome')}
      />
      <View style={demoScreenStyles.item} />
      <Button
        title="Go back to first screen in stack"
        onPress={() => navigation.popToTop()}
      />
    </View>
  );
}

const Stack = createStackNavigator();

type Props = {
  initialRouteName: keyof StackParamList;
};

const DEFAULT_SCREEN_OPTIONS = {
  gestureEnabled: true,
  ...TransitionPresets.SlideFromRightIOS,
};

function MainStack({ initialRouteName }: Props) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={DEFAULT_SCREEN_OPTIONS}
    >
      <Stack.Screen name="Storybook" component={StorybookScreen} />
      <Stack.Screen name="NewAppScreen" component={NewAppScreen} />
      <Stack.Screen name="DemoHome" component={DemoHomeScreen} />
      <Stack.Screen name="DemoDetails" component={DemoDetailsScreen} />
    </Stack.Navigator>
  );
}

export default MainStack;
