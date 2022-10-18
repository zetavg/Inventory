import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Text as RNText,
  Alert,
  TouchableHighlight,
} from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import { useRootBottomSheets } from '@app/navigation/RootBottomSheetsContext';
import { useFocusEffect } from '@react-navigation/native';

import Color from 'color';
import commonStyles from '@app/utils/commonStyles';
import useColors from '@app/hooks/useColors';
import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';
import Text from '@app/components/Text';
import Button from '@app/components/Button';
import Icon, { IconName, IconColor } from '@app/components/Icon';

import useDB from '@app/hooks/useDB';
import { useRelationalData } from '@app/db';
import { getDataFromDocs } from '@app/db/hooks';
import { DataTypeWithID } from '@app/db/relationalUtils';
import useOrderedData from '@app/hooks/useOrderedData';

import EPCUtils from '@app/modules/EPCUtils';

import ItemItem from '../components/ItemItem';
import ChecklistItem from '../components/ChecklistItem';
import useCheckItems from '../hooks/useCheckItems';

function ItemScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'Item'>) {
  const rootNavigation = useRootNavigation();
  const { openRfidSheet } = useRootBottomSheets();
  const { id, initialTitle } = route.params;
  const { db } = useDB();
  const { data, reloadData } = useRelationalData('item', id);

  const [reloadCounter, setReloadCounter] = useState(0);
  useFocusEffect(
    useCallback(() => {
      reloadData();
      setReloadCounter(v => v + 1);
    }, [reloadData]),
  );

  const item = data?.data;
  const [collection] =
    data?.getRelated('collection', {
      arrElementType: 'collection',
    }) || [];
  const [dedicatedContainer] = data?.getRelated('dedicatedContainer', {
    arrElementType: 'item',
  }) || [null];
  const dedicatedContents =
    data?.getRelated('dedicatedContents', { arrElementType: 'item' }) || null;
  const {
    orderedData: orderedDedicatedContents,
    updateOrder: updateDedicatedContentsOrder,
  } = useOrderedData({
    data: dedicatedContents,
    settingName: `item-${item?.id}-dedicatedContents`,
    settingPriority: '12',
  });
  const updateDedicatedContentsOrderFunctionRef = useRef(
    updateDedicatedContentsOrder,
  );
  updateDedicatedContentsOrderFunctionRef.current =
    updateDedicatedContentsOrder;
  const dedicatedItemsName = (() => {
    switch (item && item.isContainerType) {
      case 'item-with-parts':
        return 'Parts';
      default:
        return 'Dedicated Items';
    }
  })();

  const writeActualEpcContent = useCallback(async () => {
    if (!item) return;
    if (!item.computedRfidTagEpcMemoryBankContents) return;

    try {
      await db.rel.save('item', {
        ...item,
        actualRfidTagEpcMemoryBankContents:
          item.computedRfidTagEpcMemoryBankContents,
      });
      reloadData();
    } catch (e) {
      Alert.alert('Error', `Error on updating item: ${e}`);
    }
  }, [db.rel, item, reloadData]);

  const [displayEpc, setDisplayEpc] = useState<null | 'epc' | 'hex'>(null);
  const toggleDisplayEpc = useCallback(() => {
    setDisplayEpc(oldValue => {
      switch (oldValue) {
        case null:
          return 'epc';
        case 'epc':
          return 'hex';
        case 'hex':
          return null;
      }
    });
  }, []);

  const handleAddNewDedicatedContent = useCallback(
    () =>
      rootNavigation?.push('SaveItem', {
        initialData: {
          collection: collection?.id,
          iconName: collection?.itemDefaultIconName,
          dedicatedContainer: item?.id,
        },
        afterSave: it => {
          it.id &&
            it.itemReferenceNumber &&
            navigation.push('Item', { id: it.id });
        },
      }),
    [collection, item, navigation, rootNavigation],
  );

  const checklistItems = data?.getRelated('checklistItems', {
    arrElementType: 'checklistItem',
  });
  const [checklists, setChecklists] = useState<null | ReadonlyArray<
    DataTypeWithID<'checklist'>
  >>(null);
  const loadChecklists = useCallback(async () => {
    if (!checklistItems) return;

    const promises = checklistItems.map(async checklistItem => {
      try {
        const doc = await db.get(`checklist-2-${checklistItem.checklist}`);
        if (doc.type !== 'checklist') return null;
        const [d] = getDataFromDocs('checklist', [doc]);
        if (!d) return null;

        return d;
      } catch (e) {
        // Handle non-404 errors
        return null;
      }
    });
    const cls = (await Promise.all(promises)).filter(
      (i): i is DataTypeWithID<'checklist'> => !!i,
    );
    setChecklists(cls);
  }, [checklistItems, db]);
  useEffect(() => {
    loadChecklists();
  }, [loadChecklists]);
  const { orderedData: orderedChecklists } = useOrderedData({
    data: checklists,
    settingName: 'checklists',
  });

  const [devModeCounter, setDevModeCounter] = useState(0);

  const { iosTintColor, contentTextColor, textOnDarkBackgroundColor } =
    useColors();

  const afterWriteSuccessRef = useRef<(() => void) | null>(null);
  afterWriteSuccessRef.current = () => {
    if (item && !item.actualRfidTagEpcMemoryBankContents)
      writeActualEpcContent();
  };

  const [handleCheckContents] = useCheckItems({
    scanName: `container-${id}-scan`,
    items: dedicatedContents || [],
    navigation,
  });

  return (
    <ScreenContent
      navigation={navigation}
      route={route}
      title={data?.data ? data?.data.name : initialTitle || 'Item'}
      action1Label="Edit"
      action1SFSymbolName={(data && 'square.and.pencil') || undefined}
      action1MaterialIconName={(data && 'pencil') || undefined}
      onAction1Press={
        item
          ? () =>
              rootNavigation?.navigate('SaveItem', {
                initialData: item,
                afterDelete: () => navigation.goBack(),
              })
          : undefined
      }
      // action2Label={(data && 'Delete') || undefined}
      // action2SFSymbolName={(data && 'trash') || undefined}
      // action2MaterialIconName={(data && 'delete') || undefined}
      // onAction2Press={handleDelete}
    >
      <ScrollView keyboardDismissMode="interactive">
        <InsetGroup
          style={commonStyles.mt2}
          loading={!item}
          footerLabel={(() => {
            if (item?.computedRfidTagEpcMemoryBankContents) {
              if (!item?.actualRfidTagEpcMemoryBankContents) {
                return (
                  <>
                    <Icon
                      name="app-exclamation"
                      color="yellow"
                      size={16}
                      style={commonStyles.mbm2}
                    />
                    <RNText> </RNText>
                    <RNText>
                      This item has an EPC number but it's not written on any
                      RFID tag. Press the "Write Tag" button to write the EPC
                      number onto a tag that is attached to the item.
                    </RNText>
                    <RNText> </RNText>
                    <RNText>You can also</RNText>
                    <RNText> </RNText>
                    <RNText
                      onPress={() =>
                        Alert.alert(
                          'Confirm',
                          "Do you want to treat this item as it's EPC has been written to the RFID tag?",
                          [
                            {
                              text: 'No',
                              style: 'cancel',
                              onPress: () => {},
                            },
                            {
                              text: 'Yes',
                              // style: 'destructive',
                              onPress: writeActualEpcContent,
                            },
                          ],
                        )
                      }
                      style={{ color: iosTintColor }}
                    >
                      manually set this as done
                    </RNText>
                    <RNText>.</RNText>
                  </>
                );
              }

              if (
                item?.actualRfidTagEpcMemoryBankContents !==
                item?.computedRfidTagEpcMemoryBankContents
              ) {
                return (
                  <>
                    <Icon
                      name="app-exclamation"
                      color="yellow"
                      size={16}
                      style={commonStyles.mbm2}
                    />
                    <RNText> </RNText>
                    <RNText>
                      The actual EPC number written to the RFID tag of this item
                      is outdated. Press the "Write Tag" button to open the
                      Write Tag panel, use "Wipe" to reset a RFID tag and then
                      press "Write" to write the updated EPC content. If you're
                      done with the update, you can
                    </RNText>
                    <RNText> </RNText>
                    <RNText
                      onPress={() =>
                        Alert.alert(
                          'Confirm',
                          'Are you sure you\'ve done with the RFID tag update? After pressing "Yes", you will not be able to locate or scan this item with the old and outdated EPC number.',
                          [
                            {
                              text: 'No',
                              style: 'cancel',
                              onPress: () => {},
                            },
                            {
                              text: 'Yes',
                              style: 'destructive',
                              onPress: writeActualEpcContent,
                            },
                          ],
                        )
                      }
                      style={{ color: iosTintColor }}
                    >
                      manually set this as done
                    </RNText>
                    <RNText>.</RNText>
                  </>
                );
              }
            }
          })()}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              setDevModeCounter(v => v + 1);
            }}
          >
            <View style={[commonStyles.row, commonStyles.centerChildren]}>
              <InsetGroup.Item
                vertical2
                label="Name"
                detail={item?.name}
                containerStyle={[commonStyles.flex1]}
              />
              <Icon
                showBackground
                name={item?.iconName as IconName}
                color={item?.iconColor as IconColor}
                size={40}
                style={{ marginRight: InsetGroup.MARGIN_HORIZONTAL }}
              />
            </View>
          </TouchableWithoutFeedback>
          {devModeCounter > 10 && (
            <>
              <InsetGroup.ItemSeparator />
              <InsetGroup.Item
                vertical2
                label="ID"
                detailTextStyle={commonStyles.monospaced}
                detail={item?.id}
              />
              <InsetGroup.ItemSeparator />
              <InsetGroup.Item
                vertical2
                label="Created At"
                detailTextStyle={commonStyles.monospaced}
                detail={
                  item?.createdAt
                    ? new Date(item?.createdAt * 1000).toISOString()
                    : '(null)'
                }
              />
              <InsetGroup.ItemSeparator />
              <InsetGroup.Item
                vertical2
                label="Updated At"
                detailTextStyle={commonStyles.monospaced}
                detail={
                  item?.updatedAt
                    ? new Date(item?.updatedAt * 1000).toISOString()
                    : '(null)'
                }
              />
            </>
          )}
          {item?.dedicatedContainer && (
            <>
              <InsetGroup.ItemSeparator />
              <TouchableHighlight
                style={[commonStyles.row, commonStyles.centerChildren]}
                onPress={
                  collection
                    ? () =>
                        navigation.push('Item', {
                          id: item?.dedicatedContainer || '',
                          initialTitle: dedicatedContainer?.name,
                        })
                    : undefined
                }
                underlayColor={Color(contentTextColor).opaquer(-0.92).hexa()}
              >
                <>
                  <InsetGroup.Item
                    vertical2
                    label={(() => {
                      switch (dedicatedContainer?.isContainerType) {
                        case 'item-with-parts':
                          return 'Part of';
                        default:
                          return 'Dedicated Container';
                      }
                    })()}
                    detailTextStyle={
                      !dedicatedContainer?.name && commonStyles.opacity04
                    }
                    detail={dedicatedContainer?.name || 'Loading'}
                    containerStyle={[commonStyles.flex1]}
                  />
                  <Icon
                    showBackground
                    name={dedicatedContainer?.iconName as IconName}
                    color={dedicatedContainer?.iconColor as IconColor}
                    size={40}
                    style={{ marginRight: InsetGroup.MARGIN_HORIZONTAL }}
                  />
                </>
              </TouchableHighlight>
            </>
          )}
          <InsetGroup.ItemSeparator />
          <TouchableHighlight
            style={[commonStyles.row, commonStyles.centerChildren]}
            onPress={
              collection
                ? () =>
                    navigation.push('Collection', {
                      id: item?.collection || '',
                      initialTitle: collection.name,
                    })
                : undefined
            }
            underlayColor={Color(contentTextColor).opaquer(-0.92).hexa()}
          >
            <>
              <InsetGroup.Item
                vertical2
                label="In Collection"
                detailTextStyle={!collection?.name && commonStyles.opacity04}
                detail={collection?.name || 'Loading'}
                containerStyle={[commonStyles.flex1]}
              />
              <Icon
                showBackground
                name={collection?.iconName as IconName}
                color={collection?.iconColor as IconColor}
                size={40}
                style={{ marginRight: InsetGroup.MARGIN_HORIZONTAL }}
              />
            </>
          </TouchableHighlight>
          {item?.itemReferenceNumber && (
            <>
              <InsetGroup.ItemSeparator />
              <View style={[commonStyles.row, commonStyles.centerChildren]}>
                <TouchableWithoutFeedback
                  style={commonStyles.flex1}
                  onPress={toggleDisplayEpc}
                >
                  {(() => {
                    switch (displayEpc) {
                      case 'epc': {
                        let epc: string;
                        try {
                          const res = EPCUtils.decodeHexEPC(
                            item.computedRfidTagEpcMemoryBankContents || '',
                          );
                          epc = res[0];
                        } catch (e: any) {
                          epc = e.message;
                        }
                        return (
                          <InsetGroup.Item
                            vertical2
                            label="EPC"
                            detailTextStyle={commonStyles.monospaced}
                            detail={epc}
                            containerStyle={[commonStyles.flex1]}
                          />
                        );
                      }
                      case 'hex': {
                        return (
                          <InsetGroup.Item
                            vertical2
                            label="EPC (Hex)"
                            detailTextStyle={commonStyles.monospaced}
                            detail={item.computedRfidTagEpcMemoryBankContents}
                            containerStyle={[commonStyles.flex1]}
                          />
                        );
                      }
                      default:
                        return (
                          <InsetGroup.Item
                            vertical2
                            label="Asset Reference Number"
                            detailTextStyle={commonStyles.monospaced}
                            detail={
                              item.individualAssetReference
                              // collection &&
                              // item &&
                              // EPCUtils.encodeIndividualAssetReference(
                              //   32,
                              //   collection.collectionReferenceNumber,
                              //   item.itemReferenceNumber,
                              //   item.serial || 0,
                              //   { includePrefix: false, joinBy: '.' },
                              // )
                            }
                            containerStyle={[commonStyles.flex1]}
                          />
                        );
                    }
                  })()}
                </TouchableWithoutFeedback>
                <TouchableOpacity
                  style={[styles.buttonWithAnnotationText, commonStyles.mr12]}
                  onPress={() =>
                    openRfidSheet({
                      functionality: 'write',
                      epc: item.computedRfidTagEpcMemoryBankContents,
                      tagAccessPassword: item.rfidTagAccessPassword,
                      afterWriteSuccessRef,
                    })
                  }
                >
                  <Icon
                    name="rfid-write"
                    size={44}
                    sfSymbolWeight="medium"
                    showBackground
                    backgroundColor="transparent"
                    color={iosTintColor}
                  />
                  <Text
                    style={[
                      styles.buttonAnnotationText,
                      { color: iosTintColor },
                    ]}
                  >
                    Write Tag
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.buttonWithAnnotationText,
                    { marginRight: InsetGroup.MARGIN_HORIZONTAL - 2 },
                    !item.actualRfidTagEpcMemoryBankContents &&
                      commonStyles.opacity04,
                  ]}
                  onPress={() =>
                    openRfidSheet({
                      functionality: 'locate',
                      epc: item.actualRfidTagEpcMemoryBankContents,
                    })
                  }
                  disabled={!item.actualRfidTagEpcMemoryBankContents}
                >
                  <Icon
                    name="rfid-locate"
                    size={44}
                    sfSymbolWeight="medium"
                    showBackground
                    backgroundColor="transparent"
                    color={iosTintColor}
                  />
                  <Text
                    style={[
                      styles.buttonAnnotationText,
                      { color: iosTintColor },
                    ]}
                  >
                    Locate
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {devModeCounter > 10 && (
            <>
              <InsetGroup.ItemSeparator />
              <InsetGroup.Item
                vertical2
                label="Computed RFID Tag EPC Contents"
                detailTextStyle={commonStyles.monospaced}
                detail={item?.computedRfidTagEpcMemoryBankContents || '(null)'}
              />
              <InsetGroup.ItemSeparator />
              <InsetGroup.Item
                vertical2
                label="Actual RFID Tag EPC Contents"
                detailTextStyle={commonStyles.monospaced}
                detail={item?.actualRfidTagEpcMemoryBankContents || '(null)'}
              />
            </>
          )}
        </InsetGroup>
        {item?.isContainer && (
          <>
            {(orderedDedicatedContents || []).length > 0 && (
              <InsetGroup backgroundTransparent>
                <Button mode="text" onPress={handleCheckContents}>
                  <Icon
                    name="checklist"
                    sfSymbolWeight="bold"
                    color={iosTintColor}
                  />{' '}
                  Check {dedicatedItemsName}
                </Button>
              </InsetGroup>
            )}
            <InsetGroup
              label={
                (() => {
                  const count =
                    orderedDedicatedContents && orderedDedicatedContents.length;
                  if (count) return `${count} `;
                  return '';
                })() + dedicatedItemsName
              }
              labelVariant="large"
              loading={!item}
              labelRight={
                <>
                  {orderedDedicatedContents &&
                    orderedDedicatedContents.length > 0 && (
                      <InsetGroup.LabelButton
                        onPress={handleCheckContents}
                        contentAsText={false}
                        style={commonStyles.mr8}
                      >
                        <Icon
                          name="checklist"
                          sfSymbolWeight="bold"
                          color={iosTintColor}
                        />
                      </InsetGroup.LabelButton>
                    )}
                  {orderedDedicatedContents &&
                    orderedDedicatedContents.length > 0 && (
                      <InsetGroup.LabelButton
                        onPress={() =>
                          rootNavigation?.push('OrderItems', {
                            orderedItems: orderedDedicatedContents,
                            updateOrderFunctionRef:
                              updateDedicatedContentsOrderFunctionRef,
                          })
                        }
                        contentAsText={false}
                        style={commonStyles.mr8}
                      >
                        <Icon
                          name="app-reorder"
                          sfSymbolWeight="bold"
                          color={iosTintColor}
                        />
                      </InsetGroup.LabelButton>
                    )}
                  {orderedDedicatedContents &&
                  orderedDedicatedContents.length > 0 ? (
                    <InsetGroup.LabelButton
                      primary
                      onPress={handleAddNewDedicatedContent}
                      contentAsText={false}
                    >
                      <Icon
                        name="add"
                        sfSymbolWeight="bold"
                        color={textOnDarkBackgroundColor}
                      />
                    </InsetGroup.LabelButton>
                  ) : (
                    <InsetGroup.LabelButton
                      primary
                      onPress={handleAddNewDedicatedContent}
                    >
                      <Icon
                        name="add"
                        sfSymbolWeight="bold"
                        color={textOnDarkBackgroundColor}
                      />{' '}
                      New Item
                    </InsetGroup.LabelButton>
                  )}
                </>
              }
            >
              {(() => {
                if (!orderedDedicatedContents)
                  return <InsetGroup.Item label="Loading..." disabled />;
                if (orderedDedicatedContents.length <= 0)
                  return <InsetGroup.Item label="No Items" disabled />;
                return orderedDedicatedContents
                  .flatMap(it => [
                    <ItemItem
                      key={it.id}
                      item={it}
                      hideDedicatedContainerDetails
                      hideCollectionDetails={it.collection === item.collection}
                      reloadCounter={reloadCounter}
                      onPress={() =>
                        navigation.push('Item', {
                          id: it.id || '',
                          initialTitle: it.name,
                        })
                      }
                    />,
                    <InsetGroup.ItemSeparator
                      key={`s-${it.id}`}
                      leftInset={60}
                    />,
                  ])
                  .slice(0, -1);
              })()}
              {/*<InsetGroup.ItemSeparator />
            <InsetGroup.Item
              button
              label="Add New Item"
              onPress={handleAddNewItem}
            />*/}
            </InsetGroup>
          </>
        )}
        {/*<InsetGroup
          label="Items in this item"
          labelVariant="large"
          loading={!item}
        >
          {(data?.getRelated('items', { arrElementType: 'item' }) || [])
            .flatMap(item => [
              <InsetGroup.Item
                key={item.id}
                vertical
                arrow
                label={item.name}
                detail={item.id}
                onPress={() =>
                  navigation.push('RelationalPouchDBTypeDataDetail', {
                    type: 'item',
                    id: item.id || '',
                    initialTitle: item.name,
                  })
                }
              />,
              <InsetGroup.ItemSeparator key={`s-${item.id}`} />,
            ])
            .slice(0, -1)}
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            button
            label="Add New Item"
            onPress={() =>
              rootNavigation?.push('RelationalPouchDBSave', {
                type: 'item',
                initialData: {
                  item: item?.id,
                },
              })
            }
          />
        </InsetGroup>*/}
        {!!item?.notes && (
          <InsetGroup label="Notes" labelVariant="large">
            <InsetGroup.Item>
              <Text>{item.notes}</Text>
            </InsetGroup.Item>
          </InsetGroup>
        )}
        {(() => {
          const detailElements = [];

          if (item?.modelName) {
            detailElements.push(
              <InsetGroup.Item
                key="modelName"
                vertical2
                label="Model Name"
                detail={item.modelName}
              />,
            );
          }

          if (typeof item?.purchasePriceX1000 === 'number') {
            // const strValue = (() => {
            //   const str = item.purchasePriceX1000.toString();
            //   const a = str.slice(0, -3) || '0';
            //   const b = str.slice(-3).padStart(3, '0').replace(/0+$/, '');
            //   if (!b) {
            //     return a;
            //   }
            //   return a + '.' + b;
            // })();
            const strValue = new Intl.NumberFormat('en-US').format(
              item.purchasePriceX1000 / 1000.0,
            );
            detailElements.push(
              <InsetGroup.Item
                key="purchasePrice"
                vertical2
                label="Purchase Price"
                detailAsText
                detail={
                  <>
                    {strValue}
                    {!!item?.purchasePriceCurrency && (
                      <InsetGroup.ItemAffix>
                        {' ' + item.purchasePriceCurrency}
                      </InsetGroup.ItemAffix>
                    )}
                  </>
                }
              />,
            );
          }

          if (item?.purchasedFrom) {
            detailElements.push(
              <InsetGroup.Item
                key="purchasedFrom"
                vertical2
                label="Purchased From"
                detail={item.purchasedFrom}
              />,
            );
          }

          if (detailElements.length <= 0) return;

          return (
            <InsetGroup label="Details" labelVariant="large">
              {detailElements
                .flatMap(element => [element, <InsetGroup.ItemSeparator />])
                .slice(0, -1)}
            </InsetGroup>
          );
        })()}

        {!!orderedChecklists && orderedChecklists.length > 0 && (
          <InsetGroup labelVariant="large" label="Included In">
            {orderedChecklists
              .flatMap(checklist => [
                <ChecklistItem
                  key={checklist.id}
                  checklist={checklist}
                  reloadCounter={reloadCounter}
                  onPress={() =>
                    navigation.push('Checklist', {
                      id: checklist.id || '',
                      initialTitle: checklist.name,
                    })
                  }
                />,
                <InsetGroup.ItemSeparator
                  key={`s-${checklist.id}`}
                  leftInset={60}
                />,
              ])
              .slice(0, -1)}
          </InsetGroup>
        )}
      </ScrollView>
    </ScreenContent>
  );
}

const styles = StyleSheet.create({
  buttonWithAnnotationText: {
    marginBottom: 7,
  },
  buttonAnnotationText: {
    position: 'absolute',
    bottom: -6,
    left: -15,
    right: -16,
    textAlign: 'center',
    fontSize: 8,
    fontWeight: '500',
  },
});

export default ItemScreen;
