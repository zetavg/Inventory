import React, { useCallback, useMemo, useRef } from 'react';
import { SectionList } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { InvalidDataTypeWithID, ValidDataTypeWithID } from '@deps/data/types';

import { useDataCount } from '@app/data';
import useView from '@app/data/hooks/useView';

import type { StackParamList } from '@app/navigation/MainStack';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

import ItemListItem from '../components/ItemListItem';

const WILL_NOT_RESTOCK_ITEMS_CONDITION = {
  consumable_will_not_restock: true,
  consumable_stock_quantity: 0,
  // Not working with useDataCount
  // consumable_stock_quantity: { $lte: 0 },
} as const;

function LowOrOutOfStockItemsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'LowOrOutOfStockItems'>) {
  const {
    data: outOfStockItemsData,
    loading: outOfStockItemsDataLoading,
    refresh: refreshOutOfStockItemsData,
    refreshing: outOfStockItemsDataRefreshing,
  } = useView('out_of_stock_items', {
    includeDocs: true,
  });
  const outOfStockItems = outOfStockItemsData
    ? outOfStockItemsData
        .map(d => d.data)
        .filter((d): d is NonNullable<typeof d> => !!d)
    : outOfStockItemsData;

  const {
    data: outOfStockItemsCount,
    refresh: refreshOutOfStockItemsCount,
    refreshing: refreshOutOfStockItemsCountRefreshing,
  } = useView('out_of_stock_items_count');
  const lowStockItemsCount = 0; // TODO

  const {
    count: willNotRestockItemsCount,
    refresh: refreshWillNotRestockItemsCount,
    refreshing: willNotRestockItemsCountRefreshing,
  } = useDataCount('item', WILL_NOT_RESTOCK_ITEMS_CONDITION);

  const refresh = useCallback(() => {
    refreshOutOfStockItemsData();
    refreshOutOfStockItemsCount();
    refreshWillNotRestockItemsCount();
  }, [
    refreshOutOfStockItemsCount,
    refreshOutOfStockItemsData,
    refreshWillNotRestockItemsCount,
  ]);
  const refreshing =
    outOfStockItemsDataRefreshing ||
    refreshOutOfStockItemsCountRefreshing ||
    willNotRestockItemsCountRefreshing;

  const sections = useMemo(() => {
    return [
      {
        title: 'out-of-stock',
        data: outOfStockItems
          ? outOfStockItems.length > 0
            ? outOfStockItems
            : (['null'] as const)
          : (['loading'] as const),
      },
      { title: 'low-stock', data: ['null' as const] },
      {
        title: 'will-not-restock',
        data: ['will-not-restock-placeholder' as const],
      },
    ];
  }, [outOfStockItems]);

  const loading = outOfStockItemsDataLoading;

  const renderListItem = useCallback(
    ({
      item,
      index,
      section,
    }: {
      item:
        | ValidDataTypeWithID<'item'>
        | InvalidDataTypeWithID<'item'>
        | 'loading'
        | 'null'
        | 'will-not-restock-placeholder';
      section: { [k: string]: string };
      index: number;
    }) => (
      <UIGroup.ListItem.RenderItemContainer
        isFirst={index === 0}
        isLast={index === (section.data.length || 0) - 1}
      >
        {item === 'loading' ? (
          <UIGroup loading asPlaceholderContent />
        ) : item === 'null' ? (
          <UIGroup placeholder="No Items" asPlaceholderContent />
        ) : item === 'will-not-restock-placeholder' ? (
          <UIGroup.ListItem
            label="View Items"
            navigable
            onPress={() =>
              navigation.push('Items', {
                conditions: WILL_NOT_RESTOCK_ITEMS_CONDITION,
                sortOptions: {
                  Updated: [{ __updated_at: 'desc' }] as const,
                },
              })
            }
          />
        ) : item.__valid ? (
          <ItemListItem
            item={item}
            onPress={() =>
              item.__id && navigation.push('Item', { id: item.__id })
            }
          />
        ) : (
          <UIGroup.ListItem label={`(Invalid Item: ${item.__id})`} />
        )}
      </UIGroup.ListItem.RenderItemContainer>
    ),
    [navigation],
  );

  const scrollViewRef = useRef<SectionList>(null);

  return (
    <ScreenContent
      navigation={navigation}
      title="Items"
      headerLargeTitle={false}
    >
      <SectionList
        ref={scrollViewRef}
        onRefresh={refresh}
        refreshing={refreshing}
        stickySectionHeadersEnabled={false}
        sections={sections}
        initialNumToRender={32}
        keyExtractor={(item, index) =>
          (typeof item === 'object' ? item.__id : null) || `i-${index}`
        }
        renderSectionHeader={({ section: { title } }) => (
          <UIGroup
            asSectionHeader
            largeTitle
            header={(() => {
              switch (title) {
                case 'out-of-stock': {
                  return 'Out of Stock';
                }
                case 'low-stock': {
                  return 'Low Stock';
                }
                case 'will-not-restock': {
                  return 'Will Not Restock';
                }
                default: {
                  return title;
                }
              }
            })()}
            headerRight={(() => {
              switch (title) {
                case 'out-of-stock': {
                  if (typeof outOfStockItemsCount !== 'number') {
                    return 'Loading';
                  }
                  return outOfStockItemsCount.toLocaleString();
                }
                case 'low-stock': {
                  return lowStockItemsCount.toLocaleString();
                }
                case 'will-not-restock': {
                  if (typeof willNotRestockItemsCount !== 'number') {
                    return undefined;
                  }
                  return willNotRestockItemsCount.toLocaleString();
                }
                default: {
                  return undefined;
                }
              }
            })()}
          />
        )}
        renderItem={renderListItem}
        ItemSeparatorComponent={
          UIGroup.ListItem.ItemSeparatorComponent.ForItemWithIcon
        }
        SectionSeparatorComponent={UIGroup.SectionSeparatorComponent}
        ListEmptyComponent={
          <UIGroup
            loading={loading}
            placeholder={loading ? undefined : 'No Items'}
          />
        }
        ListHeaderComponent={<UIGroup.FirstGroupSpacing />}
        removeClippedSubviews={true}
      />
    </ScreenContent>
  );
}

export default LowOrOutOfStockItemsScreen;
