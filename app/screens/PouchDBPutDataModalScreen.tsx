import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import commonStyles from '@app/utils/commonStyles';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useDB from '@app/hooks/useDB';

import InsetGroup from '@app/components/InsetGroup';
import ModalContent from '@app/components/ModalContent';
import ScreenContentScrollView from '@app/components/ScreenContentScrollView';

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
  const dataInputRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const idInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!route.params?.id) {
      const timer = setTimeout(() => {
        idInputRef.current?.focus();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [route]);

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
      <ScreenContentScrollView ref={scrollViewRef}>
        <View style={commonStyles.mt16} />
        <InsetGroup footerLabel={isJsonInvalid ? '⚠ Invalid JSON' : undefined}>
          <InsetGroup.Item
            label="ID"
            vertical2
            detail={
              <InsetGroup.TextInput
                ref={idInputRef}
                placeholder="Document ID"
                returnKeyType="next"
                autoCapitalize="none"
                style={[commonStyles.devToolsMonospaced]}
                disabled={!!route.params?.id || loading}
                value={id}
                onChangeText={handleIdChangeText}
                onBlur={() => setIdTouched(true)}
                onSubmitEditing={() => dataInputRef.current?.focus()}
                // onFocus={ScreenContentScrollView.stf(scrollViewRef, 0)}
              />
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item vertical2 label="Data (JSON)">
            <InsetGroup.TextInput
              multiline
              style={[commonStyles.devToolsMonospaced, styles.textBox]}
              placeholder="{}"
              ref={dataInputRef}
              value={dataJson}
              onChangeText={handleDataJsonChangeText}
              disabled={loading}
              autoFocus={!!route.params?.id}
              autoCapitalize="none"
            />
          </InsetGroup.Item>
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Add Field"
            button
            disabled={isJsonInvalid}
            onPress={handleAddField}
          />
        </InsetGroup>
      </ScreenContentScrollView>
    </ModalContent>
  );
}

const styles = StyleSheet.create({
  textBox: { minHeight: 60 },
});

export default PouchDBPutDataModalScreen;
