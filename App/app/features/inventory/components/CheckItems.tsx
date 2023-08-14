import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  StyleSheet,
  TouchableHighlight,
  View,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Color from 'color';

import { DataTypeWithAdditionalInfo } from '@app/data';

import commonStyles from '@app/utils/commonStyles';

import { ScanData } from '@app/modules/RFIDWithUHFBaseModule';

import useActionSheet from '@app/hooks/useActionSheet';
import useColors from '@app/hooks/useColors';

import InsetGroup from '@app/components/InsetGroup';
import Text from '@app/components/Text';

import ItemListItem from './ItemListItem';

const UI_REORDER_ANIMATION_DELAY = 500;

export default function CheckItems({
  items: topLevelItems,
  scannedItems,
  clearScannedDataCounter,
  contentBackgroundColor,
  dedicatedIdsMap,
  loadedItemsMapRef,
  onViewItemPress,
  resultSeenIdsRef,
  resultManuallyCheckedIdsRef,
}: {
  items: ReadonlyArray<DataTypeWithAdditionalInfo<'item'>>;
  scannedItems: Record<string, ScanData>;
  clearScannedDataCounter: number;
  contentBackgroundColor: string;
  dedicatedIdsMap: Record<string, Array<string>>;
  loadedItemsMapRef: React.MutableRefObject<Map<
    string,
    DataTypeWithAdditionalInfo<'item'>
  > | null>;
  onViewItemPress: (itemId: string) => void;
  resultSeenIdsRef?: React.MutableRefObject<Set<string> | null>;
  resultManuallyCheckedIdsRef?: React.MutableRefObject<Set<string> | null>;
}) {
  const { showActionSheetWithOptions } = useActionSheet();

  /** An object of `{ [Key of item A]: Dedicated container of item A }` */
  const itemIdDedicatedContainerIdMap = useMemo(() => {
    return Object.fromEntries(
      Object.entries(dedicatedIdsMap).flatMap(([parentId, childrenIds]) =>
        childrenIds.map(childrenId => [childrenId, parentId]),
      ),
    );
  }, [dedicatedIdsMap]);
  /** An object of `{ [ID of item A]: EPC of item A }` */
  // Not used anymore, replaced by epcItemIdMap
  // const itemIdEpcMap = useMemo<Record<string, string>>(() => {
  //   return Object.fromEntries(
  //     items.map(it => [it.__id, it.actual_rfid_tag_epc_memory_bank_contents]),
  //   );
  // }, [items]);
  /** An object of `{ [EPC of item A]: ID of item A }` */
  const epcItemIdMap = useMemo<Record<string, string>>(() => {
    const notFoundIds: string[] = [];
    const object = {
      ...Object.fromEntries(
        topLevelItems.map(it => [
          it.actual_rfid_tag_epc_memory_bank_contents,
          it.__id,
        ]),
      ),
      ...Object.fromEntries(
        Object.keys(itemIdDedicatedContainerIdMap)
          .map(id => {
            if (!loadedItemsMapRef.current) {
              Alert.alert(
                'Internal Error',
                'CheckItems: loadedItemsMapRef is not initialized, this component expects loadedItemsMapRef.current being set on its render.',
              );
              return null;
            }

            const data = loadedItemsMapRef.current.get(id);
            if (!data) {
              notFoundIds.push(id);
              return null;
            }

            const { actual_rfid_tag_epc_memory_bank_contents } = data;
            if (!actual_rfid_tag_epc_memory_bank_contents) {
              return null;
            }

            return [actual_rfid_tag_epc_memory_bank_contents, id];
          })
          .filter((e): e is [string, string] => !!e),
      ),
    };
    if (notFoundIds.length > 0) {
      Alert.alert(
        'Internal Error',
        `CheckItems: cannot find id(s) ${notFoundIds.join(
          ', ',
        )} in loadedItemsMapRef.current, this component expects loadedItemsMapRef.current being fully initialized on its render.`,
      );
    }
    return object;
  }, [topLevelItems, itemIdDedicatedContainerIdMap, loadedItemsMapRef]);

  /**
   * All IDs that should be check, including sub-items.
   * For items that have sub-items, `${id}-all` means "all of the sub-items"
   * and `${id}-some` means "some of the sub-items".
   */
  const allIds = useMemo(() => {
    return [
      ...topLevelItems.map(it => it.__id),
      ...Object.keys(itemIdDedicatedContainerIdMap),
    ]
      .filter((s): s is string => !!s)
      .flatMap(id => {
        if (!dedicatedIdsMap[id]) return [id];

        return [id, `${id}-all`, `${id}-some`];
      });
  }, [topLevelItems, dedicatedIdsMap, itemIdDedicatedContainerIdMap]);

  /** A set of manually checked item IDs */
  const [manuallyCheckedIds, setManuallyCheckedIds] = useState({
    value: resultManuallyCheckedIdsRef?.current || new Set<string>(),
  });
  if (resultManuallyCheckedIdsRef)
    resultManuallyCheckedIdsRef.current = manuallyCheckedIds.value;

  /**
   * Function that returns a initial object of sets that will record not-seen
   * dedicated items of a item.
   */
  const getNotSeenDedicatedItemIds = useCallback(() => {
    return Object.fromEntries(
      Object.keys(dedicatedIdsMap).map(id => {
        const set = new Set(dedicatedIdsMap[id]);
        set.add(id);
        return [id, set];
      }),
    );
  }, [dedicatedIdsMap]);
  /**
   * A set that logs EPCs that has already been seen. Used to reduce duplicated
   * work on each render, but might cause bugs if an EPC has been added to the
   * set but have not been process correctly since it will not have a second
   * chance to be processed.
   */
  const [seenEpcs, setSeenEpcs] = useState<Set<string>>(() => new Set());
  /**
   * A set that stores all not seen item IDs, including sub-items.
   * For items that have sub-items, `${id}-all` means
   * "all of the sub-items are not seen" and `${id}-some` means
   * "some of the sub-items are not seen".
   */
  const [notSeenItemIds, setNotSeenItemIds] = useState<Set<string>>(
    () => new Set(allIds),
  );
  const notSeenItemIdsRef = useRef<null | Set<string>>(null);
  notSeenItemIdsRef.current = notSeenItemIds;
  /**
   * Because the Set in the state will remain the same instance, updating it
   * will not trigger re-render, so here is a counter that will actual trigger
   * re-renders.
   */
  const [notSeenItemIdsChangeCounter, setNotSeenItemIdsChangeCounter] =
    useState(0);
  /** For UI reorder animation */
  const [delayedNotSeenItemIds, setDelayedNotSeenItemIds] = useState<
    Set<string>
  >(() => new Set(allIds));
  /**
   * Because the Set in the state will remain the same instance, updating it
   * will not trigger re-render, so here is a counter that will actual trigger
   * re-renders.
   */
  const [
    delayedNotSeenItemIdsChangeCounter,
    setDelayedNotSeenItemIdsChangeCounter,
  ] = useState(0);
  /** Internal state to see if an item has any not seen sub-items. */
  const [notSeenDedicatedItemIds, setNotSeenDedicatedItemIds] = useState<
    Record<string, Set<string>>
  >(getNotSeenDedicatedItemIds);

  /** Process newly seen EPCs */
  const prevManuallyCheckedItems = useRef(new Set());
  useEffect(() => {
    const newEpcs = Object.keys(scannedItems).filter(epc => !seenEpcs.has(epc));
    newEpcs.forEach(epc => seenEpcs.add(epc));

    const idsToRemoveFromNotSeenIds: string[] = [];

    newEpcs.forEach(epc => {
      const itemId = epcItemIdMap[epc];
      if (!itemId) return;

      if (resultSeenIdsRef) {
        if (!resultSeenIdsRef.current) {
          resultSeenIdsRef.current = new Set();
        }

        resultSeenIdsRef.current.add(itemId);
      }

      if (manuallyCheckedIds.value.has(itemId)) {
        // Already set as seen by manuallyCheckedIds, just need to remove from manuallyCheckedIds
        manuallyCheckedIds.value.delete(itemId); // Set directly to prevent infinite loop
      } else {
        setItemIdAsSeen(itemId);
      }
    });

    const newManuallyCheckedIds = [...manuallyCheckedIds.value].filter(
      id => !prevManuallyCheckedItems.current.has(id),
    );
    newManuallyCheckedIds.forEach(itemId => {
      prevManuallyCheckedItems.current.add(itemId);
      setItemIdAsSeen(itemId);
    });

    function setItemIdAsSeen(itemId: string) {
      idsToRemoveFromNotSeenIds.push(itemId);
      // Assume that this item is a container, at least itself is now seen,
      // so not all of it has not been seen now.
      idsToRemoveFromNotSeenIds.push(`${itemId}-all`);

      // If the item is a container, we need to remove itself from
      // it's not-seen sub-items set.
      if (notSeenDedicatedItemIds[itemId]) {
        notSeenDedicatedItemIds[itemId].delete(itemId);

        // If the now-seen item container itself is the last not-seen sub-item,
        // then all of it's sub-items has been seen now.
        if (notSeenDedicatedItemIds[itemId].size <= 0) {
          idsToRemoveFromNotSeenIds.push(`${itemId}-some`);
        }
      }

      // More things to do if the item has a dedicated container...
      const dedicatedContainerId = itemIdDedicatedContainerIdMap[itemId];
      if (!dedicatedContainerId) return;

      // Set all parent containers as "at least one item seen"
      let containerId: string | undefined = dedicatedContainerId;
      while (containerId) {
        idsToRemoveFromNotSeenIds.push(`${containerId}-all`);
        containerId = itemIdDedicatedContainerIdMap[containerId];
      }

      // Check all parent containers and see if they have all items seen now.
      containerId = dedicatedContainerId;
      let selfId = itemId;
      while (containerId) {
        if (
          notSeenDedicatedItemIds[selfId] &&
          notSeenDedicatedItemIds[selfId].size > 0
        ) {
          // Self is not cleared, stop marking parent as cleared
          break;
        }

        // If has dedicated container, remove self item from dedicated container's
        // not-seen IDs set.
        if (notSeenDedicatedItemIds[containerId]) {
          notSeenDedicatedItemIds[containerId].delete(selfId);
          if (notSeenDedicatedItemIds[containerId].size <= 0) {
            idsToRemoveFromNotSeenIds.push(`${containerId}-some`);
          }
        }

        selfId = containerId;
        containerId = itemIdDedicatedContainerIdMap[containerId];
      }
    } // End of function setItemIdAsSeen

    // Now, update the state if there's anything needed to be updated.
    if (idsToRemoveFromNotSeenIds.length > 0) {
      // A general updater, since we need to update both `notSeenItemIds`
      // and `delayedNotSeenItemIds`
      const updateStateWith = (
        setStateFn: (value: React.SetStateAction<Set<string>>) => void,
        setStateChangeCounterFn: (value: React.SetStateAction<number>) => void,
      ) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setStateFn(s => {
          for (const id of idsToRemoveFromNotSeenIds) {
            s.delete(id);
          }
          return s;
        });
        setStateChangeCounterFn(v => v + 1);
      };

      // Change notSeenItemIds immediately
      updateStateWith(setNotSeenItemIds, setNotSeenItemIdsChangeCounter);

      // Change delayedNotSeenItemIds after some delay
      setTimeout(
        () => {
          updateStateWith(
            setDelayedNotSeenItemIds,
            setDelayedNotSeenItemIdsChangeCounter,
          );
        },
        notSeenItemIdsChangeCounter === 0 ? 0 : UI_REORDER_ANIMATION_DELAY,
      );
    }
  }, [
    epcItemIdMap,
    itemIdDedicatedContainerIdMap,
    manuallyCheckedIds,
    notSeenDedicatedItemIds,
    notSeenItemIds,
    notSeenItemIdsChangeCounter,
    resultSeenIdsRef,
    scannedItems,
    seenEpcs,
  ]);

  const [forceExpandedItems, setForceExpandedItems] = useState({
    value: new Set<string>(),
  } as const);
  const forceExpandedItemsRef = useRef<{ value: Set<string> } | null>(null);
  forceExpandedItemsRef.current = forceExpandedItems;

  /** Handle reset */
  const prevClearScannedDataCounter = useRef(clearScannedDataCounter);
  useEffect(() => {
    if (prevClearScannedDataCounter.current === clearScannedDataCounter) return;

    prevClearScannedDataCounter.current = clearScannedDataCounter;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSeenEpcs(new Set());
    setNotSeenItemIds(new Set(allIds));
    setDelayedNotSeenItemIds(new Set(allIds));
    setDelayedNotSeenItemIdsChangeCounter(v => v + 1);
    setNotSeenDedicatedItemIds(getNotSeenDedicatedItemIds);
    setManuallyCheckedIds({ value: new Set() });
    prevManuallyCheckedItems.current = new Set();
    setForceExpandedItems({ value: new Set() });

    if (resultSeenIdsRef) resultSeenIdsRef.current = new Set();
  }, [
    scannedItems,
    allIds,
    getNotSeenDedicatedItemIds,
    resultSeenIdsRef,
    clearScannedDataCounter,
  ]);

  /** Re-order items by there status */
  const itemsToRender = useMemo(() => {
    // `delayedNotSeenItemIdsChange` is used here to give the re-order some delay
    delayedNotSeenItemIdsChangeCounter;

    const seenItems: Array<DataTypeWithAdditionalInfo<'item'>> = [];
    const partiallySeenItems: Array<DataTypeWithAdditionalInfo<'item'>> = [];
    const notSeenItems: Array<DataTypeWithAdditionalInfo<'item'>> = [];

    for (const it of topLevelItems) {
      if (!it.__id) continue;
      const selfNotSeen = delayedNotSeenItemIds.has(it.__id);
      const allNotSeen = delayedNotSeenItemIds.has(`${it.__id}-all`);
      let someNotSeen = delayedNotSeenItemIds.has(`${it.__id}-some`);

      if (someNotSeen) {
        if (!allNotSeen) {
          partiallySeenItems.push(it);
          continue;
        }
        notSeenItems.push(it);
        continue;
      } else {
        if (selfNotSeen) {
          notSeenItems.push(it);
          continue;
        }
        seenItems.push(it);
        continue;
      }
    }

    return [
      // Order
      ...partiallySeenItems,
      ...notSeenItems,
      ...seenItems,
    ];
  }, [
    delayedNotSeenItemIdsChangeCounter,
    delayedNotSeenItemIds,
    topLevelItems,
  ]);

  const checkedTopLevelItemsCount = useMemo(() => {
    notSeenItemIdsChangeCounter;
    return (topLevelItems || []).filter(
      it =>
        !notSeenItemIds.has(it.__id || '') &&
        !notSeenItemIds.has(`${it.__id}-some`),
    ).length;
  }, [topLevelItems, notSeenItemIds, notSeenItemIdsChangeCounter]);

  const handleItemPress = useCallback(
    (itemId: string) => {
      const canMarkAsChecked =
        notSeenItemIdsRef.current && notSeenItemIdsRef.current.has(itemId);
      const partiallySeen =
        notSeenItemIdsRef.current &&
        notSeenItemIdsRef.current.has(`${itemId}-some`) &&
        !notSeenItemIdsRef.current.has(`${itemId}-all`);
      const canExpand = !!dedicatedIdsMap[itemId] && !partiallySeen;
      const expanded = forceExpandedItemsRef.current?.value?.has(itemId);
      const options = [
        canMarkAsChecked && 'mark-as-checked',
        canExpand && 'toggle-expand',
        'view-item',
      ].filter((s): s is string => !!s);
      const optionNames: Record<string, string> = {
        'view-item': 'View item',
        'toggle-expand': expanded ? 'Hide contents' : 'Show contents',
        'mark-as-checked': 'Mark as checked',
      };
      const shownOptions = options.map(v => optionNames[v]);
      showActionSheetWithOptions(
        {
          options: [...shownOptions, 'Cancel'],
          ...(canMarkAsChecked ? { destructiveButtonIndex: 0 } : {}),
          cancelButtonIndex: shownOptions.length,
        },
        buttonIndex => {
          if (buttonIndex === shownOptions.length) {
            // cancel action
            return;
          }

          const selectedOption =
            typeof buttonIndex === 'number' ? options[buttonIndex] : null;
          switch (selectedOption) {
            case 'view-item':
              onViewItemPress(itemId);
              return;
            case 'mark-as-checked':
              setManuallyCheckedIds(({ value }) => {
                value.add(itemId);
                return { value };
              });
              return;
            case 'toggle-expand':
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              );
              if (expanded) {
                setForceExpandedItems(({ value }) => {
                  value.delete(itemId);
                  return { value };
                });
              } else {
                setForceExpandedItems(({ value }) => {
                  value.add(itemId);
                  return { value };
                });
              }
              return;
            default:
              Alert.alert('TODO', `${selectedOption} is not implemented yet.`);
              return;
          }
        },
      );
    },
    [dedicatedIdsMap, onViewItemPress, showActionSheetWithOptions],
  );
  const getItemPressHandler = useMemo(() => {
    const cachedHandlers: Record<string, () => void> = {};

    return (itemId: string) => {
      if (cachedHandlers[itemId]) return cachedHandlers[itemId];

      cachedHandlers[itemId] = () => handleItemPress(itemId);
      return cachedHandlers[itemId];
    };
  }, [handleItemPress]);

  return (
    <>
      <InsetGroup
        label={`${checkedTopLevelItemsCount}/${topLevelItems?.length} Items Checked`}
        style={{ backgroundColor: contentBackgroundColor }}
      >
        {itemsToRender
          .flatMap(it => {
            const scannedData =
              scannedItems[it.actual_rfid_tag_epc_memory_bank_contents || ''];
            const partiallySeen =
              notSeenItemIds.has(`${it.__id}-some`) &&
              !notSeenItemIds.has(`${it.__id}-all`);
            const showDedicatedItems =
              partiallySeen || forceExpandedItems.value.has(it.__id || '');

            const checkStatus = (() => {
              if (!it.actual_rfid_tag_epc_memory_bank_contents) {
                if (manuallyCheckedIds.value.has(it.__id || '')) {
                  return 'manually-checked';
                }

                return 'no-rfid-tag';
              }

              if (
                !notSeenItemIds.has(it.__id || '') &&
                !notSeenItemIds.has(`${it.__id}-some`)
              ) {
                if (manuallyCheckedIds.value.has(it.__id || '')) {
                  return 'manually-checked';
                }

                return 'checked';
              }

              if (partiallySeen) {
                return 'partially-checked';
              }

              // if (scannedData) {
              //   return 'checked';
              // }

              if (manuallyCheckedIds.value.has(it.__id || '')) {
                return 'manually-checked';
              }

              return 'unchecked';
            })();

            return [
              <React.Fragment key={it.__id}>
                <ItemListItem
                  key={it.__id}
                  item={it}
                  onPress={getItemPressHandler(it.__id || '')}
                  onLongPress={getItemPressHandler(it.__id || '')}
                  hideContainerDetails
                  hideCollectionDetails
                  checkStatus={checkStatus}
                  grayOut={!scannedData && !partiallySeen}
                  additionalDetails={
                    scannedData?.rssi ? `RSSI: ${scannedData.rssi}` : undefined
                  }
                  navigable={false}
                />
                {showDedicatedItems && (
                  <View
                    style={styles.itemDedicatedItemsContainer}
                    key={`${it.__id}-di`}
                  >
                    {(dedicatedIdsMap[it.__id || ''] || []).flatMap(dId => [
                      <InsetGroup.ItemSeparator
                        leftInset={25}
                        key={`s-${dId}`}
                      />,
                      <DedicatedCheckItem
                        key={dId}
                        id={dId}
                        getItemPressHandler={getItemPressHandler}
                        scannedItems={scannedItems}
                        notSeenItemIds={notSeenItemIds}
                        delayedNotSeenItemIds={delayedNotSeenItemIds}
                        dedicatedIdsMap={dedicatedIdsMap}
                        loadedItemsMapRef={loadedItemsMapRef}
                        manuallyCheckedIds={manuallyCheckedIds}
                        forceExpandedItems={forceExpandedItems}
                      />,
                    ])}
                  </View>
                )}
              </React.Fragment>,
              <InsetGroup.ItemSeparator key={`s-${it.__id}`} leftInset={60} />,
            ];
          })
          .slice(0, -1)}
      </InsetGroup>
    </>
  );
}

