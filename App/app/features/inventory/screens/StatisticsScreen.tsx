import React from 'react';
import type { StackScreenProps } from '@react-navigation/stack';

import { useDataCount } from '@app/data';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';

import ScreenContent from '@app/components/ScreenContent';
import TableView from '@app/components/TableView';

function StatisticsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Statistics'>) {
  const { count: collectionsCount, reload: reloadCollectionsCount } =
    useDataCount('collection', {}, {});
  const { count: itemsCount, reload: reloadItemsCount } = useDataCount(
    'item',
    {},
    {},
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
        </TableView.Section>
      </TableView>
    </ScreenContent>
  );
}

export default StatisticsScreen;
