import React, { useCallback, useMemo, useState } from 'react';
import { LayoutAnimation } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import RNFS from 'react-native-fs';

import { DEFAULT_LAYOUT_ANIMATION_CONFIG } from '@app/consts/animations';

import { selectors, useAppSelector } from '@app/redux';

import { useDataCount } from '@app/data';
import useView from '@app/data/hooks/useView';

import commonStyles from '@app/utils/commonStyles';
import humanFileSize from '@app/utils/humanFileSize';

import type { StackParamList } from '@app/navigation/MainStack';

import ScreenContent from '@app/components/ScreenContent';
import TableView from '@app/components/TableView';

function StatisticsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Statistics'>) {
  const dbName = useAppSelector(selectors.profiles.currentDbName);

  const { count: collectionsCount, reload: reloadCollectionsCount } =
    useDataCount('collection', {}, {});
  const { count: itemsCount, reload: reloadItemsCount } = useDataCount(
    'item',
    {},
    {},
  );
  const { count: imagesCount, reload: reloadImagesCount } = useDataCount(
    'image',
    {},
    {},
  );

  const { data: purchasePriceSums } = useView('purchase_price_sums');

  const [dbSizeInfo, setDbSizeInfo] = useState<null | {
    db: number;
    views: number;
    searchIndexes: number;
  }>(null);

  const calculateDbSize = useCallback(async () => {
    const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
    const dbFiles = files.filter(file => file.name === dbName);

    const dbViewFiles = files.filter(file =>
      file.name.startsWith(`${dbName}-mrview-`),
    );

    const dbSearchIndexFiles = files.filter(file =>
      file.name.startsWith(`${dbName}-search-`),
    );

    const dbSize = dbFiles.map(file => file.size).reduce((a, b) => a + b, 0);
    const dbViewsSize = dbViewFiles
      .map(file => file.size)
      .reduce((a, b) => a + b, 0);
    const dbSearchIndexesSize = dbSearchIndexFiles
      .map(file => file.size)
      .reduce((a, b) => a + b, 0);

    LayoutAnimation.configureNext(DEFAULT_LAYOUT_ANIMATION_CONFIG);
    setDbSizeInfo({
      db: dbSize,
      views: dbViewsSize,
      searchIndexes: dbSearchIndexesSize,
    });
  }, [dbName]);

  useFocusEffect(
    useCallback(() => {
      calculateDbSize();
    }, [calculateDbSize]),
  );

  return (
    <ScreenContent
      navigation={navigation}
      title="Statistics"
      // headerLargeTitle={false}
    >
      <TableView style={commonStyles.flex1}>
        <TableView.Section>
          <TableView.Item
            detail={
              typeof dbSizeInfo?.db === 'number'
                ? humanFileSize(dbSizeInfo?.db)
                : 'Calculating...'
            }
          >
            Database Size
          </TableView.Item>
          <TableView.Item
            detail={
              typeof dbSizeInfo?.views === 'number'
                ? humanFileSize(dbSizeInfo?.views)
                : 'Calculating...'
            }
          >
            Views Size
          </TableView.Item>
          <TableView.Item
            detail={
              typeof dbSizeInfo?.searchIndexes === 'number'
                ? humanFileSize(dbSizeInfo?.searchIndexes)
                : 'Calculating...'
            }
          >
            Search Indexes Size
          </TableView.Item>
        </TableView.Section>

        <TableView.Section label="Data Count">
          <TableView.Item
            detail={
              typeof collectionsCount === 'number'
                ? collectionsCount.toString()
                : 'Calculating...'
            }
          >
            Collections
          </TableView.Item>
          <TableView.Item
            detail={
              typeof itemsCount === 'number'
                ? itemsCount.toString()
                : 'Calculating...'
            }
          >
            Items
          </TableView.Item>
          <TableView.Item
            detail={
              typeof imagesCount === 'number'
                ? imagesCount.toString()
                : 'Calculating...'
            }
          >
            Images
          </TableView.Item>
        </TableView.Section>

        {!!purchasePriceSums &&
          typeof purchasePriceSums === 'object' &&
          Object.keys(purchasePriceSums).length > 0 && (
            <TableView.Section label="Total Purchased Cost">
              {Object.entries(purchasePriceSums).map(([currency, value]) => (
                <TableView.Item
                  key={currency}
                  detail={
                    typeof value === 'number'
                      ? (() => {
                          switch (currency) {
                            case 'EUR':
                              return '€';
                            case 'GBP':
                              return '£';
                            case 'JPY':
                              return '¥';
                            case 'KRW':
                              return '₩';
                            case 'CNY':
                              return '¥';
                            default:
                              return '$';
                          }
                        })() +
                        ' ' +
                        (value / 1000).toLocaleString()
                      : 'Error'
                  }
                  arrow
                  onPress={() =>
                    navigation.push('Items', {
                      conditions: { purchase_price_currency: currency },
                      sortOptions: {
                        'Unit Price': [{ purchase_price_x1000: 'asc' }],
                      },
                      getItemDetailText: item =>
                        `${item.purchase_price_currency} ${(
                          (item.purchase_price_x1000 || 0) / 1000
                        ).toLocaleString()}`,
                    })
                  }
                >
                  {currency}
                </TableView.Item>
              ))}
            </TableView.Section>
          )}
      </TableView>
    </ScreenContent>
  );
}

export default StatisticsScreen;
