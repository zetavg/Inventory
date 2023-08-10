import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TouchableHighlight,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

import Color from 'color';

import { onlyValid, useConfig, useData, useRelated, useSave } from '@app/data';

import { useRelationalData } from '@app/db';
import { getDataFromDocs } from '@app/db/hooks';
import { DataTypeWithID } from '@app/db/old_relationalUtils';

import commonStyles from '@app/utils/commonStyles';

import EPCUtils from '@app/modules/EPCUtils';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootBottomSheets } from '@app/navigation/RootBottomSheetsContext';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useActionSheet from '@app/hooks/useActionSheet';
import useColors from '@app/hooks/useColors';
import useDB from '@app/hooks/useDB';
import useOrdered from '@app/hooks/useOrdered';

import Button from '@app/components/Button';
import Icon, {
  IconColor,
  IconName,
  verifyIconColorWithDefault,
  verifyIconNameWithDefault,
} from '@app/components/Icon';
import ScreenContent from '@app/components/ScreenContent';
import Text from '@app/components/Text';
import UIGroup from '@app/components/UIGroup';

import ChecklistItem from '../components/ChecklistItem';
import ItemItem from '../components/ItemItem';
import ItemListItem from '../components/ItemListItem';
import useCheckItems from '../hooks/useCheckItems';

function ItemScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'Item'>) {
  const { id, preloadedTitle } = route.params;

  const rootNavigation = useRootNavigation();
  const { openRfidSheet } = useRootBottomSheets();
  const { showActionSheet } = useActionSheet();

  const { config, loading: configLoading } = useConfig();
  const { save } = useSave();

  const [reloadCounter, setReloadCounter] = useState(0);
  const {
    data,
    loading: dataLoading,
    refresh: refreshData,
    refreshing: dataRefreshing,
  } = useData('item', id);
  const {
    data: collection,
    loading: collectionLoading,
    refresh: refreshCollection,
    refreshing: collectionRefreshing,
  } = useRelated(data, 'collection');
  const {
    data: dedicatedContainer,
    loading: dedicatedContainerLoading,
    refresh: refreshDedicatedContainer,
    refreshing: dedicatedContainerRefreshing,
  } = useRelated(data, 'dedicated_container');
  const {
    data: dedicatedContents,
    loading: dedicatedContentsLoading,
    refresh: refreshDedicatedContents,
    refreshing: dedicatedContentsRefreshing,
  } = useRelated(data, 'dedicated_contents', {
    sort: [{ __created_at: 'asc' }],
  });
  const refresh = useCallback(() => {
    refreshData();
    refreshCollection();
    refreshDedicatedContainer();
    refreshDedicatedContents();
    setReloadCounter(v => v + 1);
  }, [
    refreshCollection,
    refreshData,
    refreshDedicatedContainer,
    refreshDedicatedContents,
  ]);
  const refreshing =
    dataRefreshing ||
    collectionRefreshing ||
    dedicatedContainerRefreshing ||
    dedicatedContentsRefreshing;

  useFocusEffect(
    useCallback(() => {
      setReloadCounter(v => v + 1);
    }, []),
  );

  const [orderedDedicatedContents] = useOrdered(
    dedicatedContents && onlyValid(dedicatedContents),
    [],
  );
  const updateDedicatedContentsOrder = useCallback(
    (newOrder: string[]) => {
      newOrder;
      refreshData();
    },
    [refreshData],
  );
  const updateDedicatedContentsOrderFunctionRef = useRef(
    updateDedicatedContentsOrder,
  );
  updateDedicatedContentsOrderFunctionRef.current =
    updateDedicatedContentsOrder;

  const dedicatedItemsName = (() => {
    switch (data && data.item_type) {
      case 'item_with_parts':
        return 'Parts';
      default:
        return 'Dedicated Items';
    }
  })();

  const writeActualEpcContent = useCallback(async () => {
    if (!data || !data.__valid) return;
    if (!data.rfid_tag_epc_memory_bank_contents) return;

    data.actual_rfid_tag_epc_memory_bank_contents =
      data.rfid_tag_epc_memory_bank_contents;
    try {
      await save(data);
      refreshData();
    } catch (e) {}
  }, [data, refreshData, save]);

  const [displayEpc, setDisplayEpc] = useState<null | 'epc' | 'hex'>(null);
  const switchDisplayEpc = useCallback(() => {
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

  const handleNewDedicatedContent = useCallback(
    () =>
      rootNavigation?.push('SaveItem', {
        initialData: {
          dedicated_container_id: data?.__id,
          collection_id:
            typeof data?.collection_id === 'string'
              ? data?.collection_id
              : undefined,
          icon_name:
            typeof collection?.item_default_icon_name === 'string'
              ? collection?.item_default_icon_name
              : undefined,
        },
        afterSave: it => {
          it.__id &&
            (it.rfid_tag_epc_memory_bank_contents ||
              it.dedicated_container_id !== data?.__id) &&
            navigation.push('Item', { id: it.__id });
        },
      }),
    [
      collection?.item_default_icon_name,
      data?.__id,
      data?.collection_id,
      navigation,
      rootNavigation,
    ],
  );

  const [devModeCounter, setDevModeCounter] = useState(0);

  const { iosTintColor, contentTextColor, textOnDarkBackgroundColor } =
    useColors();

  const afterRFIDTagWriteSuccessRef = useRef<(() => void) | null>(null);
  afterRFIDTagWriteSuccessRef.current = () => {
    if (data && !data.actual_rfid_tag_epc_memory_bank_contents)
      writeActualEpcContent();
  };

  const [handleCheckContents] = useCheckItems({
    scanName: `container-${id}-scan`,
    items: [],
    navigation,
  });

  const handleMoreActionsPress = useCallback(() => {
    // const options = [
    //   item?.isContainer && 'new-dedicated-item',
    //   item && 'duplicate',
    // ].filter((s): s is string => !!s);
    // const optionNames: Record<string, string> = {
    //   'new-dedicated-item': `New ${(() => {
    //     switch (item?.isContainerType) {
    //       case 'generic-container':
    //       case 'item-with-parts':
    //         return 'Part';
    //       default:
    //         return 'Dedicated Item';
    //     }
    //   })()}...`,
    //   duplicate: 'Duplicate',
    // };
    // const shownOptions = options.map(v => optionNames[v]);
    // showActionSheetWithOptions(
    //   {
    //     options: [...shownOptions, 'Cancel'],
    //     cancelButtonIndex: shownOptions.length,
    //   },
    //   buttonIndex => {
    //     if (buttonIndex === shownOptions.length) {
    //       // cancel action
    //       return;
    //     }
    //     const selectedOption =
    //       typeof buttonIndex === 'number' ? options[buttonIndex] : null;
    //     switch (selectedOption) {
    //       case 'new-dedicated-item':
    //         return handleNewDedicatedContent();
    //       case 'duplicate':
    //         if (!item) return;
    //         rootNavigation?.navigate('SaveItem', {
    //           initialData: {
    //             ...Object.fromEntries(
    //               Object.entries(item).filter(
    //                 ([k]) =>
    //                   !k.startsWith('computed') &&
    //                   k !== 'actualRfidTagEpcMemoryBankContents' &&
    //                   k !== 'rfidTagAccessPassword' &&
    //                   k !== 'createdAt' &&
    //                   k !== 'updatedAt',
    //               ),
    //             ),
    //             id: undefined,
    //             rev: undefined,
    //           },
    //           afterSave: it => {
    //             it.id && navigation.push('Item', { id: it.id });
    //           },
    //         });
    //         return;
    //       default:
    //         Alert.alert('TODO', `${selectedOption} is not implemented yet.`);
    //         return;
    //     }
    //   },
    // );
  }, []);

  return (
    <ScreenContent
      navigation={navigation}
      route={route}
      title={
        (typeof data?.name === 'string' ? data.name : preloadedTitle) || 'Item'
      }
      action1Label="Edit"
      action1SFSymbolName={(data && 'square.and.pencil') || undefined}
      action1MaterialIconName={(data && 'pencil') || undefined}
      onAction1Press={
        data?.__valid
          ? () =>
              rootNavigation?.navigate('SaveItem', {
                initialData: data,
                afterDelete: () => navigation.goBack(),
              })
          : undefined
      }
      action2Label={(data && 'Actions') || undefined}
      action2SFSymbolName={(data && 'ellipsis.circle') || undefined}
      action2MaterialIconName={(data && 'dots-horizontal') || undefined}
      onAction2Press={handleMoreActionsPress}
    >
      <ScreenContent.ScrollView>
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        <UIGroup
          loading={dataLoading}
          // eslint-disable-next-line react/no-unstable-nested-components
          footer={(() => {
            if (!data?.__valid) return undefined;

            if (data?.rfid_tag_epc_memory_bank_contents) {
              if (!data?.actual_rfid_tag_epc_memory_bank_contents) {
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
                data?.actual_rfid_tag_epc_memory_bank_contents !==
                data?.rfid_tag_epc_memory_bank_contents
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
          {(() => {
            const item = data && onlyValid(data);
            if (!item) return null;

            const validDedicatedContainer =
              dedicatedContainer && onlyValid(dedicatedContainer);
            const validCollection = collection && onlyValid(collection);

            const handleDedicatedContainerPress = () =>
              item.dedicated_container_id &&
              navigation.push('Item', {
                id: item.dedicated_container_id,
                preloadedTitle: validDedicatedContainer?.name,
              });

            const handleCollectionPress = () =>
              item.collection_id &&
              navigation.push('Collection', {
                id: item.collection_id,
                preloadedTitle: validCollection?.name,
              });

            return (
              <>
                <TouchableWithoutFeedback
                  onPress={() => {
                    setDevModeCounter(v => v + 1);
                  }}
                >
                  <UIGroup.ListItem
                    verticalArrangedLargeTextIOS
                    label="Item Name"
                    detail={item.name}
                    // eslint-disable-next-line react/no-unstable-nested-components
                    rightElement={({ iconProps }) => (
                      <Icon
                        name={verifyIconNameWithDefault(item.icon_name)}
                        color={item.icon_color}
                        {...iconProps}
                      />
                    )}
                  />
                </TouchableWithoutFeedback>
                {devModeCounter > 10 && (
                  <>
                    <UIGroup.ListItemSeparator />
                    <UIGroup.ListItem
                      verticalArrangedLargeTextIOS
                      label="ID"
                      monospaceDetail
                      adjustsDetailFontSizeToFit
                      detail={item.__id}
                    />
                    <UIGroup.ListItemSeparator />
                    <UIGroup.ListItem
                      verticalArrangedLargeTextIOS
                      label="Created At"
                      monospaceDetail
                      detail={
                        item.__created_at
                          ? new Date(item.__created_at).toISOString()
                          : '(null)'
                      }
                    />
                    <UIGroup.ListItemSeparator />
                    <UIGroup.ListItem
                      verticalArrangedLargeTextIOS
                      label="Updated At"
                      monospaceDetail
                      detail={
                        item.__updated_at
                          ? new Date(item.__updated_at).toISOString()
                          : '(null)'
                      }
                    />
                  </>
                )}
                {!!item.dedicated_container_id && (
                  <>
                    <UIGroup.ListItemSeparator />
                    {validDedicatedContainer ? (
                      <UIGroup.ListItem
                        verticalArrangedLargeTextIOS
                        label={(() => {
                          switch (validDedicatedContainer.item_type) {
                            case 'item_with_parts':
                              return 'Part of';
                            default:
                              return 'Dedicated Container';
                          }
                        })()}
                        detail={validDedicatedContainer.name}
                        // eslint-disable-next-line react/no-unstable-nested-components
                        rightElement={({ iconProps }) => (
                          <Icon
                            name={verifyIconNameWithDefault(
                              validDedicatedContainer.icon_name,
                            )}
                            color={validDedicatedContainer.icon_color}
                            {...iconProps}
                          />
                        )}
                        onPress={handleDedicatedContainerPress}
                      />
                    ) : (
                      <UIGroup.ListItem
                        verticalArrangedLargeTextIOS
                        label="Dedicated Container"
                        detail="Loading..."
                        onPress={handleDedicatedContainerPress}
                      />
                    )}
                  </>
                )}
                <UIGroup.ListItemSeparator />
                {validCollection ? (
                  <UIGroup.ListItem
                    verticalArrangedLargeTextIOS
                    label="In Collection"
                    detail={validCollection.name}
                    // eslint-disable-next-line react/no-unstable-nested-components
                    rightElement={({ iconProps }) => (
                      <Icon
                        name={verifyIconNameWithDefault(
                          validCollection.icon_name,
                        )}
                        color={validCollection.icon_color}
                        {...iconProps}
                      />
                    )}
                    onPress={handleCollectionPress}
                  />
                ) : (
                  <UIGroup.ListItem
                    verticalArrangedLargeTextIOS
                    label="In Collection"
                    detail="Loading..."
                    onPress={handleCollectionPress}
                  />
                )}
                {item._individual_asset_reference && (
                  <>
                    <UIGroup.ListItemSeparator />
                    <TouchableWithoutFeedback
                      style={commonStyles.flex1}
                      onPress={switchDisplayEpc}
                    >
                      {(() => {
                        const rightElement = (
                          <>
                            <TouchableOpacity
                              style={[
                                styles.buttonWithAnnotationText,
                                commonStyles.mr12,
                              ]}
                              onPress={() =>
                                openRfidSheet({
                                  functionality: 'write',
                                  epc: item.rfid_tag_epc_memory_bank_contents,
                                  tagAccessPassword: item.rfidTagAccessPassword,
                                  afterWriteSuccessRef:
                                    afterRFIDTagWriteSuccessRef,
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
                                !item.actual_rfid_tag_epc_memory_bank_contents &&
                                  commonStyles.opacity04,
                              ]}
                              onPress={() =>
                                openRfidSheet({
                                  functionality: 'locate',
                                  epc: item.actual_rfid_tag_epc_memory_bank_contents,
                                })
                              }
                              disabled={
                                !item.actual_rfid_tag_epc_memory_bank_contents
                              }
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
                          </>
                        );

                        switch (displayEpc) {
                          case 'epc': {
                            return (
                              <UIGroup.ListItem
                                verticalArrangedLargeTextIOS
                                label="EPC Tag URI"
                                detail={item.epc_tag_uri}
                                monospaceDetail
                                rightElement={rightElement}
                              />
                            );
                          }
                          case 'hex': {
                            return (
                              <UIGroup.ListItem
                                verticalArrangedLargeTextIOS
                                label="RFID Tag EPC (Hex)"
                                detail={item.rfid_tag_epc_memory_bank_contents}
                                monospaceDetail
                                rightElement={rightElement}
                              />
                            );
                          }
                          default:
                            let iar = item._individual_asset_reference;
                            if (config?.rfid_tag_prefix) {
                              const prefixPart = `${config?.rfid_tag_prefix}.`;
                              if (iar.startsWith(prefixPart)) {
                                iar = iar.slice(prefixPart.length);
                              }
                            }
                            return (
                              <UIGroup.ListItem
                                verticalArrangedLargeTextIOS
                                label="Individual Asset Reference"
                                detail={iar}
                                monospaceDetail
                                rightElement={rightElement}
                              />
                            );
                        }
                      })()}
                    </TouchableWithoutFeedback>
                  </>
                )}
                {devModeCounter > 10 && (
                  <>
                    <UIGroup.ListItemSeparator />
                    <UIGroup.ListItem
                      verticalArrangedLargeTextIOS
                      label="Actual RFID Tag EPC Memory Bank Contents"
                      monospaceDetail
                      detail={
                        item.actual_rfid_tag_epc_memory_bank_contents ||
                        '(null)'
                      }
                    />
                  </>
                )}
              </>
            );
          })()}
        </UIGroup>

        {typeof data?.item_type === 'string' &&
          ['container', 'generic_container', 'item_with_parts'].includes(
            data.item_type,
          ) && (
            <UIGroup
              largeTitle
              header={(() => {
                switch (data?.item_type) {
                  case 'item_with_parts':
                    return 'Parts';
                  default:
                    return 'Contents';
                }
              })()}
              placeholder={dedicatedContentsLoading ? undefined : 'No items'}
              headerRight={
                <>
                  <UIGroup.TitleButton onPress={() => {}}>
                    {({ iconProps }) => (
                      <Icon {...iconProps} name="app-reorder" />
                    )}
                  </UIGroup.TitleButton>
                  <UIGroup.TitleButton
                    primary
                    onPress={handleNewDedicatedContent}
                  >
                    {({ iconProps, textProps }) => (
                      <>
                        <Icon {...iconProps} name="add" />
                        <Text {...textProps}>New</Text>
                      </>
                    )}
                  </UIGroup.TitleButton>
                </>
              }
            >
              {!!dedicatedContents &&
                onlyValid(dedicatedContents).length > 0 &&
                UIGroup.ListItemSeparator.insertBetween(
                  onlyValid(dedicatedContents).map(i => (
                    <ItemListItem
                      key={i.__id}
                      item={i}
                      onPress={() =>
                        navigation.push('Item', {
                          id: i.__id || '',
                          preloadedTitle: i.name,
                        })
                      }
                    />
                  )),
                )}
            </UIGroup>
          )}
      </ScreenContent.ScrollView>
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
