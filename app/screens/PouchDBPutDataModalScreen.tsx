import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';

import useModalClosingHandler from '@app/hooks/useModalClosingHandler';

import db from '@app/db/pouchdb';
import ModalContent from '@app/components/ModalContent';
import InsetGroup from '@app/components/InsetGroup';

function PouchDBPutDataModalScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'PouchDBPutDataModal'>) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [id, setId] = useState(route.params?.id || '');
  const [idTouched, setIdTouched] = useState(false);
  const [dataJson, setDataJson] = useState(route.params.jsonData || '{}');

  const handleIdChangeText = useCallback(
    (t: string) => {
      setId(t);
      if (!hasUnsavedChanges) setHasUnsavedChanges(true);
    },
    [hasUnsavedChanges],
  );
  const handleDataJsonChangeText = useCallback(
    (t: string) => {
      setDataJson(t);
      if (!hasUnsavedChanges) setHasUnsavedChanges(true);
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
      if (isDone.current) {
        confirm();
        return;
      }

      if (loading) return;

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
    <ModalContent
      statusBarStyle={statusBarStyle}
      title="Put Data"
      action1Label="Put Data"
      action1Variant="strong"
      onAction1Press={
        isJsonInvalid || !id || loading ? undefined : handlePutData
      }
      action2Label="Cancel"
      onAction2Press={loading ? undefined : () => navigation.goBack()}
    >
      <ScrollView
        keyboardDismissMode="interactive"
        automaticallyAdjustsScrollIndicatorInsets
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.contentContainer}
      >
        <InsetGroup footerLabel={isJsonInvalid ? 'Invalid JSON' : undefined}>
          <InsetGroup.Item
            compactLabel
            label="ID"
            detail={
              <InsetGroup.TextInput
                alignRight
                returnKeyType="next"
                autoCapitalize="none"
                disabled={!!route.params?.id || loading}
                autoFocus={!route.params?.id}
                value={id}
                onChangeText={handleIdChangeText}
                onBlur={() => setIdTouched(true)}
                onSubmitEditing={() => dataInputRef.current?.focus()}
              />
            }
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item compactLabel label="Data (JSON)">
            <InsetGroup.TextInput
              multiline
              style={{ minHeight: 60 }}
              placeholder="{}"
              ref={dataInputRef}
              value={dataJson}
              onChangeText={handleDataJsonChangeText}
              disabled={loading}
              autoFocus={!!route.params?.id}
              autoCapitalize="none"
            />
          </InsetGroup.Item>
        </InsetGroup>
      </ScrollView>
    </ModalContent>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  contentContainer: { paddingTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  switchText: { marginRight: 8 },
  input: { marginBottom: 16 },
  button: { marginBottom: 16 },
});

export default PouchDBPutDataModalScreen;
