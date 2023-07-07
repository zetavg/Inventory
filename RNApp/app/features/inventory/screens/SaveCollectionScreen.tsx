import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, View, TouchableOpacity, Alert } from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';

import commonStyles from '@app/utils/commonStyles';
import useColors from '@app/hooks/useColors';
import ModalContent from '@app/components/ModalContent';
import Text from '@app/components/Text';
import InsetGroup from '@app/components/InsetGroup';
import ColorSelect, { ColorSelectColor } from '@app/components/ColorSelect';
import Icon, { IconColor, IconName } from '@app/components/Icon';

import useDB from '@app/hooks/useDB';
import { DataTypeWithID, save } from '@app/db/old_relationalUtils';

import randomInt from '@app/utils/randomInt';
import {
  applyWhitespaceFix,
  removeWhitespaceFix,
} from '@app/utils/text-input-whitespace-fix';
import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

function SaveCollectionScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'SaveCollection'>) {
  const { initialData } = route.params;
  const { contentTextColor } = useColors();

  const { db } = useDB();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [data, setData] = useState<Partial<DataTypeWithID<'collection'>>>({
    iconName: 'box',
    iconColor: 'gray',
    itemDefaultIconName: 'cube-outline',
    ...initialData,
  });

  const [
    referenceNumberIsRandomlyGenerated,
    setReferenceNumberIsRandomlyGenerated,
  ] = useState(false);
  const randomGenerateReferenceNumber = useCallback(() => {
    const number = randomInt(1000, 9900);
    setData(d => ({ ...d, collectionReferenceNumber: number.toString() }));
    setReferenceNumberIsRandomlyGenerated(true);
  }, []);

  const handleOpenSelectIcon = useCallback(
    () =>
      navigation.navigate('SelectIcon', {
        defaultValue: data.iconName as IconName,
        callback: iconName => {
          setData(d => ({ ...d, iconName }));
          setHasUnsavedChanges(true);
        },
      }),
    [data.iconName, navigation],
  );

  const handleOpenSelectDefaultItemIcon = useCallback(
    () =>
      navigation.navigate('SelectIcon', {
        defaultValue: data.itemDefaultIconName as IconName,
        callback: iconName => {
          setData(d => ({ ...d, itemDefaultIconName: iconName }));
          setHasUnsavedChanges(true);
        },
      }),
    [data.itemDefaultIconName, navigation],
  );

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

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

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
        ref={scrollViewRef}
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
                onFocus={() => scrollViewRef?.current?.scrollTo({ y: -9999 })}
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
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            compactLabel
            label="Icon"
            detail={
              <TouchableOpacity onPress={handleOpenSelectIcon}>
                <Icon
                  name={data.iconName as IconName}
                  color={data.iconColor as IconColor}
                  showBackground
                  size={40}
                />
              </TouchableOpacity>
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            compactLabel
            label="Reference Number"
            detail={
              <>
                <InsetGroup.TextInput
                  alignRight
                  placeholder="0000"
                  keyboardType="number-pad"
                  maxLength={7}
                  returnKeyType="done"
                  style={commonStyles.monospaced}
                  // clearButtonMode="while-editing"
                  onFocus={() => scrollViewRef?.current?.scrollTo({ y: -9999 })}
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
                {(!data.collectionReferenceNumber ||
                  referenceNumberIsRandomlyGenerated) && (
                  <>
                    <InsetGroup.ItemDetailButton
                      style={commonStyles.ml4}
                      label="Generate"
                      onPress={randomGenerateReferenceNumber}
                    />
                  </>
                )}
              </>
            }
          />
          {/*{(!data.collectionReferenceNumber ||
            referenceNumberIsRandomlyGenerated) && (
            <>
              <InsetGroup.ItemSeparator />
              <InsetGroup.Item
                button
                label="Generate Random Number"
                onPress={randomGenerateReferenceNumber}
              />
            </>
          )}*/}
        </InsetGroup>

        <InsetGroup>
          <InsetGroup.Item
            compactLabel
            label="Icon"
            detail={
              <InsetGroup.ItemDetailButton
                label="Select"
                onPress={handleOpenSelectIcon}
              />
            }
          >
            <TouchableOpacity
              style={commonStyles.flex1}
              onPress={handleOpenSelectIcon}
            >
              {data.iconName && (
                <View style={[commonStyles.row, commonStyles.alignItemsCenter]}>
                  <Icon
                    name={data.iconName as IconName}
                    color={data.iconColor as IconColor}
                    showBackground
                    size={40}
                  />
                  <Text style={[commonStyles.ml12, commonStyles.opacity05]}>
                    {data.iconName}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </InsetGroup.Item>
          <InsetGroup.ItemSeparator />
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

        <InsetGroup>
          <InsetGroup.Item
            compactLabel
            label="Default Icon for Items"
            detail={
              <InsetGroup.ItemDetailButton
                label="Select"
                onPress={handleOpenSelectDefaultItemIcon}
              />
            }
          >
            <TouchableOpacity
              style={commonStyles.flex1}
              onPress={handleOpenSelectDefaultItemIcon}
            >
              {data.itemDefaultIconName && (
                <View style={[commonStyles.row, commonStyles.alignItemsCenter]}>
                  <Icon
                    name={data.itemDefaultIconName as IconName}
                    showBackground
                    size={40}
                  />
                  <Text style={[commonStyles.ml12, commonStyles.opacity05]}>
                    {data.itemDefaultIconName}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </InsetGroup.Item>
        </InsetGroup>
      </ScrollView>
    </ModalContent>
  );
}

export default SaveCollectionScreen;
