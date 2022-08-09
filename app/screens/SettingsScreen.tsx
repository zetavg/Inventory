import React from 'react';
import { StyleSheet, ScrollView, Platform } from 'react-native';
import { Appbar, List, Divider, Text, useTheme } from 'react-native-paper';
import Color from 'color';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import { useSetStorybookModeFunction } from '@app/StorybookUIRoot';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTabBarInsets from '@app/hooks/useTabBarInsets';
import useColor from '@app/hooks/useColor';

function SettingsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'DemoHome'>) {
  const rootNavigation = useRootNavigation();
  const setStorybookMode = useSetStorybookModeFunction();

  const { colors } = useTheme();
  const safeArea = useSafeAreaInsets();
  const tabBarInsets = useTabBarInsets();

  const { backgroundColor } = useColor();

  return (
    <>
      {Platform.OS !== 'ios' && (
        <Appbar.Header
          elevated
          mode="center-aligned"
          style={{ paddingTop: safeArea.top, height: 56 + safeArea.top }}
        >
          {navigation.canGoBack() && (
            <Appbar.BackAction onPress={() => navigation.goBack()} />
          )}
          <Appbar.Content title="Settings" />
        </Appbar.Header>
      )}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustsScrollIndicatorInsets
        style={[
          styles.container,
          {
            backgroundColor,
            paddingLeft: safeArea.left,
            paddingRight: safeArea.right,
          },
        ]}
        contentContainerStyle={{ paddingBottom: tabBarInsets.scrollViewBottom }}
        scrollIndicatorInsets={{ bottom: tabBarInsets.scrollViewBottom }}
      >
        <List.Section style={{ marginTop: 32 }}>
          <Divider />
          <List.Item
            title="Settings"
            onPress={() => navigation.push('Settings')}
            style={{
              backgroundColor: Color(colors.background).lighten(0.25).hex(),
            }}
          />
          <Divider />
          <List.Item
            title="Open demo modal"
            onPress={() => rootNavigation?.navigate('DemoModal')}
            style={{
              backgroundColor: Color(colors.background).lighten(0.25).hex(),
            }}
          />
          <Divider />
        </List.Section>

        <List.Section>
          <List.Subheader style={{ opacity: 0.5 }}>
            <Text variant="titleSmall">Developer Tools</Text>
          </List.Subheader>
          <Divider />
          <List.Item
            title="Storybook"
            onPress={() => navigation.push('Storybook')}
            style={{
              backgroundColor: Color(colors.background).lighten(0.25).hex(),
            }}
          />
          <Divider />
          <List.Item
            title="Enter Storybook mode"
            onPress={() => setStorybookMode && setStorybookMode(true)}
            style={{
              backgroundColor: Color(colors.background).lighten(0.25).hex(),
            }}
          />
          <Divider />
          <List.Item
            title="React Native New App Screen"
            onPress={() => navigation.push('NewAppScreen')}
            style={{
              backgroundColor: Color(colors.background).lighten(0.25).hex(),
            }}
          />
          <Divider />
        </List.Section>

        <List.Section>
          <List.Subheader style={{ opacity: 0.5 }}>
            <Text variant="titleSmall">Developer Tools</Text>
          </List.Subheader>
          <Divider />
          <List.Item
            title="Storybook"
            onPress={() => navigation.push('Storybook')}
            style={{
              backgroundColor: Color(colors.background).lighten(0.25).hex(),
            }}
          />
          <Divider />
          <List.Item
            title="Enter Storybook mode"
            onPress={() => setStorybookMode && setStorybookMode(true)}
            style={{
              backgroundColor: Color(colors.background).lighten(0.25).hex(),
            }}
          />
          <Divider />
          <List.Item
            title="React Native New App Screen"
            onPress={() => navigation.push('NewAppScreen')}
            style={{
              backgroundColor: Color(colors.background).lighten(0.25).hex(),
            }}
          />
          <Divider />
        </List.Section>

        <List.Section>
          <List.Subheader style={{ opacity: 0.5 }}>
            <Text variant="titleSmall">Developer Tools</Text>
          </List.Subheader>
          <Divider />
          <List.Item
            title="Storybook"
            onPress={() => navigation.push('Storybook')}
            style={{
              backgroundColor: Color(colors.background).lighten(0.25).hex(),
            }}
          />
          <Divider />
          <List.Item
            title="Enter Storybook mode"
            onPress={() => setStorybookMode && setStorybookMode(true)}
            style={{
              backgroundColor: Color(colors.background).lighten(0.25).hex(),
            }}
          />
          <Divider />
          <List.Item
            title="React Native New App Screen"
            onPress={() => navigation.push('NewAppScreen')}
            style={{
              backgroundColor: Color(colors.background).lighten(0.25).hex(),
            }}
          />
          <Divider />
        </List.Section>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SettingsScreen;
