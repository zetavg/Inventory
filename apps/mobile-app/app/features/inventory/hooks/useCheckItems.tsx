import React, { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';

import { RenderScannedItemsFn } from '@app/features/rfid/RFIDSheet';

import { DataTypeWithID } from '@app/data';

import { StackParamList } from '@app/navigation/MainStack';
import { useRootBottomSheets } from '@app/navigation/RootBottomSheetsContext';

import useActionSheet from '@app/hooks/useActionSheet';
import useDB from '@app/hooks/useDB';

import CheckItems from '../components/CheckItems';
import getChildrenItemIds from '../utils/getChildrenItemIds';

export default function useCheckItems({
  scanName,
  items,
  navigation,
}: {
  scanName: string;
  items: ReadonlyArray<DataTypeWithID<'item'>>;
  navigation: StackScreenProps<StackParamList>['navigation'];
}) {
  const { db } = useDB();
  const { openRfidSheet, rfidSheet } = useRootBottomSheets();
  const { showActionSheetWithOptions } = useActionSheet();

  const renderCheckContentsScannedItemsRef =
    useRef<RenderScannedItemsFn | null>(null);
  const checkContentsLoadedItemsMapRef = useRef<null | Map<
    string,
    DataTypeWithID<'item'>
  >>(null);
  const dedicatedIdsMapRef = useRef<null | Record<string, Array<string>>>(null);
  useFocusEffect(
    useCallback(() => {
      checkContentsLoadedItemsMapRef.current = null;
      dedicatedIdsMapRef.current = null;
    }, []),
  );

  const checkContentsResultSeenIdsRef = useRef<Set<string> | null>(null);
  const checkContentsResultManuallyCheckedIdsRef = useRef<Set<string> | null>(
    null,
  );
  const checkContentsResultSaved = useRef(false);
  const handleCheckContentsDone = useCallback(() => {
    console.warn(
      'Check results',
      JSON.stringify(
        {
          seen: [...(checkContentsResultSeenIdsRef.current || [])],
          manuallyChecked: [
            ...(checkContentsResultManuallyCheckedIdsRef.current || []),
          ],
        },
        null,
        2,
      ),
    );
    checkContentsResultSaved.current = true;
  }, []);
  const ignoreNextCheckContentsRfidSheetClose = useRef(false);
  const checkItems = useCallback(async () => {
    if (!db) return;

    if (!checkContentsLoadedItemsMapRef.current) {
      checkContentsLoadedItemsMapRef.current = new Map();
      await Promise.resolve()
        .then(() =>
          getChildrenItemIds(
            (items || [])
              .filter(it => it._can_contain_items)
              .map(it => it.__id || ''),
            { db, loadedItemsMapRef: checkContentsLoadedItemsMapRef },
          ),
        )
        .then(obj => (dedicatedIdsMapRef.current = obj));
    }

    const epcs = [
      ...new Set(
        [
          ...(items || []),
          ...Array.from(checkContentsLoadedItemsMapRef.current?.values() || []),
        ]
          .map(it => it.actual_rfid_tag_epc_memory_bank_contents)
          .filter((epcHex): epcHex is string => !!epcHex),
      ),
    ];
    // console.log('epcs', epcs.length, epcs);
    const filterData = sharedStart(epcs);
    const filterOption = filterData
      ? {
          memoryBank: 'EPC' as const,
          bitOffset: 32,
          bitCount: (filterData.length || 0) * 4,
          data: filterData || '',
        }
      : undefined;
    // console.log('filterOption', filterOption);
    openRfidSheet({
      functionality: 'scan' as const,
      scanName,
      resetData: checkContentsResultSaved.current,
      renderScannedItemsRef: renderCheckContentsScannedItemsRef,
      useDefaultFilter: false,
      playSoundOnlyForEpcs: epcs,
      filterOption,
      onDone: handleCheckContentsDone,
      onClose: () => {
        if (ignoreNextCheckContentsRfidSheetClose.current) {
          ignoreNextCheckContentsRfidSheetClose.current = false;
          return;
        }
        if (
          (checkContentsResultSeenIdsRef.current?.size || 0) <= 0 &&
          (checkContentsResultManuallyCheckedIdsRef.current?.size || 0) <= 0
        ) {
          return;
        }

        // showActionSheetWithOptions(
        //   {
        //     title: 'Save the check results?',
        //     // message: 'Save?',
        //     options: ['Save', 'Do not save'],
        //     cancelButtonIndex: 1,
        //   },
        //   buttonIndex => {
        //     if (buttonIndex === 1) {
        //       // cancel action
        //       return;
        //     }

        //     handleCheckContentsDone();
        //   },
        // );
      },
    });
    checkContentsResultSaved.current = false;
  }, [db, items, openRfidSheet, scanName, handleCheckContentsDone]);
  const handleCheckItemsOnViewItemPress = useCallback(
    (itemId: string) => {
      ignoreNextCheckContentsRfidSheetClose.current = true;
      rfidSheet.current?.close();
      navigation.push('Item', {
        id: itemId,
        ...({ beforeRemove: checkItems } as any),
      });
    },
    [navigation, rfidSheet, checkItems],
  );
  renderCheckContentsScannedItemsRef.current =
    useCallback<RenderScannedItemsFn>(
      (its, { contentBackgroundColor, clearScannedDataCounter }) => {
        return (
          <CheckItems
            items={items || []}
            scannedItems={its}
            contentBackgroundColor={contentBackgroundColor}
            dedicatedIdsMap={dedicatedIdsMapRef.current || {}}
            loadedItemsMapRef={checkContentsLoadedItemsMapRef}
            onViewItemPress={handleCheckItemsOnViewItemPress}
            resultSeenIdsRef={checkContentsResultSeenIdsRef}
            resultManuallyCheckedIdsRef={
              checkContentsResultManuallyCheckedIdsRef
            }
            clearScannedDataCounter={clearScannedDataCounter}
          />
        );
      },
      [handleCheckItemsOnViewItemPress, items],
    );

  return [checkItems];
}

function sharedStart(array: ReadonlyArray<string>): string {
  if (array.length <= 0) return '';
  var a = array.concat().sort(),
    a1 = a[0],
    a2 = a[a.length - 1],
    L = a1.length,
    i = 0;
  while (i < L && a1.charAt(i) === a2.charAt(i)) i++;
  return a1.substring(0, i);
}