function DedicatedCheckItem({
  id,
  scannedItems,
  notSeenItemIds,
  delayedNotSeenItemIds,
  dedicatedIdsMap,
  loadedItemsMapRef,
  manuallyCheckedIds,
  forceExpandedItems,
  getItemPressHandler,
}: {
  id: string;
  scannedItems: Record<string, ScanData>;
  notSeenItemIds: Set<string>;
  delayedNotSeenItemIds: Set<string>;
  dedicatedIdsMap: Record<string, Array<string>>;
  loadedItemsMapRef: React.MutableRefObject<Map<
    string,
    DataTypeWithAdditionalInfo<'item'>
  > | null>;
  manuallyCheckedIds: { value: Set<string> };
  forceExpandedItems: { value: Set<string> };
  getItemPressHandler: (itemId: string) => () => void;
}) {
  const { contentTextColor } = useColors();
  const item = loadedItemsMapRef.current?.get(id);
  if (!item) return null;

  const scannedData =
    scannedItems[item.actual_rfid_tag_epc_memory_bank_contents || ''];
  const partiallySeen =
    notSeenItemIds.has(`${id}-some`) && !notSeenItemIds.has(`${id}-all`);
  const showDedicatedItems = partiallySeen || forceExpandedItems.value.has(id);

  const dedicatedIds = dedicatedIdsMap[id];

  return (
    <>
      <TouchableHighlight
        activeOpacity={1}
        underlayColor={Color(contentTextColor).opaquer(-0.92).hexa()}
        onPress={getItemPressHandler(id)}
      >
        <View style={styles.dedicatedCheckItemContainer}>
          <DedicatedCheckItemIcon
            status={(() => {
              if (!item.actual_rfid_tag_epc_memory_bank_contents) {
                if (manuallyCheckedIds.value.has(id)) {
                  return 'manually-checked';
                }

                return 'no-rfid-tag';
              }

              if (
                !notSeenItemIds.has(id) &&
                !notSeenItemIds.has(`${id}-some`)
              ) {
                if (manuallyCheckedIds.value.has(id || '')) {
                  return 'manually-checked';
                }

                return 'checked';
              }

              if (partiallySeen) {
                return 'partially-checked';
              }

              // if (scannedData) {
              //   return 'checked';
              // }

              if (manuallyCheckedIds.value.has(id)) {
                return 'manually-checked';
              }

              return 'unchecked';
            })()}
          />
          <Text style={commonStyles.flex1} numberOfLines={2}>
            {item.name}
          </Text>
        </View>
      </TouchableHighlight>
      {showDedicatedItems && dedicatedIds && (
        <View style={styles.dedicatedCheckItemChildrenContainer}>
          {dedicatedIds.flatMap((dId, i) => [
            <InsetGroup.ItemSeparator
              key={`s-${dId}`}
              leftInset={i === 0 ? 8 : 25}
            />,
            <DedicatedCheckItem
              key={dId}
              id={dId}
              getItemPressHandler={getItemPressHandler}
              scannedItems={scannedItems}
              notSeenItemIds={notSeenItemIds}
              delayedNotSeenItemIds={delayedNotSeenItemIds}
              dedicatedIdsMap={dedicatedIdsMap}
              loadedItemsMapRef={loadedItemsMapRef}
              manuallyCheckedIds={manuallyCheckedIds}
              forceExpandedItems={forceExpandedItems}
            />,
          ])}
        </View>
      )}
    </>
  );
}

