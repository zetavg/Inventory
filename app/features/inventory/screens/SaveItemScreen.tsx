import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Alert,
  TouchableOpacity,
  Switch,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';

import commonStyles from '@app/utils/commonStyles';
import useColors from '@app/hooks/useColors';
import ModalContent from '@app/components/ModalContent';
import Text from '@app/components/Text';
import InsetGroup from '@app/components/InsetGroup';
import ColorSelect, { ColorSelectColor } from '@app/components/ColorSelect';
import Icon, { IconColor, IconName } from '@app/components/Icon';

import { v4 as uuidv4 } from 'uuid';
import useDB from '@app/hooks/useDB';
import { DataTypeWithID, del, save } from '@app/db/relationalUtils';

import randomInt from '@app/utils/randomInt';
import {
  applyWhitespaceFix,
  removeWhitespaceFix,
} from '@app/utils/text-input-whitespace-fix';
import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

function SaveItemScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'SaveItem'>) {
  const { initialData } = route.params;
  const { contentTextColor } = useColors();

  const { db } = useDB();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [data, setData] = useState<Partial<DataTypeWithID<'item'>>>({
    iconName: 'cube-outline',
    iconColor: 'gray',
    ...initialData,
  });

  const [selectedCollectionData, setSelectedCollectionData] = useState<
    null | string | { name: string; iconName: string; iconColor: string }
  >(null);
  const loadSelectedCollectionData = useCallback(async () => {
    if (!data.collection) return;

    try {
      const collectionDoc: any = await db.get(
        `collection-2-${data.collection}`,
      );
      const { data: d } = collectionDoc;
      if (typeof d !== 'object') throw new Error(`${d} is not an object`);
      setSelectedCollectionData(d);
    } catch (e) {
      setSelectedCollectionData(`Error: ${e}`);
    }
  }, [data.collection, db]);
  useEffect(() => {
    setSelectedCollectionData(null);
    loadSelectedCollectionData();
  }, [loadSelectedCollectionData]);

  const [selectedDedicatedContainerData, setSelectedDedicatedContainerData] =
    useState<
      null | string | { name: string; iconName: string; iconColor: string }
    >(null);
  const loadSelectedDedicatedContainerData = useCallback(async () => {
    if (!data.dedicatedContainer) return;

    try {
      const doc: any = await db.get(`item-2-${data.dedicatedContainer}`);
      const { data: d } = doc;
      if (typeof d !== 'object') throw new Error(`${d} is not an object`);
      setSelectedDedicatedContainerData(d);
    } catch (e) {
      setSelectedDedicatedContainerData(`Error: ${e}`);
    }
  }, [data.dedicatedContainer, db]);
  useEffect(() => {
    setSelectedDedicatedContainerData(null);
    loadSelectedDedicatedContainerData();
  }, [loadSelectedDedicatedContainerData]);

  const handleOpenSelectCollection = useCallback(() => {
    navigation.navigate('SelectCollection', {
      defaultValue: data.collection,
      callback: collection => {
        setData(d => ({ ...d, collection }));
        setHasUnsavedChanges(true);
      },
    });
  }, [data.collection, navigation]);

  const handleOpenSelectDedicatedContainer = useCallback(() => {
    navigation.navigate('SelectContainer', {
      defaultValue: data.dedicatedContainer,
      callback: dedicatedContainer => {
        setData(d => ({ ...d, dedicatedContainer }));
        setHasUnsavedChanges(true);
      },
    });
  }, [data.dedicatedContainer, navigation]);

  const [
    referenceNumberIsRandomlyGenerated,
    setReferenceNumberIsRandomlyGenerated,
  ] = useState(false);
  const randomGenerateReferenceNumber = useCallback(() => {
    const number = randomInt(100000, 999999);
    setData(d => ({ ...d, itemReferenceNumber: number.toString() }));
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

  const [saving, setSaving] = useState(false);
  const isDone = useRef(false);
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (!data.id) data.id = uuidv4();
      await save(db, 'item', data);
      isDone.current = true;
      if (route.params.afterSave) {
        route.params.afterSave(data);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Unknown error');
    } finally {
      setSaving(false);
    }
  }, [data, db, navigation, route.params]);

  const handleLeave = useCallback(
    (confirm: () => void) => {
      if (isDone.current) {
        confirm();
        return;
      }

      if (saving) return;

      Alert.alert(
        'Discard changes?',
        'The item is not saved yet. Are you sure to discard the changes and leave?',
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
      title={`${data.id ? 'Edit' : 'New'} Item`}
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
                placeholder="Enter Name (Required)"
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
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            compactLabel
            label="Collection"
            detail={
              <InsetGroup.ItemDetailButton
                label="Select"
                onPress={handleOpenSelectCollection}
              />
            }
          >
            <TouchableOpacity
              style={commonStyles.flex1}
              onPress={handleOpenSelectCollection}
            >
              <View style={commonStyles.row}>
                {selectedCollectionData &&
                  typeof selectedCollectionData === 'object' && (
                    <Icon
                      showBackground
                      backgroundPadding={4}
                      size={InsetGroup.FONT_SIZE + 8}
                      name={selectedCollectionData.iconName as IconName}
                      color={selectedCollectionData.iconColor as IconColor}
                      style={commonStyles.mr8}
                    />
                  )}
                <Text
                  style={[
                    (!selectedCollectionData ||
                      typeof selectedCollectionData !== 'object') &&
                      commonStyles.opacity02,
                    { fontSize: InsetGroup.FONT_SIZE },
                  ]}
                >
                  {data.collection
                    ? selectedCollectionData
                      ? typeof selectedCollectionData === 'object'
                        ? selectedCollectionData.name
                        : selectedCollectionData
                      : 'Loading...'
                    : '(Required)'}
                </Text>
              </View>
            </TouchableOpacity>
          </InsetGroup.Item>
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            compactLabel
            label="This is a container"
            detail={
              <Switch
                value={data.isContainer}
                onChange={() =>
                  setData(d => ({
                    ...d,
                    isContainer: !d.isContainer,
                    isContainerType: d.isContainerType || 'container',
                  }))
                }
              />
            }
          />
          {data.isContainer && (
            <>
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item
                compactLabel
                label="Container Type"
                detail={
                  <RNPickerSelect
                    value={data.isContainerType}
                    onValueChange={v =>
                      setData(d => ({ ...d, isContainerType: v }))
                    }
                    placeholder={{}}
                    items={[
                      { label: 'Container', value: 'container' },
                      { label: 'Item With Parts', value: 'item-with-parts' },
                    ]}
                    useNativeAndroidPickerStyle={false}
                    textInputProps={
                      {
                        style: {
                          color: contentTextColor,
                          fontSize: InsetGroup.FONT_SIZE,
                        },
                      } as any
                    }
                  />
                }
              />
            </>
          )}
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            compactLabel
            label="Reference Number"
            detail={
              <>
                <InsetGroup.TextInput
                  alignRight
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={7}
                  returnKeyType="done"
                  style={commonStyles.monospaced}
                  // clearButtonMode="while-editing"
                  value={data.itemReferenceNumber}
                  onChangeText={t => {
                    setData(d => ({
                      ...d,
                      itemReferenceNumber: t,
                    }));
                    setReferenceNumberIsRandomlyGenerated(false);
                    setHasUnsavedChanges(true);
                  }}
                />
                {(!data.itemReferenceNumber ||
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
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            compactLabel
            label="Serial"
            detail={
              <>
                <InsetGroup.TextInput
                  alignRight
                  placeholder="1234"
                  keyboardType="number-pad"
                  maxLength={4}
                  returnKeyType="done"
                  style={commonStyles.monospaced}
                  // clearButtonMode="while-editing"
                  value={(data.serial || '').toString()}
                  onChangeText={t => {
                    setData(d => ({
                      ...d,
                      serial: t ? parseInt(t, 10) : undefined,
                    }));
                    setReferenceNumberIsRandomlyGenerated(false);
                    setHasUnsavedChanges(true);
                  }}
                />
              </>
            }
          />
          {/*{(!data.itemReferenceNumber ||
            referenceNumberIsRandomlyGenerated) && (
            <>
              <InsetGroup.ItemSeperator />
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
        <InsetGroup>
          <InsetGroup.Item
            compactLabel
            label="Dedicated Container"
            detail={
              data.dedicatedContainer ? (
                <InsetGroup.ItemDetailButton
                  label="Remove"
                  destructive
                  onPress={() =>
                    setData(d => ({ ...d, dedicatedContainer: undefined }))
                  }
                />
              ) : (
                <InsetGroup.ItemDetailButton
                  label="Select"
                  onPress={handleOpenSelectDedicatedContainer}
                />
              )
            }
          >
            <TouchableOpacity
              style={commonStyles.flex1}
              onPress={handleOpenSelectDedicatedContainer}
            >
              <View style={commonStyles.row}>
                {selectedDedicatedContainerData &&
                  typeof selectedDedicatedContainerData === 'object' && (
                    <Icon
                      showBackground
                      backgroundPadding={4}
                      size={InsetGroup.FONT_SIZE + 8}
                      name={selectedDedicatedContainerData.iconName as IconName}
                      color={
                        selectedDedicatedContainerData.iconColor as IconColor
                      }
                      style={commonStyles.mr8}
                    />
                  )}
                <Text
                  style={[
                    (!selectedDedicatedContainerData ||
                      typeof selectedDedicatedContainerData !== 'object') &&
                      commonStyles.opacity02,
                    { fontSize: InsetGroup.FONT_SIZE },
                  ]}
                >
                  {data.dedicatedContainer
                    ? selectedDedicatedContainerData
                      ? typeof selectedDedicatedContainerData === 'object'
                        ? selectedDedicatedContainerData.name
                        : selectedDedicatedContainerData
                      : 'Loading...'
                    : 'No Dedicated Container'}
                </Text>
              </View>
            </TouchableOpacity>
          </InsetGroup.Item>
          {data.dedicatedContainer && (
            <>
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item
                compactLabel
                label="Always show individually"
                detail={
                  <Switch
                    value={data.alwaysShowOutsideOfDedicatedContainer}
                    onChange={() =>
                      setData(d => ({
                        ...d,
                        alwaysShowOutsideOfDedicatedContainer:
                          !d.alwaysShowOutsideOfDedicatedContainer,
                      }))
                    }
                  />
                }
              />
            </>
          )}
        </InsetGroup>
        {initialData && initialData.id && (
          <InsetGroup>
            <InsetGroup.Item
              button
              destructive
              label={`Delete "${initialData.name}"`}
              onPress={() =>
                Alert.alert(
                  'Confirm',
                  `Are you sure you want to delete item ${initialData.name}?`,
                  [
                    { text: 'No', style: 'cancel', onPress: () => {} },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        if (!initialData.id) return;

                        try {
                          await del(db, 'item', initialData.id);
                          if (route.params.afterDelete)
                            route.params.afterDelete();
                          navigation.goBack();
                        } catch (e: any) {
                          Alert.alert(
                            `Can't delete ${initialData.name}`,
                            e.message,
                          );
                        }
                      },
                    },
                  ],
                )
              }
            />
          </InsetGroup>
        )}
      </ScrollView>
    </ModalContent>
  );
}

export default SaveItemScreen;
