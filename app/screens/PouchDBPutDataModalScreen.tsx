import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View, ScrollView, StatusBar, Alert } from 'react-native';
import { Appbar, HelperText } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';

import useModalClosingHandler from '@app/hooks/useModalClosingHandler';
import useIsDarkMode from '@app/hooks/useIsDarkMode';

import Button from '@app/components/Button';
import TextInput from '@app/components/TextInput';
import useColors from '@app/hooks/useColors';
import commonStyles from '@app/utils/commonStyles';
import db from '@app/db/pouchdb';

function PouchDBPutDataModalScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'PouchDBPutDataModal'>) {
  const { backgroundColor } = useColors();
  const isDarkMode = useIsDarkMode();
  const safeArea = useSafeAreaInsets();

  const [showAppbar, setShowAppbar] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [id, setId] = useState(route.params?.id || '');
  const [idTouched, setIdTouched] = useState(false);
  const [dataJson, setDataJson] = useState(route.params.jsonData || '{}');

  const handleIdChangeText = useCallback(
    (t: string) => {
      setId(t);
      if (!hasUnsavedChanges) {
        setHasUnsavedChanges(true);
      }
    },
    [hasUnsavedChanges],
  );
  const handleDataJsonChangeText = useCallback(
    (t: string) => {
      setDataJson(t);
      if (!hasUnsavedChanges) {
        setHasUnsavedChanges(true);
      }
    },
    [hasUnsavedChanges],
  );
  let isJsonInvalid = false;
  try {
    JSON.parse(dataJson);
  } catch (e) {
    isJsonInvalid = true;
  }

  const [loading, setLoading] = useState(false);
  const isDone = useRef(false);
  const handlePutData = useCallback(async () => {
    setLoading(true);
    try {
      const doc = {
        _id: id,
        ...JSON.parse(dataJson),
      };
      await db.put(doc);

      isDone.current = true;
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [dataJson, id, navigation]);

  const handleLeave = useCallback(
    (confirm: () => void) => {
      if (isDone) {
        confirm();
        return;
      }

      if (loading) {
        return;
      }

      Alert.alert(
        'Discard data?',
        'You have unsaved data. Are you sure to discard them and leave?',
        [
          { text: "Don't leave", style: 'cancel', onPress: () => {} },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: confirm,
          },
        ],
      );
    },
    [loading],
  );
  const { statusBarStyle } = useModalClosingHandler(
    navigation,
    hasUnsavedChanges,
    handleLeave,
  );

  const dataInputRef = useRef<any>(null);

  return (
    <>
      <StatusBar barStyle={statusBarStyle} />
      {showAppbar && (
        <Appbar.Header elevated mode="center-aligned">
          {navigation.canGoBack() && (
            <Appbar.BackAction onPress={() => navigation.goBack()} />
          )}
          <Appbar.Content title="Put Data" />
        </Appbar.Header>
      )}
      <ScrollView
        style={[styles.container, { backgroundColor }]}
        keyboardDismissMode="interactive"
        // automaticallyAdjustKeyboardInsets
        automaticallyAdjustsScrollIndicatorInsets
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          label="ID"
          mode="outlined"
          style={styles.input}
          placeholder=""
          disabled={!!route.params?.id || loading}
          autoFocus={!route.params?.id}
          value={id}
          onChangeText={handleIdChangeText}
          onBlur={() => setIdTouched(true)}
          error={idTouched && !id}
          autoCapitalize="none"
          onSubmitEditing={() => dataInputRef.current?.focus()}
        />
        <TextInput
          ref={dataInputRef}
          label="Data (JSON)"
          mode="outlined"
          style={[styles.input, { minHeight: 120 }]}
          multiline
          placeholder="{}"
          value={dataJson}
          onChangeText={handleDataJsonChangeText}
          error={isJsonInvalid}
          disabled={loading}
          autoCapitalize="none"
        />
        <HelperText
          type="error"
          visible={isJsonInvalid}
          style={{ marginTop: -12, marginBottom: 4 }}
        >
          Invalid JSON
        </HelperText>
        <View style={commonStyles.row}>
          <Button
            title="Cancel"
            style={[styles.button, commonStyles.flex1]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          />
          <View style={commonStyles.w16} />
          <Button
            title="Put data"
            mode="contained"
            style={[styles.button, commonStyles.flex2]}
            onPress={handlePutData}
            disabled={isJsonInvalid || !id || loading}
            loading={loading}
          />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  contentContainer: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  switchText: { marginRight: 8 },
  input: { marginBottom: 16 },
  button: { marginBottom: 16 },
});

export default PouchDBPutDataModalScreen;