function DedicatedCheckItemIcon({
  status,
}: {
  status:
    | 'checked'
    | 'unchecked'
    | 'partially-checked'
    | 'manually-checked'
    | 'no-rfid-tag';
}) {
  const { green, gray, yellow } = useColors();

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.dedicatedCheckItemIconContainer}>
        {(() => {
          switch (status) {
            case 'checked':
            case 'manually-checked':
              return (
                <SFSymbol
                  name="checkmark.circle.fill"
                  scale="small"
                  color={status === 'checked' ? green : gray}
                  size={16}
                />
              );

            case 'partially-checked':
              return (
                <SFSymbol
                  name="ellipsis"
                  scale="small"
                  color={yellow}
                  size={16}
                />
              );

            case 'no-rfid-tag':
              return (
                <SFSymbol
                  name="antenna.radiowaves.left.and.right.slash"
                  scale="small"
                  color={gray}
                  size={16}
                />
              );

            default:
              return (
                <SFSymbol
                  name="questionmark"
                  scale="small"
                  color={gray}
                  size={16}
                />
              );
          }
        })()}
      </View>
    );
  }

  return (
    <View style={styles.dedicatedCheckItemIconContainer}>
      {(() => {
        switch (status) {
          case 'checked':
          case 'manually-checked':
            return (
              <MaterialCommunityIcon
                name="check-circle"
                color={status === 'checked' ? green : gray}
                size={16}
              />
            );
          case 'partially-checked':
            return (
              <MaterialCommunityIcon
                name="dots-horizontal-circle"
                color={yellow}
                size={16}
              />
            );

          case 'unchecked':
            return (
              <MaterialCommunityIcon
                name="progress-question"
                color={gray}
                size={16}
              />
            );

          case 'no-rfid-tag':
            return (
              <MaterialCommunityIcon
                name="access-point-off"
                color={gray}
                size={16}
              />
            );
        }
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  itemDedicatedItemsContainer: { paddingLeft: 60 },
  dedicatedCheckItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingBottom: 3,
    overflow: 'hidden',
    paddingRight: InsetGroup.ITEM_PADDING_HORIZONTAL,
  },
  dedicatedCheckItemChildrenContainer: {
    paddingLeft: 16,
  },
  dedicatedCheckItemIconContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
    marginLeft: 4,
  },
});
