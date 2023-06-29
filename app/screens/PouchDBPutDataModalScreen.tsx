import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, TextInput, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import commonStyles from '@app/utils/commonStyles';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useAutoFocus from '@app/hooks/useAutoFocus';
import useDB from '@app/hooks/useDB';

import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

function PouchDBPutDataModalScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'PouchDBPutDataModal'>) {
  const { db } = useDB();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [id, setId] = useState(route.params?.id || '');
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
      let newFieldName = 'newField';
      const newFieldKeys = Object.keys(json).filter(k =>
        k.startsWith(newFieldName),
      );
      if (newFieldKeys.length > 0) {
        const maxNewFieldI = Math.max(
          ...newFieldKeys
            .map(k => {
              const match = k.match(/^newField([0-9]+)?/);
              if (!match) return '';
              return match[1];
            })
            .map(s => {
              const n = parseInt(s, 10);
              if (isNaN(n)) return 0;
              return n;
            }),
        );
        newFieldName = `newField${maxNewFieldI + 1}`;
      }
      setDataJson(
        JSON.stringify({ ...json, [newFieldName]: 'value' }, null, 2),
      );
    } catch (e: any) {
      Alert.alert(e.message);
    }
  }, [dataJson]);

  const [loading, setLoading] = useState(false);
  const isDone = useRef(false);
  const handlePutData = useCallback(async () => {
    if (!db) {
      Alert.alert('Error', 'DB is not ready yet.');
      return;
    }
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
  const scrollViewRef = useRef<ScrollView>(null);
  const idInputRef = useRef<TextInput>(null);
  const dataInputRef = useRef<TextInput>(null);

  const { kiaTextInputProps } =
    ModalContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);
  useAutoFocus(idInputRef, { scrollViewRef, disable: !!route.params?.id });

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
      <ModalContent.ScrollView ref={scrollViewRef}>
        <View style={commonStyles.mt16} />
        <UIGroup footer={isJsonInvalid ? '⚠ Invalid JSON' : undefined}>
          <UIGroup.ListTextInputItem
            label="ID"
            monospaced
            small
            ref={idInputRef}
            placeholder="Document ID"
            returnKeyType="next"
            autoCapitalize="none"
            disabled={!!route.params?.id || loading}
            value={id}
            onChangeText={handleIdChangeText}
            onSubmitEditing={() => dataInputRef.current?.focus()}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Data (JSON)"
            multiline
            monospaced
            small
            placeholder="{}"
            ref={dataInputRef}
            value={dataJson}
            onChangeText={handleDataJsonChangeText}
            disabled={loading}
            autoCapitalize="none"
            // {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Add Field"
            button
            disabled={isJsonInvalid}
            onPress={handleAddField}
          />
        </UIGroup>
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default PouchDBPutDataModalScreen;
