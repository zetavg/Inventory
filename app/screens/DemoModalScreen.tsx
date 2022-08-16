import React, { useRef, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Switch } from 'react-native-paper';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';

import useModalClosingHandler from '@app/hooks/useModalClosingHandler';
import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import Button from '@app/components/Button';
import TextInput from '@app/components/TextInput';
import ModalContent from '@app/components/ModalContent';

function DemoModalScreen({
  navigation,
}: StackScreenProps<RootStackParamList, 'DemoModal'>) {
  const [showAppbar, setShowAppbar] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { statusBarStyle } = useModalClosingHandler(
    navigation,
    hasUnsavedChanges,
  );

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  return (
    <ModalContent
      statusBarStyle={statusBarStyle}
      showAppBar={showAppbar}
      title="Demo Modal"
      action1Label="Save"
      action1Variant="strong"
      onAction1Press={() => navigation.goBack()}
      action2Label="Cancel"
      action2Variant={hasUnsavedChanges ? 'destructive' : 'normal'}
      onAction2Press={() => navigation.goBack()}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.contentContainer}
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
    </ModalContent>
  );
}

const styles = StyleSheet.create({
  contentContainer: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  switchText: { marginRight: 8 },
  input: { marginBottom: 16 },
  button: { marginBottom: 16 },
});

export default DemoModalScreen;
