import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';

import useDB from '@app/hooks/useDB';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';

import ModalContent from '@app/components/ModalContent';
import InsetGroup from '@app/components/InsetGroup';
import commonStyles from '@app/utils/commonStyles';

function RelationalPouchDBSaveScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'RelationalPouchDBSave'>) {
  const { type } = route.params;
  const { db } = useDB();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [dataJson, setDataJson] = useState(
    route.params.defaultContentJson || '{}',
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
  const handleSave = useCallback(async () => {
    setLoading(true);
    try {
      const doc = JSON.parse(dataJson);
      await db.rel.save(type, doc);

      isDone.current = true;
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [dataJson, db.rel, navigation, type]);

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
      title="Save Data"
      action1Label="Save"
      action1MaterialIconName="check"
      action1Variant="strong"
      onAction1Press={isJsonInvalid || loading ? undefined : handleSave}
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
          <InsetGroup.Item compactLabel label="Data (JSON)">
            <InsetGroup.TextInput
              multiline
              style={styles.textBox}
              placeholder="{}"
              ref={dataInputRef}
              value={dataJson}
              onChangeText={handleDataJsonChangeText}
              disabled={loading}
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

export default RelationalPouchDBSaveScreen;
