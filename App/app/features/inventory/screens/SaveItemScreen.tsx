import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import RNPickerSelect from 'react-native-picker-select';

import { ZodError } from 'zod';

import { DataMeta } from '@deps/data/types';
import EPCUtils from '@deps/epc-utils';

import { DEFAULT_LAYOUT_ANIMATION_CONFIG } from '@app/consts/animations';

import { selectors, useAppSelector } from '@app/redux';

import { DataTypeWithID, useConfig, useData, useSave } from '@app/data';

import commonStyles from '@app/utils/commonStyles';
import randomInt from '@app/utils/randomInt';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useAutoFocus from '@app/hooks/useAutoFocus';
import useColors from '@app/hooks/useColors';
import useDeepCompare from '@app/hooks/useDeepCompare';
import useLogger from '@app/hooks/useLogger';

import DatePicker from '@app/components/DatePicker';
import Icon, {
  verifyIconColor,
  verifyIconColorWithDefault,
  verifyIconName,
  verifyIconNameWithDefault,
} from '@app/components/Icon';
import ModalContent from '@app/components/ModalContent';
import { Link } from '@app/components/Text';
import UIGroup from '@app/components/UIGroup';

import IconInputUIGroup from '../components/IconInputUIGroup';
import PlusAndMinusButtons from '../components/PlusAndMinusButtons';

function SaveItemScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'SaveItem'>) {
  const logger = useLogger('SaveItemScreen');
  const { initialData: initialDataFromParams, afterDelete } = route.params;

  const uiShowDetailedInstructions = useAppSelector(
    selectors.settings.uiShowDetailedInstructions,
  );

  const { save, saving } = useSave();
  const { config } = useConfig();
  const collectionReferenceDigits = useMemo(
    () =>
      config
        ? EPCUtils.getCollectionReferenceDigits({
            companyPrefix: config.rfid_tag_company_prefix,
            iarPrefix: config.rfid_tag_individual_asset_reference_prefix,
          })
        : 3,
    [config],
  );
  const itemReferenceDigits = useMemo(
    () =>
      config
        ? EPCUtils.getItemReferenceDigits({
            companyPrefix: config.rfid_tag_company_prefix,
            iarPrefix: config.rfid_tag_individual_asset_reference_prefix,
          })
        : 3,
    [config],
  );

  const { contentTextColor, contentSecondaryTextColor } = useColors();

  const initialData = useMemo<
    DataMeta<'item'> & Partial<DataTypeWithID<'item'>>
  >(
    () => ({
      __type: 'item',
      icon_name: 'cube-outline',
      icon_color: 'gray',
      ...initialDataFromParams,
    }),
    [initialDataFromParams],
  );
  const [data, setData] = useState<
    DataMeta<'item'> & Partial<DataTypeWithID<'item'>>
  >(initialData);
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

  const handleOpenSelectPurchasePriceCurrency = useCallback(() => {
    navigation.navigate('SelectCurrency', {
      defaultValue: data.purchase_price_currency,
      callback: purchase_price_currency => {
        setData(d => ({ ...d, purchase_price_currency }));
      },
    });
  }, [data.purchase_price_currency, navigation]);

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
      parseInt('1'.padEnd(itemReferenceDigits, '0'), 10),
      parseInt('9'.repeat(itemReferenceDigits), 10),
    );
    setData(d => ({ ...d, item_reference_number: number.toString() }));
    setReferenceNumberIsRandomlyGenerated(true);
  }, [itemReferenceDigits]);
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

  // const handleOpenPurchaseDatePicker = useCallback(
  //   () =>
  //     navigation.navigate('DatePicker', {
  //       defaultValue: verifyIconName(data.icon_name),
  //       callback: icon_name => {
  //         setData(d => ({ ...d, icon_name }));
  //       },
  //     }),
  //   [data.icon_name, navigation],
  // );

  const isDone = useRef(false);
  const handleSave = useCallback(async () => {
    const savedData = await save(data);
    if (savedData) {
      isDone.current = true;
      if (route.params.afterSave) {
        route.params.afterSave(savedData);
      }
      navigation.goBack();
    }
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

  const [purchasePriceInputTailing, setPurchasePriceInputTailing] =
    useState('');

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

  const doDelete = useCallback(async () => {
    const deleted = await save({
      ...initialData,
      __deleted: true,
    });
    if (deleted) {
      navigation.goBack();
      if (typeof afterDelete === 'function') {
        afterDelete();
      }
    }
  }, [afterDelete, initialData, navigation, save]);
  const handleDeleteButtonPressed = useCallback(() => {
    Alert.alert(
      'Confirmation',
      `Are you sure you want to delete the item "${initialData.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: doDelete,
        },
      ],
    );
  }, [doDelete, initialData.name]);

  const isFromSharedDb = !config
    ? null
    : !selectedCollection
    ? null
    : (typeof data.config_uuid === 'string' &&
        data.config_uuid !== config.uuid) ||
      (typeof selectedCollection.config_uuid === 'string' &&
        selectedCollection.config_uuid !== config.uuid);

  const selectContainerUI = (
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
                    style={[textProps.style, commonStyles.opacity02]}
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
          <UIGroup.ListTextInputItem.Button onPress={handleOpenSelectContainer}>
            Select
          </UIGroup.ListTextInputItem.Button>
        )
      }
      {...kiaTextInputProps}
    />
  );

  const iarPreview = useMemo(() => {
    if (!config) return null;
    if (typeof selectedCollection?.collection_reference_number !== 'string')
      return null;
    if (typeof data.item_reference_number !== 'string') return null;

    try {
      return EPCUtils.encodeIndividualAssetReference({
        companyPrefix: config.rfid_tag_company_prefix,
        iarPrefix: config.rfid_tag_individual_asset_reference_prefix,
        collectionReference: selectedCollection.collection_reference_number,
        itemReference: data.item_reference_number,
        serial: data.serial || 0,
      });
    } catch (e) {
      return null;
    }
  }, [
    config,
    data.item_reference_number,
    data.serial,
    selectedCollection?.collection_reference_number,
  ]);
  const epcTagUriPreview = useMemo(() => {
    if (!config) return null;
    if (!iarPreview) return null;

    try {
      return EPCUtils.encodeGiaiFromIndividualAssetReference({
        companyPrefix: config.rfid_tag_company_prefix,
        iarPrefix: config.rfid_tag_individual_asset_reference_prefix,
        individualAssetReference: iarPreview,
      });
    } catch (e) {
      return null;
    }
  }, [config, iarPreview]);
  const epcHexPreview = useMemo(() => {
    if (!epcTagUriPreview) return null;

    try {
      return EPCUtils.encodeEpcHexFromGiai(epcTagUriPreview);
    } catch (e) {
      return null;
    }
  }, [epcTagUriPreview]);

  const [showAdvanced, setShowAdvanced] = useState(
    data.individual_asset_reference_manually_set ||
      data.ignore_iar_prefix ||
      data.epc_tag_uri_manually_set ||
      data.rfid_tag_epc_memory_bank_contents_manually_set ||
      false,
  );

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
            multiline
            blurOnSubmit
            autoCapitalize="words"
            returnKeyType="done"
            value={data.name}
            onChangeText={text => {
              setData(d => ({
                ...d,
                name: text.replace(/[\r\n]+/g, ' '),
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
          {!!data.container_id && (
            <>
              <UIGroup.ListItemSeparator />
              {selectContainerUI}
            </>
          )}
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
                    {((): string => {
                      switch (data.item_type) {
                        case 'container':
                          return 'Container';
                        case 'generic_container':
                          return 'Generic Container';
                        case 'item_with_parts':
                          return 'Item with Parts';
                        case 'consumable':
                          return 'Consumable';
                        case undefined:
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

        {data.item_type === 'consumable' && (
          <UIGroup>
            <UIGroup.ListTextInputItem
              label="Stock Quantity"
              horizontalLabel
              keyboardType="number-pad"
              placeholder="1"
              returnKeyType="done"
              clearButtonMode="while-editing"
              selectTextOnFocus
              value={data.consumable_stock_quantity?.toString()}
              onChangeText={t => {
                const n = parseInt(t, 10);
                if (isNaN(n)) return;
                setData(d => ({
                  ...d,
                  consumable_stock_quantity: n,
                }));
              }}
              controlElement={
                <View style={commonStyles.ml8}>
                  <PlusAndMinusButtons
                    value={
                      typeof data.consumable_stock_quantity === 'number'
                        ? data.consumable_stock_quantity
                        : 1
                    }
                    onChangeValue={v =>
                      setData(d => ({
                        ...d,
                        consumable_stock_quantity: v,
                      }))
                    }
                  />
                </View>
              }
              {...kiaTextInputProps}
            />
            {data.consumable_stock_quantity === 0 && (
              <>
                <UIGroup.ListItemSeparator />
                <UIGroup.ListTextInputItem
                  label="Will Not Be Restocked"
                  horizontalLabel
                  inputElement={
                    <UIGroup.ListItem.Switch
                      value={data.consumable_will_not_restock}
                      onValueChange={v =>
                        setData(d => ({ ...d, consumable_will_not_restock: v }))
                      }
                    />
                  }
                  {...kiaTextInputProps}
                />
              </>
            )}
          </UIGroup>
        )}

        <UIGroup
          footer={(() => {
            if (isFromSharedDb) {
              return 'You can not edit the reference number of a shared item.';
            }

            if (data.individual_asset_reference_manually_set) {
              return "Note: This item has its Individual Asset Reference manually set. It won't be updated by the values here.";
            }

            if (data.epc_tag_uri_manually_set) {
              return "Note: This item has its EPC Tag URI manually set. It won't be updated by the values here.";
            }

            if (data.rfid_tag_epc_memory_bank_contents_manually_set) {
              return "Note: This item has its RFID Tag EPC manually set. It won't be updated by the values here.";
            }

            if (uiShowDetailedInstructions) {
              let message =
                'A reference number is needed for this item to have an RFID tag.';

              if (iarPreview) {
                message += ` The contents in the RFID tag will be "${iarPreview}".`;
              }

              return message;
            }

            return undefined;
          })()}
        >
          <UIGroup.ListTextInputItem
            ref={refNumberInputRef}
            label="Reference No."
            disabled={isFromSharedDb === null || isFromSharedDb}
            horizontalLabel
            keyboardType="number-pad"
            monospaced
            readonly={!itemReferenceDigits}
            placeholder={'0'.repeat(itemReferenceDigits)}
            maxLength={itemReferenceDigits}
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
            disabled={isFromSharedDb === null || isFromSharedDb}
            horizontalLabel
            keyboardType="number-pad"
            monospaced
            placeholder={'0'.repeat(4)}
            maxLength={4}
            returnKeyType="done"
            clearButtonMode={
              referenceNumberIsRandomlyGenerated ? undefined : 'while-editing'
            }
            value={(data.serial || '').toString()}
            onChangeText={t => {
              setData(d => ({
                ...d,
                serial: t ? parseInt(t, 10) : undefined,
              }));
            }}
            {...kiaTextInputProps}
          />
        </UIGroup>

        <UIGroup
          footer={(() => {
            if (uiShowDetailedInstructions && !data.container_id) {
              return 'Select a container to let this item be a part of another item, or to be stored fixedly in a certain container, such as a toolbox.';
            }

            return wouldBeHiddenInCollection
              ? data.always_show_in_collection
                ? undefined
                : 'This item will be hidden in the collection since its container belongs to the same collection.'
              : undefined;
          })()}
        >
          {selectContainerUI}
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

        <UIGroup>
          <UIGroup.ListTextInputItem
            label="Notes"
            placeholder="Enter Notes..."
            multiline
            autoCapitalize="sentences"
            value={data.notes}
            onChangeText={text => {
              setData(d => ({
                ...d,
                notes: text,
              }));
            }}
            {...kiaTextInputProps}
          />
        </UIGroup>

        <UIGroup>
          <UIGroup.ListTextInputItem
            label="Model Name"
            placeholder="Enter Model Name"
            autoCapitalize="words"
            returnKeyType="done"
            value={data.model_name}
            multiline
            blurOnSubmit
            onChangeText={text => {
              setData(d => ({
                ...d,
                model_name: text.replace(/[\r\n]+/g, ' '),
              }));
            }}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Purchase Price"
            horizontalLabel
            placeholder="000.00"
            keyboardType="numeric"
            returnKeyType="done"
            value={
              typeof data.purchase_price_x1000 === 'number'
                ? (() => {
                    const str = data.purchase_price_x1000.toString();
                    const a = str.slice(0, -3) || '0';
                    const b = str.slice(-3).padStart(3, '0').replace(/0+$/, '');
                    if (!b) {
                      return a;
                    }
                    return a + '.' + b;
                  })() + (purchasePriceInputTailing || '')
                : ''
            }
            onChangeText={t => {
              const [, tailing1] = t.match(/^[0-9]*(\.[0]*)$/) || [];
              const [tailing2] = (t.match(/\./) && t.match(/[0]*$/)) || [];
              setPurchasePriceInputTailing(tailing1 || tailing2 || '');
              setData(d => ({
                ...d,
                purchase_price_x1000: t
                  ? (() => {
                      try {
                        const [a0, b0] = t.split('.');
                        const a1 = a0 ? a0 : '0';
                        const b1 = b0 ? b0 : '0';
                        const b2 = b1.slice(0, 3);
                        const b3 = b2.padEnd(3, '0');
                        const number =
                          parseInt(a1, 10) * 1000 + parseInt(b3, 10);
                        if (isNaN(number)) return undefined;
                        return number;
                      } catch (e) {
                        return undefined;
                      }
                    })()
                  : undefined,
                ...(t
                  ? {
                      purchase_price_currency:
                        d.purchase_price_currency || 'USD',
                    }
                  : {}),
              }));
            }}
            unit={data.purchase_price_currency}
            onUnitPress={handleOpenSelectPurchasePriceCurrency}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Purchased From"
            placeholder="Enter Supplier Name"
            autoCapitalize="words"
            returnKeyType="done"
            value={data.purchased_from}
            onChangeText={text => {
              setData(d => ({
                ...d,
                purchased_from: text,
              }));
            }}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Purchase Date"
            horizontalLabel
            // eslint-disable-next-line react/no-unstable-nested-components
            inputElement={({ textProps }) => {
              const date =
                typeof data.purchase_date === 'number'
                  ? new Date(data.purchase_date)
                  : null;
              return (
                <UIGroup.ListItem.DatePicker
                  value={
                    date && {
                      y: date.getFullYear(),
                      m: date.getMonth() + 1,
                      d: date.getDate(),
                    }
                  }
                  textProps={textProps}
                  onChangeValue={v => {
                    if (!v) {
                      setData(d => ({
                        ...d,
                        purchase_date: undefined,
                      }));
                      return;
                    }

                    const d = new Date(v.y, v.m - 1, v.d);
                    d.setHours(0, 0, 0, 0);

                    setData(dta => ({
                      ...dta,
                      purchase_date: d.getTime(),
                    }));
                  }}
                  iosBlankDateWorkaround="tmr"
                />
              );
            }}
            controlElement={
              data.purchase_date ? (
                <UIGroup.ListTextInputItem.Button
                  onPress={() => {
                    setData(d => ({
                      ...d,
                      purchase_date: undefined,
                    }));
                  }}
                >
                  Clear
                </UIGroup.ListTextInputItem.Button>
              ) : undefined
            }
            {...kiaTextInputProps}
          />
        </UIGroup>
        <UIGroup>
          <UIGroup.ListTextInputItem
            label="Expiry Date"
            horizontalLabel
            // eslint-disable-next-line react/no-unstable-nested-components
            inputElement={({ textProps }) => {
              const date =
                typeof data.expiry_date === 'number'
                  ? new Date(data.expiry_date)
                  : null;
              return (
                <UIGroup.ListItem.DatePicker
                  value={
                    date && {
                      y: date.getFullYear(),
                      m: date.getMonth() + 1,
                      d: date.getDate(),
                    }
                  }
                  textProps={textProps}
                  onChangeValue={v => {
                    if (!v) {
                      setData(d => ({
                        ...d,
                        expiry_date: undefined,
                      }));
                      return;
                    }

                    const d = new Date(v.y, v.m - 1, v.d);
                    d.setHours(23, 59, 59, 59);

                    setData(dta => ({
                      ...dta,
                      expiry_date: d.getTime(),
                    }));
                  }}
                />
              );
            }}
            controlElement={
              data.expiry_date ? (
                <UIGroup.ListTextInputItem.Button
                  onPress={() => {
                    setData(d => ({
                      ...d,
                      expiry_date: undefined,
                    }));
                  }}
                >
                  Clear
                </UIGroup.ListTextInputItem.Button>
              ) : undefined
            }
            {...kiaTextInputProps}
          />
        </UIGroup>

        <UIGroup transparentBackground>
          <Text style={commonStyles.tac}>
            <Link
              onPress={() => {
                LayoutAnimation.configureNext(DEFAULT_LAYOUT_ANIMATION_CONFIG);
                setShowAdvanced(v => !v);
              }}
            >
              {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
            </Link>
          </Text>
        </UIGroup>

        {showAdvanced && (
          <>
            <UIGroup
              footer={
                uiShowDetailedInstructions
                  ? `By default, the Individual Asset Reference will be generated by connecting the collection reference number, the item reference number, and the item's serial${
                      iarPreview ? ` (in this case, it's "${iarPreview}")` : ''
                    }. But you can also manually set the Individual Asset Reference for this item.`
                  : undefined
              }
            >
              <UIGroup.ListTextInputItem
                label="Manually Set IAR"
                disabled={isFromSharedDb === null || isFromSharedDb}
                horizontalLabel
                inputElement={
                  <UIGroup.ListItem.Switch
                    value={data.individual_asset_reference_manually_set}
                    onValueChange={v => {
                      LayoutAnimation.configureNext(
                        DEFAULT_LAYOUT_ANIMATION_CONFIG,
                      );
                      setData(d => ({
                        ...d,
                        individual_asset_reference_manually_set: v,
                      }));
                    }}
                  />
                }
              />
              {!!data.individual_asset_reference_manually_set && (
                <>
                  <UIGroup.ListItemSeparator />
                  <UIGroup.ListTextInputItem
                    ref={refNumberInputRef}
                    label="Individual Asset Ref."
                    placeholder={
                      '0'.repeat(collectionReferenceDigits) +
                      '0'.repeat(itemReferenceDigits) +
                      '0000'
                    }
                    disabled={isFromSharedDb === null || isFromSharedDb}
                    horizontalLabel
                    keyboardType="number-pad"
                    maxLength={
                      collectionReferenceDigits + itemReferenceDigits + 4
                    }
                    monospaced
                    returnKeyType="done"
                    value={data.individual_asset_reference}
                    onChangeText={t => {
                      setData(d => ({
                        ...d,
                        individual_asset_reference: t,
                      }));
                    }}
                    {...kiaTextInputProps}
                  />
                </>
              )}
              <UIGroup.ListItemSeparator />
              <UIGroup.ListTextInputItem
                label="Ignore IAR Prefix"
                horizontalLabel
                inputElement={
                  <UIGroup.ListItem.Switch
                    value={data.ignore_iar_prefix}
                    disabled={isFromSharedDb === null || isFromSharedDb}
                    onValueChange={v => {
                      LayoutAnimation.configureNext(
                        DEFAULT_LAYOUT_ANIMATION_CONFIG,
                      );
                      setData(d => ({
                        ...d,
                        ignore_iar_prefix: v,
                      }));
                    }}
                  />
                }
              />
            </UIGroup>
            <UIGroup
              footer={
                uiShowDetailedInstructions
                  ? `By default, the RFID EPC Tag URI will be generated with the IAR, prefixed with your IAR prefix and Company Prefix${
                      epcTagUriPreview
                        ? ` (in this case, it's "${epcTagUriPreview}")`
                        : ''
                    }. But you can also manually set the EPC Tag URI for this item.\n\nThis may be useful if you want to track an item that has already be managed by another system that uses EPC Tag URIs.`
                  : undefined
              }
            >
              <UIGroup.ListTextInputItem
                label="Manually Set EPC Tag URI"
                horizontalLabel
                inputElement={
                  <UIGroup.ListItem.Switch
                    value={data.epc_tag_uri_manually_set}
                    disabled={isFromSharedDb === null || isFromSharedDb}
                    onValueChange={v => {
                      LayoutAnimation.configureNext(
                        DEFAULT_LAYOUT_ANIMATION_CONFIG,
                      );
                      setData(d => ({
                        ...d,
                        epc_tag_uri_manually_set: v,
                      }));
                    }}
                  />
                }
              />
              {!!data.epc_tag_uri_manually_set && (
                <>
                  <UIGroup.ListItemSeparator />
                  <UIGroup.ListTextInputItem
                    ref={refNumberInputRef}
                    label="EPC Tag URI"
                    placeholder="urn:epc:tag:giai-96:..."
                    disabled={isFromSharedDb === null || isFromSharedDb}
                    keyboardType="ascii-capable"
                    monospaced
                    multiline
                    returnKeyType="done"
                    value={data.epc_tag_uri}
                    onChangeText={t => {
                      setData(d => ({
                        ...d,
                        epc_tag_uri: t.replace(/[^0-9a-zA-Z.:_-]/gm, ''),
                      }));
                    }}
                    {...kiaTextInputProps}
                  />
                </>
              )}
            </UIGroup>
            <UIGroup
              footer={
                uiShowDetailedInstructions
                  ? `The EPC Hex is the actual value that will be written into the EPC bank of the RFID tag. By default, it's the hex-encoded EPC Tag URI${
                      epcTagUriPreview
                        ? ` (in this case, it's "${epcHexPreview}")`
                        : ''
                    }. But it can also be manually set to an arbitrary value.\n\nThis will be useful if you want to re-use an RFID tag with an EPC value written into it that cannot be changed.`
                  : undefined
              }
            >
              <UIGroup.ListTextInputItem
                label="Manually Set RFID Tag EPC Contents"
                horizontalLabel
                inputElement={
                  <UIGroup.ListItem.Switch
                    value={data.rfid_tag_epc_memory_bank_contents_manually_set}
                    disabled={isFromSharedDb === null || isFromSharedDb}
                    onValueChange={v => {
                      LayoutAnimation.configureNext(
                        DEFAULT_LAYOUT_ANIMATION_CONFIG,
                      );
                      setData(d => ({
                        ...d,
                        rfid_tag_epc_memory_bank_contents_manually_set: v,
                      }));
                    }}
                  />
                }
              />
              {!!data.rfid_tag_epc_memory_bank_contents_manually_set && (
                <>
                  <UIGroup.ListItemSeparator />
                  <UIGroup.ListTextInputItem
                    ref={refNumberInputRef}
                    label="RFID Tag EPC Contents"
                    placeholder="Enter EPC Hex here"
                    disabled={isFromSharedDb === null || isFromSharedDb}
                    keyboardType="ascii-capable"
                    autoCapitalize="characters"
                    monospaced
                    multiline
                    returnKeyType="done"
                    value={data.rfid_tag_epc_memory_bank_contents}
                    onChangeText={t => {
                      setData(d => ({
                        ...d,
                        rfid_tag_epc_memory_bank_contents: t
                          .toUpperCase()
                          .replace(/[^0-9A-F]/gm, ''),
                      }));
                    }}
                    {...kiaTextInputProps}
                  />
                </>
              )}
            </UIGroup>
          </>
        )}

        {!!initialData.__id && (
          <UIGroup>
            <UIGroup.ListItem
              button
              destructive
              label={`Delete "${initialData?.name}"`}
              onPress={handleDeleteButtonPressed}
            />
          </UIGroup>
        )}
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default SaveItemScreen;
