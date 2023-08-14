import React, { useCallback, useEffect, useRef } from 'react';
import { StackScreenProps } from '@react-navigation/stack';

import { RenderScannedItemsFn } from '@app/features/rfid/RFIDSheet';

import { DataTypeWithAdditionalInfo } from '@app/data';

import { StackParamList } from '@app/navigation/MainStack';
import { useRootBottomSheets } from '@app/navigation/RootBottomSheetsContext';

import useActionSheet from '@app/hooks/useActionSheet';
import useDB from '@app/hooks/useDB';

import CheckItems from '../components/CheckItems';
import getChildrenDedicatedItemIds from '../utils/getChildrenDedicatedItemIds';

export default function useCheckItems({
  scanName,
  items,
  navigation,
}: {
  scanName: string;
  items: ReadonlyArray<DataTypeWithAdditionalInfo<'item'>>;
  navigation: StackScreenProps<StackParamList>['navigation'];
}) {
  const { db } = useDB();
  const { openRfidSheet, rfidSheet } = useRootBottomSheets();
  const { showActionSheetWithOptions } = useActionSheet();

  const renderCheckContentsScannedItemsRef =
    useRef<RenderScannedItemsFn | null>(null);
  const checkContentsLoadedItemsMapRef = useRef<null | Map<
    string,
    DataTypeWithAdditionalInfo<'item'>
  >>(null);
  const dedicatedIdsMapRef = useRef<null | Record<string, Array<string>>>(null);
  const loadChildrenDedicatedItemIdsPromiseRef = useRef<null | Promise<any>>(
    null,
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
    // Data will be loaded via useEffect but we need to wait until it's ready
    if (loadChildrenDedicatedItemIdsPromiseRef.current) {
      await loadChildrenDedicatedItemIdsPromiseRef.current;
    }
    const epcs = [
      ...(items || []),
      ...Array.from(checkContentsLoadedItemsMapRef.current?.values() || []),
    ]
      .map(it => it.actual_rfid_tag_epc_memory_bank_contents)
      .filter((epc): epc is string => !!epc);
    console.log('epcs', epcs);
    const filterData = sharedStart(epcs);
    const filterOption = filterData
      ? {
          memoryBank: 'EPC' as const,
          bitOffset: 32,
          bitCount: (filterData.length || 0) * 4,
          data: filterData || '',
        }
      : undefined;
    console.log('filterOption', filterOption);
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
  }, [
    items,
    handleCheckContentsDone,
    scanName,
    openRfidSheet,
    // showActionSheetWithOptions,
  ]);
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
  useEffect(() => {
    if (items.length <= 0) return;

    if (!db) throw new Error('DB is not ready!');

    if (!checkContentsLoadedItemsMapRef.current)
      checkContentsLoadedItemsMapRef.current = new Map();
    loadChildrenDedicatedItemIdsPromiseRef.current = new Promise<void>(
      resolve => {
        setTimeout(() => {
          resolve();
        }, 100);
      },
    )
      .then(() =>
        getChildrenDedicatedItemIds(
          db,
          (items || [])
            .filter(it => it._can_contain_items)
            .map(it => it.__id || ''),
          checkContentsLoadedItemsMapRef,
        ),
      )
      .then(obj => (dedicatedIdsMapRef.current = obj));
  }, [db, items]);

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
