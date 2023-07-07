import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  View,
  Text as RNText,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { readRemoteFile, jsonToCSV } from 'react-native-csv';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';
import useActionSheet from '@app/hooks/useActionSheet';
import useColors from '@app/hooks/useColors';
import commonStyles from '@app/utils/commonStyles';
import ModalContent from '@app/components/ModalContent';
import InsetGroup from '@app/components/InsetGroup';
import Icon, { IconColor, IconName } from '@app/components/Icon';
import Text from '@app/components/Text';
import ColorSelect, { ColorSelectColor } from '@app/components/ColorSelect';

import useDB from '@app/hooks/useDB';
import schema from '@app/db/old_schema';
import { save, validate } from '@app/db/old_relationalUtils';

import camelToSnakeCase from '@app/utils/camelToSnakeCase';
import titleCase from '@app/utils/titleCase';

import ItemItem from '../components/ItemItem';

type AssertType<A, B extends A> = A | B;

/**
 * A fast way to ensure one will not forget to update here while adding new
 * properties to item.
 */
type KnownFields =
  | 'name'
  | 'collection'
  | 'iconName'
  | 'iconColor'
  | 'itemReferenceNumber'
  | 'serial'
  | 'individualAssetReference'
  | 'computedRfidTagEpcMemoryBankContents'
  | 'actualRfidTagEpcMemoryBankContents'
  | 'rfidTagAccessPassword'
  | 'createdAt'
  | 'updatedAt'
  | 'isContainer'
  | 'isContainerType'
  | 'alwaysShowOutsideOfDedicatedContainer'
  | 'computedShowInCollection'
  | 'notes'
  | 'modelName'
  | 'purchasePriceX1000'
  | 'purchasePriceCurrency'
  | 'purchasedFrom'
  | 'dedicatedContainer';
type assert1 = AssertType<
  KnownFields,
  | keyof typeof schema.item.dataSchema.properties
  | keyof typeof schema.item.dataSchema.optionalProperties
>;

let _itemProperties: null | ReadonlyArray<string> = null;
function getItemProperties() {
  if (_itemProperties) return _itemProperties;

  _itemProperties = [
    ...Object.keys(schema.item.dataSchema.properties),
    ...Object.keys(schema.item.dataSchema.optionalProperties),
  ];

  return _itemProperties;
}

let _availableItemProperties: null | ReadonlyArray<string> = null;
function getAvailableItemProperties() {
  if (_availableItemProperties) return _availableItemProperties;

  _availableItemProperties = getItemProperties().flatMap(propertyName => {
    // TODO: Support these?
    if (propertyName === 'iconName') return [];
    if (propertyName === 'iconColor') return [];
    if (propertyName === 'collection') return [];
    if (propertyName === 'dedicatedContainer') return [];

    if (propertyName.startsWith('computed')) return [];

    if (propertyName === 'individualAssetReference') return [];
    if (propertyName === 'actualRfidTagEpcMemoryBankContents') return [];
    if (propertyName === 'rfidTagAccessPassword') return [];

    if (propertyName === 'createdAt') return [];
    if (propertyName === 'updatedAt') return [];

    if (propertyName === 'isContainer') return [];
    if (propertyName === 'isContainerType') return [];
    if (propertyName === 'alwaysShowOutsideOfDedicatedContainer') return [];

    if (propertyName === 'purchasePriceX1000') return ['purchasePrice'];

    return [propertyName];
  });

  return _availableItemProperties;
}
let _itemPropertyNameMap: Record<string, string> | null = null;
export function getItemPropertyNameMap() {
  if (_itemPropertyNameMap) return _itemPropertyNameMap;

  _itemPropertyNameMap = Object.fromEntries(
    getAvailableItemProperties().map(p => {
      return [titleCase(camelToSnakeCase(p).replace(/_/gm, ' ')), p];
    }),
  );

  return _itemPropertyNameMap;
}

function ImportItemsFromCsvScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'ImportItemsFromCsv'>) {
  const { showActionSheetWithOptions } = useActionSheet();
  const { iosTintColor, green, red } = useColors();
  const { db } = useDB();
  const [defaultCollection, setDefaultCollection] = useState<null | string>(
    null,
  );
  const handleOpenSelectCollection = useCallback(() => {
    navigation.navigate('SelectCollection', {
      defaultValue: defaultCollection || undefined,
      callback: collection => {
        setDefaultCollection(collection);
      },
    });
  }, [defaultCollection, navigation]);
  const [selectedCollectionData, setSelectedCollectionData] = useState<
    null | string | { name: string; iconName: string; iconColor: string }
  >(null);
  const loadSelectedCollectionData = useCallback(async () => {
    if (!defaultCollection) return;

    try {
      const collectionDoc: any = await db.get(
        `collection-2-${defaultCollection}`,
      );
      const { data: d } = collectionDoc;
      if (typeof d !== 'object') throw new Error(`${d} is not an object`);
      setSelectedCollectionData(d);
    } catch (e) {
      setSelectedCollectionData(`Error: ${e}`);
    }
  }, [defaultCollection, db]);
  useEffect(() => {
    setSelectedCollectionData(null);
    loadSelectedCollectionData();
  }, [loadSelectedCollectionData]);

  const [defaultDedicatedContainer, setDefaultDedicatedContainer] = useState<
    null | string
  >(null);
  const handleOpenSelectDedicatedContainer = useCallback(() => {
    navigation.navigate('SelectContainer', {
      defaultValue: defaultDedicatedContainer || undefined,
      callback: dedicatedContainer => {
        setDefaultDedicatedContainer(dedicatedContainer);
      },
    });
  }, [defaultDedicatedContainer, navigation]);
  const [selectedDedicatedContainerData, setSelectedDedicatedContainerData] =
    useState<
      null | string | { name: string; iconName: string; iconColor: string }
    >(null);
  const loadSelectedDedicatedContainerData = useCallback(async () => {
    if (!defaultDedicatedContainer) return;

    try {
      const doc: any = await db.get(`item-2-${defaultDedicatedContainer}`);
      const { data: d } = doc;
      if (typeof d !== 'object') throw new Error(`${d} is not an object`);
      setSelectedDedicatedContainerData(d);
    } catch (e) {
      setSelectedDedicatedContainerData(`Error: ${e}`);
    }
  }, [defaultDedicatedContainer, db]);
  useEffect(() => {
    setSelectedDedicatedContainerData(null);
    loadSelectedDedicatedContainerData();
  }, [loadSelectedDedicatedContainerData]);

  const [defaultIconName, setDefaultIconName] =
    useState<string>('cube-outline');
  const [defaultIconColor, setDefaultIconColor] = useState<string>('gray');
  const handleOpenSelectIcon = useCallback(
    () =>
      navigation.navigate('SelectIcon', {
        defaultValue: defaultIconName as IconName,
        callback: iconName => {
          setDefaultIconName(iconName);
        },
      }),
    [defaultIconName, navigation],
  );

  const handleGetSampleCsv = useCallback(async () => {
    const availableItemPropertyNames = Object.keys(getItemPropertyNameMap());
    const data = Array.from(new Array(1)).map(() => ({
      // ID: uuidv4(),
      ...Object.fromEntries(availableItemPropertyNames.map(n => [n, ''])),
    }));
    const sampleCsv = jsonToCSV(data);
    const sampleFilePath = `${RNFS.TemporaryDirectoryPath}/Inventory Import Items Sample.csv`;
    await RNFS.writeFile(sampleFilePath, sampleCsv, 'utf8');

    Share.open({
      url: sampleFilePath,
      failOnCancel: false,
    });
  }, []);

  const [loading, setLoading] = useState(false);
  const [csvContents, setCsvContents] = useState<null | any>(null);
  const [loadedItems, setLoadedItems] = useState<Array<any> | null>(null);
  const handleSelectCsvFile = useCallback(async () => {
    setLoading(true);
    try {
      const { uri } = await DocumentPicker.pickSingle({
        type: DocumentPicker.types.csv,
      });
      readRemoteFile(uri, {
        header: true,
        complete: async (results: any) => {
          setCsvContents(results);
          // Will trigger loadItems via useEffect
        },
        error: () => {
          setLoading(false);
        },
      });
    } catch (e) {
      setLoading(false);
    }
  }, []);
  const loadItems = useCallback(async () => {
    if (!csvContents) return;

    setLoading(true);
    try {
      const itemPropertyNameMap = getItemPropertyNameMap();
      const itemsData = csvContents.data.map((result: any) => ({
        ...Object.fromEntries(
          Object.entries(result).flatMap(([k, v]) => {
            const key =
              k.toLowerCase() === 'id'
                ? 'id'
                : itemPropertyNameMap[k.replace(/[ \n\t]+/gm, ' ')];

            if (key === 'purchasePrice') {
              const [purchasePrice, purchasePriceM] = (v as string)
                .replace(/,/gm, '')
                .split('.');
              const purchasePriceX1000 =
                parseInt(purchasePrice, 10) * 1000 +
                parseInt((purchasePriceM || '').padEnd(3, '0').slice(0, 3), 10);
              if (isNaN(purchasePriceX1000)) return [];

              return [['purchasePriceX1000', purchasePriceX1000]];
            } else if (key === 'itemReferenceNumber' && v) {
              const itemReferenceNumber = (v as any).replace(/[^0-9]/gm, '');
              return [['itemReferenceNumber', itemReferenceNumber]];
            } else if (key === 'serial' && v) {
              const serial = parseInt(v as string, 10);
              return [['serial', serial]];
            }

            if (key && v) return [[key, v]];
            return [];
          }),
        ),
      }));
      const itemsWithError = await Promise.all(
        itemsData.map(async (itemData: any) => {
          try {
            let oldData;
            if (itemData.id) {
              try {
                const d = await db.get(`item-2-${itemData.id}`);

                if (d.type === 'item') {
                  oldData = d.data;
                  oldData.rev = d._rev;
                }
              } catch (e) {
                // TODO: Handle other errors other then 404
              }
            }

            if (!oldData) {
              itemData = {
                ...(defaultCollection ? { collection: defaultCollection } : {}),
                ...(defaultDedicatedContainer
                  ? { dedicatedContainer: defaultDedicatedContainer }
                  : {}),
                ...(defaultIconName ? { iconName: defaultIconName } : {}),
                ...(defaultIconColor ? { iconColor: defaultIconColor } : {}),
                ...itemData,
              };
            } else {
              itemData = {
                ...(oldData as any),
                ...itemData,
              };
            }
            await validate(db, 'item', itemData);
            return { itemData };
          } catch (e: any) {
            return { itemData, errorMessage: e.message };
          }
        }),
      );
      setLoadedItems(itemsWithError);
    } catch (e: any) {
      Alert.alert('Error', e.message);
      // TODO: Handle
    } finally {
      setLoading(false);
    }
  }, [
    csvContents,
    db,
    defaultCollection,
    defaultDedicatedContainer,
    defaultIconName,
    defaultIconColor,
  ]);
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleItemPress = useCallback(
    ({ itemData, errorMessage }: any) => {
      const options = {
        viewData: 'View Data',
        ...(errorMessage ? { viewError: 'View Error(s)' } : {}),
        cancel: 'Cancel',
      } as const;
      const optionKeys: ReadonlyArray<keyof typeof options> = Object.keys(
        options,
      ) as any;
      const cancelButtonIndex = optionKeys.length - 1;
      showActionSheetWithOptions(
        {
          options: Object.values(options),
          cancelButtonIndex,
        },
        buttonIndex => {
          if (typeof buttonIndex !== 'number') return;
          if (buttonIndex === cancelButtonIndex) {
            return;
          }

          const optionKey = optionKeys[buttonIndex];
          switch (optionKey) {
            case 'viewData': {
              Alert.alert(
                'Data',
                JSON.stringify(
                  Object.fromEntries(
                    Object.entries(itemData).filter(
                      ([k]) =>
                        getAvailableItemProperties().includes(k) ||
                        k.startsWith('purchasePrice') ||
                        k === 'id' ||
                        k === 'rev',
                    ),
                  ),
                  null,
                  2,
                ),
              );
              break;
            }
            case 'viewError': {
              Alert.alert('Error(s)', errorMessage);
              break;
            }
          }
        },
      );
    },
    [showActionSheetWithOptions],
  );

  const [working, setWorking] = useState(false);
  const isWorking = useRef(false);
  const handleImport = useCallback(async () => {
    if (!loadedItems) return;
    if (working) return;
    if (isWorking.current) return;

    isWorking.current = true;
    setWorking(true);
    let hasErrors = false;

    try {
      await Promise.all(
        loadedItems.map(async ({ errorMessage, itemData }) => {
          if (errorMessage) return;

          try {
            await save(db, 'item', itemData);
          } catch (e: any) {
            hasErrors = true;
            Alert.alert(`Error on saving ${itemData.name}`, e.message);
          }
        }),
      );

      Alert.alert(
        hasErrors ? 'Done with Errors' : 'Done',
        hasErrors
          ? 'Data import done with errors occurred'
          : 'Data import done.',
        [
          {
            text: 'Ok',
            onPress: () => {
              navigation.goBack();
            },
          },
        ],
      );
    } catch (e: any) {
      // TODO
      Alert.alert('Error', e.message);
    } finally {
      isWorking.current = false;
      setWorking(false);
    }
  }, [db, loadedItems, navigation, working]);

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  return (
    <ModalContent
      navigation={navigation}
      title="CSV Import"
      backButtonLabel="Cancel"
      action1Label="Import"
      onAction1Press={
        loadedItems && !loading && !working ? handleImport : undefined
      }
    >
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={commonStyles.mt32} />
        {!!loadedItems &&
          (() => {
            const ignoreItemsCount = loadedItems.filter(
              it => it.errorMessage,
            ).length;
            const createItemsCount = loadedItems.filter(
              it => !it.errorMessage && !it.itemData.rev,
            ).length;
            const updateItemsCount = loadedItems.filter(
              it => !it.errorMessage && it.itemData.rev,
            ).length;
            const importItemsCount = createItemsCount + updateItemsCount;

            return (
              <InsetGroup
                style={[
                  commonStyles.centerChildren,
                  commonStyles.pv24,
                  commonStyles.ph16,
                ]}
              >
                <Text style={[commonStyles.tac, commonStyles.mv4]}>
                  Ready to import {importItemsCount} item(s).
                </Text>
                {!!createItemsCount && (
                  <Text style={[commonStyles.tac, commonStyles.mv4]}>
                    {createItemsCount} item(s) will be created.
                  </Text>
                )}
                {!!updateItemsCount && (
                  <Text style={[commonStyles.tac, commonStyles.mv4]}>
                    <RNText style={{ color: green, fontSize: 10 + 3 }}>
                      ⓘ
                    </RNText>{' '}
                    {updateItemsCount} item(s) will be updated.
                  </Text>
                )}
                {!!ignoreItemsCount && (
                  <Text style={[commonStyles.centerChildren, commonStyles.tac]}>
                    {false && (
                      <RNText>
                        <Icon
                          name="app-exclamation"
                          color="yellow"
                          size={16}
                          style={commonStyles.mbm2}
                        />{' '}
                      </RNText>
                    )}
                    <RNText style={{ color: red }}>⚠</RNText> {ignoreItemsCount}{' '}
                    item(s) with error will be ignored.{' '}
                    <RNText
                      onPress={() => {
                        scrollViewRef?.current?.scrollTo({ y: 99999999 });
                      }}
                      style={{ color: iosTintColor }}
                    >
                      Setting default values
                    </RNText>{' '}
                    may resolve errors.
                  </Text>
                )}
                <Text style={[commonStyles.tac, commonStyles.mv4]}>
                  Press the "Import" button on the top right to perform the
                  import.
                </Text>
              </InsetGroup>
            );
          })()}
        <InsetGroup
          label="Items to Import"
          loading={working}
          footerLabel={
            <>
              {!loadedItems && (
                <>
                  Press "Select CSV File..." to open a CSV file.
                  <RNText> </RNText>
                  You can either start with a<RNText> </RNText>
                  <RNText
                    onPress={handleGetSampleCsv}
                    style={{ color: iosTintColor }}
                  >
                    template CSV file
                  </RNText>
                  , or{' '}
                  <RNText
                    onPress={() => {
                      navigation.push('ExportItemsToCsv');
                    }}
                    style={{ color: iosTintColor }}
                  >
                    export items to a CSV file
                  </RNText>
                  , edit it and import them back. Items with matching ID will be
                  updated.
                </>
              )}
              {loadedItems?.some(i => i.errorMessage) && (
                <>
                  <Icon
                    name="app-exclamation"
                    color="yellow"
                    size={16}
                    style={commonStyles.mbm2}
                  />
                  <RNText> </RNText>Items with errors will be ignored.
                  <RNText> </RNText>
                </>
              )}
              {loadedItems && !loading && (
                <>
                  Press "Import" on the top right to perform import.
                  <RNText> </RNText>
                </>
              )}
            </>
          }
        >
          <InsetGroup.Item
            button
            label="Select CSV File..."
            key="select-file"
            onPress={handleSelectCsvFile}
          />
          {(() => {
            if (loading) {
              return (
                <>
                  <InsetGroup.ItemSeparator key="s-loading" />
                  <InsetGroup.Item
                    disabled
                    key="loading"
                    label="Loading items..."
                    leftElement={<ActivityIndicator size="small" />}
                  />
                </>
              );
            }

            if (loadedItems && loadedItems.length > 0) {
              return loadedItems.flatMap(({ itemData, errorMessage }, i) => [
                <InsetGroup.ItemSeparator key={`s-${i}`} />,
                <ItemItem
                  key={i}
                  item={itemData}
                  arrow={false}
                  additionalDetails={
                    errorMessage ? (
                      <>
                        <Icon
                          name="app-exclamation"
                          color="red"
                          size={11}
                          style={commonStyles.mbm2}
                        />
                        <RNText> </RNText>
                        {errorMessage}
                      </>
                    ) : itemData.rev ? (
                      <>
                        <Icon
                          name="app-info"
                          color="green"
                          size={11}
                          style={commonStyles.mbm2}
                        />
                        <RNText> </RNText>
                        update
                      </>
                    ) : undefined
                  }
                  onPress={() => handleItemPress({ itemData, errorMessage })}
                />,
              ]);
            }
          })()}
        </InsetGroup>

        <InsetGroup
          label="Default Values for New Items"
          loading={working}
          footerLabel="These values will be used if not specified in CSV."
        >
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
                      color={selectedCollectionData.iconColor}
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
                  {defaultCollection
                    ? selectedCollectionData
                      ? typeof selectedCollectionData === 'object'
                        ? selectedCollectionData.name
                        : selectedCollectionData
                      : 'Loading...'
                    : 'Not Set'}
                </Text>
              </View>
            </TouchableOpacity>
          </InsetGroup.Item>
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            compactLabel
            label="Container"
            detail={
              defaultDedicatedContainer ? (
                <InsetGroup.ItemDetailButton
                  label="Remove"
                  destructive
                  onPress={() => setDefaultDedicatedContainer(null)}
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
                      color={selectedDedicatedContainerData.iconColor}
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
                  {defaultDedicatedContainer
                    ? selectedDedicatedContainerData
                      ? typeof selectedDedicatedContainerData === 'object'
                        ? selectedDedicatedContainerData.name
                        : selectedDedicatedContainerData
                      : 'Loading...'
                    : 'No Container'}
                </Text>
              </View>
            </TouchableOpacity>
          </InsetGroup.Item>
          <InsetGroup.ItemSeparator />
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
              {defaultIconName && (
                <View style={[commonStyles.row, commonStyles.alignItemsCenter]}>
                  <Icon
                    name={defaultIconName as IconName}
                    color={defaultIconColor as IconColor}
                    showBackground
                    size={40}
                  />
                  <Text style={[commonStyles.ml12, commonStyles.opacity05]}>
                    {defaultIconName}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </InsetGroup.Item>
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item compactLabel label="Icon Color">
            <ColorSelect
              value={defaultIconColor as ColorSelectColor}
              onChange={c => {
                setDefaultIconColor(c);
              }}
            />
          </InsetGroup.Item>
        </InsetGroup>
      </ScrollView>
    </ModalContent>
  );
}

export default ImportItemsFromCsvScreen;
