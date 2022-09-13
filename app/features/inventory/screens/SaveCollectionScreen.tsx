import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, Alert, View } from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';

import Color from 'color';
import commonStyles from '@app/utils/commonStyles';
import useColors from '@app/hooks/useColors';
import ModalContent from '@app/components/ModalContent';
import InsetGroup from '@app/components/InsetGroup';
import ColorSelect, { ColorSelectColor } from '@app/components/ColorSelect';
import Icon, { IconColor, IconName } from '@app/components/Icon';

import useDB from '@app/hooks/useDB';
import { DataTypeWithID, save } from '@app/db/relationalUtils';

import randomInt from '@app/utils/randomInt';
import {
  applyWhitespaceFix,
  removeWhitespaceFix,
} from '@app/utils/text-input-whitespace-fix';

function SaveCollectionScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'SaveCollection'>) {
  const { initialData } = route.params;
  const { contentTextColor } = useColors();

  const { db } = useDB();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [data, setData] = useState<Partial<DataTypeWithID<'collection'>>>(
    initialData || { iconName: 'box', iconColor: 'gray' },
  );

  const [
    referenceNumberIsRandomlyGenerated,
    setReferenceNumberIsRandomlyGenerated,
  ] = useState(false);
  const randomGenerateReferenceNumber = useCallback(() => {
    const number = randomInt(1000, 9900);
    setData(d => ({ ...d, collectionReferenceNumber: number.toString() }));
    setReferenceNumberIsRandomlyGenerated(true);
  }, []);

  const [saving, setSaving] = useState(false);
  const isDone = useRef(false);
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await save(db, 'collection', data);
      isDone.current = true;
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Unknown error');
    } finally {
      setSaving(false);
    }
  }, [data, db, navigation]);

  const handleLeave = useCallback(
    (confirm: () => void) => {
      if (isDone.current) {
        confirm();
        return;
      }

      if (saving) return;

      Alert.alert(
        'Discard changes?',
        'The collection is not saved yet. Are you sure to discard the changes and leave?',
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
    [saving],
  );

  return (
    <ModalContent
      navigation={navigation}
      preventClose={hasUnsavedChanges}
      confirmCloseFn={handleLeave}
      title={`${data.id ? 'Edit' : 'New'} Collection`}
      action1Label="Save"
      action1MaterialIconName="check"
      action1Variant="strong"
      onAction1Press={handleSave}
      action2Label="Cancel"
      onAction2Press={saving ? undefined : () => navigation.goBack()}
    >
      <ScrollView
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <InsetGroup style={commonStyles.mt16}>
          <InsetGroup.Item
            compactLabel
            label="Name"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="Enter Name"
                autoCapitalize="words"
                returnKeyType="done"
                value={applyWhitespaceFix(data.name)}
                onChangeText={t => {
                  setData(d => ({
                    ...d,
                    name: removeWhitespaceFix(t),
                  }));
                  setHasUnsavedChanges(true);
                }}
              />
            }
          />
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            compactLabel
            label="Reference Number"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="0000"
                keyboardType="number-pad"
                maxLength={4}
                returnKeyType="done"
                value={data.collectionReferenceNumber}
                onChangeText={t => {
                  setData(d => ({
                    ...d,
                    collectionReferenceNumber: t,
                  }));
                  setReferenceNumberIsRandomlyGenerated(false);
                  setHasUnsavedChanges(true);
                }}
              />
            }
          />
          {(!data.collectionReferenceNumber ||
            referenceNumberIsRandomlyGenerated) && (
            <>
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item
                button
                label="Generate Random Number"
                onPress={randomGenerateReferenceNumber}
              />
            </>
          )}
        </InsetGroup>

        <InsetGroup>
          <InsetGroup.Item
            compactLabel
            label="Icon"
            detail={
              <InsetGroup.ItemDetailButton
                label="Select"
                onPress={() =>
                  navigation.navigate('SelectIcon', {
                    callback: iconName => setData(d => ({ ...d, iconName })),
                  })
                }
              />
            }
          >
            {data.iconName && (
              <View
                style={{
                  padding: 8,
                  borderRadius: 4,
                  backgroundColor: Color(contentTextColor).opaquer(-0.9).hexa(),
                }}
              >
                <Icon
                  name={data.iconName as IconName}
                  color={data.iconColor as IconColor}
                  size={20}
                />
              </View>
            )}
          </InsetGroup.Item>
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item compactLabel label="Icon Color">
            <ColorSelect
              value={data.iconColor as ColorSelectColor}
              onChange={c => {
                setData(d => ({
                  ...d,
                  iconColor: c,
                }));
                setHasUnsavedChanges(true);
              }}
            />
          </InsetGroup.Item>
        </InsetGroup>
      </ScrollView>
    </ModalContent>
  );
}

export default SaveCollectionScreen;
