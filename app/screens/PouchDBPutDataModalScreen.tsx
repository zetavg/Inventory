import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';

import useDB from '@app/hooks/useDB';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';

import ModalContent from '@app/components/ModalContent';
import InsetGroup from '@app/components/InsetGroup';
import commonStyles from '@app/utils/commonStyles';

function PouchDBPutDataModalScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'PouchDBPutDataModal'>) {
  const { db } = useDB();
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

  const handleAddField = useCallback(() => {
    try {
      const json = JSON.parse(dataJson);
      setDataJson(JSON.stringify({ ...json, _: '' }, null, 2));
    } catch (e: any) {
      Alert.alert(e.message);
    }
  }, [dataJson]);

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
  }, [dataJson, db, id, navigation]);

  const handleLeave = useCallback(
    (confirm: () => void) => {
      if (isDone.current) {
        confirm();
        return;
      }

      if (loading) return;

      Alert.alert(
        'Discard changes?',
        'The document is not saved yet. Are you sure to discard the changes and leave?',
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
  const dataInputRef = useRef<any>(null);

  return (
    <ModalContent
      navigation={navigation}
      preventClose={hasUnsavedChanges}
      confirmCloseFn={handleLeave}
      title="Put Data"
      action1Label="Put Data"
      action1MaterialIconName="check"
      action1Variant="strong"
      onAction1Press={
        isJsonInvalid || !id || loading ? undefined : handlePutData
      }
      action2Label="Cancel"
      onAction2Press={loading ? undefined : () => navigation.goBack()}
    >
      <ScrollView
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <InsetGroup
          style={commonStyles.mt16}
          footerLabel={isJsonInvalid ? 'Invalid JSON' : undefined}
        >
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
              style={styles.textBox}
              placeholder="{}"
              ref={dataInputRef}
              value={dataJson}
              onChangeText={handleDataJsonChangeText}
              disabled={loading}
              autoFocus={!!route.params?.id}
              autoCapitalize="none"
            />
          </InsetGroup.Item>
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            label="Add Field"
            button
            disabled={isJsonInvalid}
            onPress={handleAddField}
          />
        </InsetGroup>
      </ScrollView>
    </ModalContent>
  );
}

const styles = StyleSheet.create({
  textBox: { minHeight: 60 },
});

export default PouchDBPutDataModalScreen;
