import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import RNPickerSelect from 'react-native-picker-select';

import {
  DataTypeWithAdditionalInfo,
  useConfig,
  useData,
  useSave,
} from '@app/data';

import commonStyles from '@app/utils/commonStyles';
import randomInt from '@app/utils/randomInt';

import EPCUtils from '@app/modules/EPCUtils';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useAutoFocus from '@app/hooks/useAutoFocus';
import useColors from '@app/hooks/useColors';
import useDeepCompare from '@app/hooks/useDeepCompare';

import Icon, {
  verifyIconColor,
  verifyIconColorWithDefault,
  verifyIconName,
  verifyIconNameWithDefault,
} from '@app/components/Icon';
import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

import IconInputUIGroup from '../components/IconInputUIGroup';

function SaveItemScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'SaveItem'>) {
  const { initialData: initialDataFromParams } = route.params;

  const { save, saving } = useSave();
  const { config } = useConfig();
  const itemReferenceDigitsLimit = useMemo(
    () =>
      config
        ? EPCUtils.getItemReferenceDigitsLimit({
            companyPrefixDigits: config.rfid_tag_company_prefix.length,
            tagPrefixDigits: config.rfid_tag_prefix.length,
          })
        : 3,
    [config],
  );
  const defaultItemReferenceDigitsLimit = Math.min(
    itemReferenceDigitsLimit || 3,
    6,
  );

  const { contentTextColor, contentSecondaryTextColor } = useColors();

  const initialData = useMemo<Partial<DataTypeWithAdditionalInfo<'item'>>>(
    () => ({
      __type: 'item',
      icon_name: 'cube-outline',
      icon_color: 'gray',
      ...initialDataFromParams,
    }),
    [initialDataFromParams],
  );
  const [data, setData] =
    useState<Partial<DataTypeWithAdditionalInfo<'item'>>>(initialData);
  const hasChanges = !useDeepCompare(initialData, data);

  // const [selectedCollectionData, setSelectedCollectionData] = useState<
  //   null | string | { name: string; iconName: string; iconColor: string }
  // >(null);
  // const loadSelectedCollectionData = useCallback(async () => {
  //   if (!data.collection) return;

  //   try {
  //     const collectionDoc: any = await db.get(
  //       `collection-2-${data.collection}`,
  //     );
  //     const { data: d } = collectionDoc;
  //     if (typeof d !== 'object') throw new Error(`${d} is not an object`);
  //     setSelectedCollectionData(d);
  //   } catch (e) {
  //     setSelectedCollectionData(`Error: ${e}`);
  //   }
  // }, [data.collection, db]);
  // useEffect(() => {
  //   setSelectedCollectionData(null);
  //   loadSelectedCollectionData();
  // }, [loadSelectedCollectionData]);

  // const [selectedContainerData, setSelectedContainerData] =
  //   useState<
  //     | null
  //     | string
  //     | {
  //         name: string;
  //         iconName: string;
  //         iconColor: string;
  //         itemReferenceNumber?: string;
  //         isContainerType: string;
  //       }
  //   >(null);
  // const loadSelectedContainerData = useCallback(async () => {
  //   if (!data.container) return;

  //   try {
  //     const doc: any = await db.get(`item-2-${data.container}`);
  //     const { data: d } = doc;
  //     if (typeof d !== 'object') throw new Error(`${d} is not an object`);
  //     setSelectedContainerData(d);
  //   } catch (e) {
  //     setSelectedContainerData(`Error: ${e}`);
  //   }
  // }, [data.container, db]);
  // useEffect(() => {
  //   setSelectedContainerData(null);
  //   loadSelectedContainerData();
  // }, [loadSelectedContainerData]);

  const { data: selectedCollection } = useData(
    'collection',
    data.collection_id || '',
    {
      disable: !data.collection_id,
    },
  );
  const handleOpenSelectCollection = useCallback(() => {
    navigation.navigate('SelectCollection', {
      defaultValue: data.collection_id,
      callback: collection_id => {
        setData(d => ({ ...d, collection_id }));
      },
    });
  }, [data.collection_id, navigation]);

  const handleOpenSelectItemType = useCallback(() => {
    navigation.navigate('SelectItemType', {
      defaultValue: data.item_type,
      callback: item_type => {
        setData(d => ({ ...d, item_type }));
      },
    });
  }, [data.item_type, navigation]);

  const { data: selectedContainer } = useData('item', data.container_id || '', {
    disable: !data.container_id,
  });
  const handleOpenSelectContainer = useCallback(() => {
    navigation.navigate('SelectItem', {
      as: 'container',
      defaultValue: data.container_id,
      callback: container_id => {
        setData(d => ({ ...d, container_id }));
      },
    });
  }, [data.container_id, navigation]);

  const [
    referenceNumberIsRandomlyGenerated,
    setReferenceNumberIsRandomlyGenerated,
  ] = useState(false);
  const randomGenerateReferenceNumber = useCallback(() => {
    const number = randomInt(
      parseInt('1'.padEnd(defaultItemReferenceDigitsLimit, '0'), 10),
      parseInt('9'.repeat(defaultItemReferenceDigitsLimit), 10),
    );
    setData(d => ({ ...d, item_reference_number: number.toString() }));
    setReferenceNumberIsRandomlyGenerated(true);
  }, [defaultItemReferenceDigitsLimit]);
  const copyReferenceNumberFromContainer = useCallback(() => {
    // if (typeof selectedContainerData !== 'object') return;
    // const itemReferenceNumber =
    //   selectedContainerData?.itemReferenceNumber;
    // if (!itemReferenceNumber) return;
    // setData(d => ({ ...d, itemReferenceNumber }));
    // setReferenceNumberIsRandomlyGenerated(true);
  }, []);

  const handleOpenSelectIcon = useCallback(
    () =>
      navigation.navigate('SelectIcon', {
        defaultValue: verifyIconName(data.icon_name),
        callback: icon_name => {
          setData(d => ({ ...d, icon_name }));
        },
      }),
    [data.icon_name, navigation],
  );

  const isDone = useRef(false);
  const handleSave = useCallback(async () => {
    try {
      const d = await save(data);
      isDone.current = true;
      if (route.params.afterSave) {
        route.params.afterSave(d);
      }
      navigation.goBack();
    } catch (e: any) {}
  }, [data, navigation, route.params, save]);

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
  const { kiaTextInputProps } =
    ModalContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);
  const nameInputRef = useRef<TextInput>(null);
  const refNumberInputRef = useRef<TextInput>(null);
  const serialInputRef = useRef<TextInput>(null);
  useAutoFocus(nameInputRef, {
    scrollViewRef,
    disable: !!data.name,
  });

  const wouldBeHiddenInCollection =
    !!data.container_id &&
    (!selectedContainer ||
      selectedContainer.collection_id === data.collection_id);

  return (
    <ModalContent
      navigation={navigation}
      preventClose={hasChanges}
      confirmCloseFn={handleLeave}
      title={`${initialData.__id ? 'Edit' : 'New'} Item`}
      action1Label="Save"
      action1MaterialIconName="check"
      action1Variant="strong"
      onAction1Press={saving ? undefined : handleSave}
      action2Label="Cancel"
      onAction2Press={saving ? undefined : () => navigation.goBack()}
    >
      <ModalContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />
        <UIGroup>
          <UIGroup.ListTextInputItem
            ref={nameInputRef}
            label="Name"
            placeholder="Enter Name (Required)"
            autoCapitalize="words"
            returnKeyType="done"
            value={data.name}
            onChangeText={text => {
              setData(d => ({
                ...d,
                name: text,
              }));
            }}
            // eslint-disable-next-line react/no-unstable-nested-components
            rightElement={({ iconProps }) => (
              <TouchableOpacity onPress={handleOpenSelectIcon}>
                <Icon
                  name={verifyIconNameWithDefault(data.icon_name)}
                  color={verifyIconColorWithDefault(data.icon_color)}
                  {...iconProps}
                />
              </TouchableOpacity>
            )}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Collection"
            // eslint-disable-next-line react/no-unstable-nested-components
            inputElement={({ textProps, iconProps }) => (
              <TouchableOpacity
                style={commonStyles.flex1}
                onPress={handleOpenSelectCollection}
              >
                <View
                  style={[
                    commonStyles.flex1,
                    commonStyles.row,
                    commonStyles.alignItemsCenter,
                    { gap: 8, marginVertical: 4 },
                  ]}
                >
                  {/* eslint-disable-next-line react/no-unstable-nested-components */}
                  {(() => {
                    if (!data.collection_id) {
                      return (
                        <Text
                          {...textProps}
                          style={[textProps.style, commonStyles.opacity05]}
                        >
                          Select...
                        </Text>
                      );
                    } else if (
                      data.collection_id === selectedCollection?.__id
                    ) {
                      return (
                        <>
                          <Icon
                            {...iconProps}
                            name={verifyIconNameWithDefault(
                              selectedCollection.icon_name,
                            )}
                            color={verifyIconColorWithDefault(
                              selectedCollection.icon_color,
                            )}
                          />
                          <Text {...textProps}>
                            {typeof selectedCollection.name === 'string'
                              ? selectedCollection.name
                              : selectedCollection.__id}
                          </Text>
                        </>
                      );
                    } else {
                      return (
                        <Text
                          {...textProps}
                          style={[textProps.style, commonStyles.opacity05]}
                        >
                          Loading ({data.collection_id})...
                        </Text>
                      );
                    }
                  })()}
                </View>
              </TouchableOpacity>
            )}
            controlElement={
              <UIGroup.ListTextInputItem.Button
                onPress={handleOpenSelectCollection}
              >
                Select
              </UIGroup.ListTextInputItem.Button>
            }
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Item Type"
            horizontalLabel
            // eslint-disable-next-line react/no-unstable-nested-components
            inputElement={({ textProps, iconProps }) => (
              <TouchableOpacity
                style={commonStyles.flex1}
                onPress={handleOpenSelectItemType}
              >
                <View
                  style={[
                    commonStyles.flex1,
                    commonStyles.row,
                    commonStyles.alignItemsCenter,
                    commonStyles.justifyContentFlexEnd,
                  ]}
                >
                  {/*
                  <Icon
                    {...iconProps}
                    size={16}
                    showBackground={false}
                    color={contentSecondaryTextColor}
                    style={commonStyles.mr4}
                    name="box"
                  />
                  */}
                  <Text
                    {...textProps}
                    style={[
                      textProps.style,
                      commonStyles.tar,
                      commonStyles.alignItemsCenter,
                      commonStyles.flex0,
                    ]}
                  >
                    {(() => {
                      switch (data.item_type) {
                        case 'container':
                          return 'Container';
                        case 'generic_container':
                          return 'Generic Container';
                        case 'item_with_parts':
                          return 'Item with Parts';
                        default:
                          return 'Item';
                      }
                    })()}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            controlElement={
              <UIGroup.ListTextInputItem.Button
                onPress={handleOpenSelectItemType}
              >
                Select
              </UIGroup.ListTextInputItem.Button>
            }
            {...kiaTextInputProps}
          />
        </UIGroup>

        <UIGroup>
          <UIGroup.ListTextInputItem
            ref={refNumberInputRef}
            label="Reference No."
            horizontalLabel
            keyboardType="number-pad"
            monospaced
            readonly={!itemReferenceDigitsLimit}
            placeholder={'0'.repeat(defaultItemReferenceDigitsLimit)}
            maxLength={itemReferenceDigitsLimit}
            returnKeyType="done"
            clearButtonMode={
              referenceNumberIsRandomlyGenerated ? undefined : 'while-editing'
            }
            selectTextOnFocus={referenceNumberIsRandomlyGenerated}
            value={data.item_reference_number}
            onChangeText={t => {
              setData(d => ({
                ...d,
                item_reference_number: t,
              }));
              setReferenceNumberIsRandomlyGenerated(false);
            }}
            controlElement={
              (!data.item_reference_number ||
                referenceNumberIsRandomlyGenerated) && (
                <UIGroup.ListTextInputItem.Button
                  onPress={randomGenerateReferenceNumber}
                >
                  Generate
                </UIGroup.ListTextInputItem.Button>
              )
            }
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            ref={serialInputRef}
            label="Serial"
            horizontalLabel
            keyboardType="number-pad"
            monospaced
            placeholder={'0'.repeat(4)}
            maxLength={4}
            returnKeyType="done"
            clearButtonMode={
              referenceNumberIsRandomlyGenerated ? undefined : 'while-editing'
            }
            value={data.serial}
            onChangeText={t => {
              setData(d => ({
                ...d,
                serial: t,
              }));
            }}
            {...kiaTextInputProps}
          />
        </UIGroup>

        <UIGroup
          footer={
            wouldBeHiddenInCollection
              ? data.always_show_in_collection
                ? undefined
                : 'This item will be hidden in the collection since its container belongs to the same collection.'
              : undefined
          }
        >
          <UIGroup.ListTextInputItem
            label={(() => {
              switch (selectedContainer?.item_type) {
                case 'container':
                  return 'Content of';
                case 'item_with_parts':
                  return 'Part of';
                default:
                  return 'Container';
              }
            })()}
            // eslint-disable-next-line react/no-unstable-nested-components
            inputElement={({ textProps, iconProps }) => (
              <TouchableOpacity
                style={commonStyles.flex1}
                onPress={handleOpenSelectContainer}
              >
                <View
                  style={[
                    commonStyles.flex1,
                    commonStyles.row,
                    commonStyles.alignItemsCenter,
                    { gap: 8, marginVertical: 4 },
                  ]}
                >
                  {/* eslint-disable-next-line react/no-unstable-nested-components */}
                  {(() => {
                    if (!data.container_id) {
                      return (
                        <Text
                          {...textProps}
                          style={[textProps.style, commonStyles.opacity05]}
                        >
                          None
                        </Text>
                      );
                    } else if (data.container_id === selectedContainer?.__id) {
                      return (
                        <>
                          <Icon
                            {...iconProps}
                            name={verifyIconNameWithDefault(
                              selectedContainer.icon_name,
                            )}
                            color={verifyIconColorWithDefault(
                              selectedContainer.icon_color,
                            )}
                          />
                          <Text {...textProps}>
                            {typeof selectedContainer.name === 'string'
                              ? selectedContainer.name
                              : selectedContainer.__id}
                          </Text>
                        </>
                      );
                    } else {
                      return (
                        <Text
                          {...textProps}
                          style={[textProps.style, commonStyles.opacity05]}
                        >
                          Loading ({data.container_id})...
                        </Text>
                      );
                    }
                  })()}
                </View>
              </TouchableOpacity>
            )}
            controlElement={
              data.container_id ? (
                <UIGroup.ListTextInputItem.Button
                  onPress={() =>
                    setData(d => ({
                      ...d,
                      container_id: undefined,
                    }))
                  }
                >
                  Clear
                </UIGroup.ListTextInputItem.Button>
              ) : (
                <UIGroup.ListTextInputItem.Button
                  onPress={handleOpenSelectContainer}
                >
                  Select
                </UIGroup.ListTextInputItem.Button>
              )
            }
            {...kiaTextInputProps}
          />
          {wouldBeHiddenInCollection && (
            <>
              <UIGroup.ListItemSeparator />
              <UIGroup.ListTextInputItem
                label="Show in Collection"
                horizontalLabel
                inputElement={
                  <UIGroup.ListItem.Switch
                    value={data.always_show_in_collection}
                    onValueChange={v =>
                      setData(d => ({ ...d, always_show_in_collection: v }))
                    }
                  />
                }
              />
            </>
          )}
        </UIGroup>

        <IconInputUIGroup
          navigation={navigation}
          iconName={data.icon_name}
          iconColor={data.icon_color}
          onChangeIconName={n => {
            setData(d => ({
              ...d,
              icon_name: n,
            }));
          }}
          onChangeIconColor={c => {
            setData(d => ({
              ...d,
              icon_color: c,
            }));
          }}
        />
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

const styles = StyleSheet.create({
  affixCurrencyPickerSelect: {
    marginLeft: 8,
    marginBottom: 1,
    alignSelf: 'flex-end',
  },
});

export default SaveItemScreen;
