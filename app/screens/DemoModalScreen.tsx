import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, StatusBar } from 'react-native';
import { Appbar, Text, Switch, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation';

import useModalClosingHandler from '@app/hooks/useModalClosingHandler';
import useIsDarkMode from '@app/hooks/useIsDarkMode';

import Button from '@app/components/Button';
import TextInput from '@app/components/TextInput';
import { BlurView } from '@react-native-community/blur';

function DemoModalScreen({
  navigation,
}: StackScreenProps<RootStackParamList, 'DemoModal'>) {
  const { colors } = useTheme();
  const isDarkMode = useIsDarkMode();
  const safeArea = useSafeAreaInsets();

  const [showAppbar, setShowAppbar] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { statusBarStyle } = useModalClosingHandler(
    navigation,
    hasUnsavedChanges,
  );

  return (
    <>
      <StatusBar barStyle={statusBarStyle} />
      {showAppbar && (
        <Appbar.Header elevated mode="center-aligned">
          {navigation.canGoBack() && (
            <Appbar.BackAction onPress={() => navigation.goBack()} />
          )}
          <Appbar.Content title="Demo Modal" />
        </Appbar.Header>
      )}
      <ScrollView
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingLeft: safeArea.left,
            paddingRight: safeArea.right,
          },
        ]}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: safeArea.bottom },
        ]}
      >
        <View style={styles.row}>
          <Text style={styles.switchText}>Show appbar</Text>
          <Switch
            value={showAppbar}
            onValueChange={() => setShowAppbar(v => !v)}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.switchText}>Has unsaved changes</Text>
          <Switch
            value={hasUnsavedChanges}
            onValueChange={() => setHasUnsavedChanges(v => !v)}
          />
        </View>
        <TextInput
          label="Sample input"
          mode="outlined"
          style={styles.input}
          placeholder="Type something"
        />
        <Button
          title="Close modal"
          style={styles.button}
          onPress={() => navigation.goBack()}
        />
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </Text>
      </ScrollView>
      <BlurView
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          right: 0,
          height: safeArea.bottom,
        }}
        blurType={isDarkMode ? 'dark' : 'light'}
        overlayColor="transparent"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  switchText: { marginRight: 8 },
  input: { marginBottom: 16 },
  button: { marginBottom: 16 },
});

export default DemoModalScreen;
