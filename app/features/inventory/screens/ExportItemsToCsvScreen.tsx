import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, View, Alert } from 'react-native';
import { jsonToCSV } from 'react-native-csv';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';
import { useFocusEffect } from '@react-navigation/native';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import commonStyles from '@app/utils/commonStyles';
import ModalContent from '@app/components/ModalContent';
import LoadingOverlay from '@app/components/LoadingOverlay';
import InsetGroup from '@app/components/InsetGroup';

import useDB from '@app/hooks/useDB';
import { getDataFromDocs } from '@app/db/hooks';

import { getItemPropertyNameMap } from './ImportItemsFromCsvScreen';

function ExportItemsToCsvScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'ExportItemsToCsv'>) {
  const { db } = useDB();

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
    navigation.navigate('SelectContainer', {
      defaultValue: undefined,
      callback: dedicatedContainer => {
        setExportFrom('container');
        setFromId(dedicatedContainer);
      },
    });
  }, [navigation]);

  const [loading, setLoading] = useState(false);
  const handleExport = useCallback(async () => {
    if (!exportFrom) return;
    setExportFrom(null);
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      let items = [];
      switch (exportFrom) {
        case 'collection':
        case 'container': {
          const queryInverse = (() => {
            switch (exportFrom) {
              case 'collection':
                return 'collection';
              case 'container':
                return 'dedicatedContainer';
            }
          })();

          const use_index = `index-item-${queryInverse}`;
          const query = {
            selector: {
              $and: [
                { type: 'item' },
                { [`data.${queryInverse}`]: fromId },
                // { ['data.updatedAt']: { $exists: true } },
              ],
            },
            // sort: [
            //   { type: 'desc' as const },
            //   { [`data.${queryInverse}`]: 'desc' as const },
            //   { ['data.updatedAt']: 'desc' },
            // ],
            use_index,
          };
          try {
            const { docs } = await db.find(query as any);
            items = getDataFromDocs('item', docs);
          } catch (e: any) {
            e.message = `Error finding documents using index ${use_index}: ${
              e.message
            } Query: ${JSON.stringify(query, null, 2)}.`;
            throw e;
          }

          break;
        }

        case 'all': {
          const use_index = 'index-item-collection';
          const query = {
            selector: {
              $and: [
                { type: 'item' },
                // { ['data.updatedAt']: { $exists: true } },
              ],
            },
            // sort: [
            //   { type: 'desc' as const },
            //   { ['data.updatedAt']: 'desc' },
            // ],
            use_index,
          };
          try {
            const { docs } = await db.find(query as any);
            items = getDataFromDocs('item', docs);
          } catch (e: any) {
            e.message = `Error finding documents using index ${use_index}: ${
              e.message
            } Query: ${JSON.stringify(query, null, 2)}.`;
            throw e;
          }

          break;
        }

        default:
          throw new Error(`Unknown export source: ${exportFrom}`);
      }

      const availableItemPropertyNames = getItemPropertyNameMap();
      const data = items.map(item =>
        Object.fromEntries([
          ['ID', item.id],
          ...Object.entries(availableItemPropertyNames).flatMap(
            ([humanName, name]) => {
              if (name === 'purchasePrice') {
                if (typeof item.purchasePriceX1000 === 'number')
                  return [[humanName, item.purchasePriceX1000 / 1000]];
              }
              if (name === 'itemReferenceNumber') {
                if (item.itemReferenceNumber)
                  // Force CSV editing software to treat it as string
                  return [[humanName, '[' + item.itemReferenceNumber + ']']];
              }

              return [[humanName, item[name] || '']];
            },
          ),
        ]),
      );
      const csv = jsonToCSV(data);
      const csvFilePath = `${RNFS.TemporaryDirectoryPath}/${exportFrom}_${fromId}.csv`;
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
  }, [db, exportFrom, fromId]);
  const handleExportRef = useRef(handleExport);
  handleExportRef.current = handleExport;

  useFocusEffect(() => {
    handleExportRef.current();
  });

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  return (
    <ModalContent navigation={navigation} title="CSV Export">
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={commonStyles.mt32} />

        <InsetGroup footerLabel="Exports all items in the selected collection.">
          <InsetGroup.Item
            button
            label="Export Items from Collection"
            onPress={handleOpenSelectCollection}
          />
        </InsetGroup>

        <InsetGroup footerLabel="Exports all dedicated items in the selected container.">
          <InsetGroup.Item
            button
            label="Export Items from Container"
            onPress={handleOpenSelectContainer}
          />
        </InsetGroup>

        <InsetGroup footerLabel="Exports all items in database.">
          <InsetGroup.Item
            button
            label="Export All Items"
            onPress={() => {
              setFromId('items');
              setExportFrom('all');
            }}
          />
        </InsetGroup>
        <LoadingOverlay show={loading} />
      </ScrollView>
    </ModalContent>
  );
}

export default ExportItemsToCsvScreen;
