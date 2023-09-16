import React, { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { jsonToCSV } from 'react-native-csv';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import { DataTypeWithAdditionalInfo, onlyValid } from '@app/data';
import getData from '@app/data/functions/getData';
import getDatum from '@app/data/functions/getDatum';

import commonStyles from '@app/utils/commonStyles';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useDB from '@app/hooks/useDB';
import useLogger from '@app/hooks/useLogger';
import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

import getChildrenItemIds from '../utils/getChildrenItemIds';
import itemToCsvRow from '../utils/itemToCsvRow';

function ExportItemsToCsvScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'ExportItemsToCsv'>) {
  const { db } = useDB();
  const logger = useLogger('ExportItemsToCsvScreen');

  const [exportFrom, setExportFrom] = useState<any>(null);
  const [fromId, setFromId] = useState<any>(null);

  const handleOpenSelectCollection = useCallback(() => {
    navigation.navigate('SelectCollection', {
      defaultValue: undefined,
      callback: collection => {
        setExportFrom('collection');
        setFromId(collection);
      },
    });
  }, [navigation]);

  const handleOpenSelectContainer = useCallback(() => {
    navigation.navigate('SelectItem', {
      as: 'container',
      defaultValue: undefined,
      callback: dedicatedContainer => {
        setExportFrom('container');
        setFromId(dedicatedContainer);
      },
    });
  }, [navigation]);

  const [loading, setLoading] = useState(false);
  const handleExport = useCallback(async () => {
    if (!db) return;
    if (!exportFrom) return;
    setExportFrom(null);
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      let items: DataTypeWithAdditionalInfo<'item'>[] = [];
      switch (exportFrom) {
        case 'collection': {
          const collection = await getDatum('collection', fromId, {
            db,
            logger,
          });
          const data = onlyValid(
            await getData(
              'item',
              { collection_id: fromId },
              { sort: [{ __created_at: 'desc' }] },
              { db, logger },
            ),
          );
          const dataMap: Record<
            string,
            DataTypeWithAdditionalInfo<'item'>
          > = Object.fromEntries(data.map(d => [d.__id, d]));

          const order = Array.isArray(collection?.items_order)
            ? collection?.items_order || []
            : [];
          const explicitlyOrderedData = order
            .map((id: string) => {
              const d = dataMap[id];
              return d;
            })
            .filter((v): v is NonNullable<typeof v> => !!v);
          const notExplicitlyOrderedData = data.filter(
            d => !order.includes(d.__id || ''),
          );

          items = [...explicitlyOrderedData, ...notExplicitlyOrderedData];
          break;
        }
        case 'container': {
          const idsObj = await getChildrenItemIds([fromId], { db });

          const flattenIdsObj = (
            idsObj_: typeof idsObj,
            key: string,
            result: string[] = [],
          ): string[] => {
            // Add the current key to the result array
            result.push(key);

            // Check if the key exists in the tree object, then loop through its children
            if (idsObj_[key]) {
              for (const child of idsObj_[key]) {
                flattenIdsObj(idsObj_, child, result);
              }
            }

            return result;
          };
          const ids = flattenIdsObj(idsObj, fromId);
          items = onlyValid(await getData('item', ids, {}, { db, logger }));
          break;
        }

        case 'all': {
          items = onlyValid(
            await getData(
              'item',
              {},
              { sort: [{ __created_at: 'desc' }] },
              { db, logger },
            ),
          );
          break;
        }

        default:
          throw new Error(`Unknown export source: ${exportFrom}`);
      }

      const loadedCollectionsMap = new Map();
      const data = await Promise.all(
        items.map(item => itemToCsvRow(item, { db, loadedCollectionsMap })),
      );
      const csv = jsonToCSV(data, { quotes: true });
      const csvFileName = (() => {
        if (exportFrom === 'all') {
          return 'exported_items.csv';
        }
        return `exported_items_${exportFrom}_${fromId}.csv`;
      })();
      const csvFilePath = `${RNFS.TemporaryDirectoryPath}/${csvFileName}`;
      await RNFS.writeFile(csvFilePath, csv, 'utf8');

      Share.open({
        url: csvFilePath,
        failOnCancel: false,
      });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 100);
    }
  }, [db, exportFrom, fromId, logger]);
  const handleExportRef = useRef(handleExport);
  handleExportRef.current = handleExport;

  useFocusEffect(() => {
    handleExportRef.current();
  });

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  return (
    <ModalContent navigation={navigation} title="CSV Export">
      <ModalContent.ScrollView ref={scrollViewRef}>
        <View style={commonStyles.mt32} />

        <UIGroup
          footer="Exports all items in the selected collection."
          loading={loading}
        >
          <UIGroup.ListItem
            button
            label="Export Items from Collection"
            onPress={handleOpenSelectCollection}
          />
        </UIGroup>

        <UIGroup
          footer="Exports all dedicated items in the selected container."
          loading={loading}
        >
          <UIGroup.ListItem
            button
            label="Export Items from Container"
            onPress={handleOpenSelectContainer}
          />
        </UIGroup>

        <UIGroup footer="Exports all items in database." loading={loading}>
          <UIGroup.ListItem
            button
            label="Export All Items"
            onPress={() => {
              setFromId('items');
              setExportFrom('all');
            }}
          />
        </UIGroup>
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default ExportItemsToCsvScreen;
