import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Image, StyleSheet } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { SortOption } from '@invt/data/types';

import {
  DataType,
  InvalidDataTypeWithID,
  useData,
  useDataCount,
  ValidDataTypeWithID,
} from '@app/data';
import { getGetAttachmentFromDatum } from '@app/data/functions';

import { useDB } from '@app/db';

import humanFileSize from '@app/utils/humanFileSize';

import type { StackParamList } from '@app/navigation/MainStack';

import useActionSheet from '@app/hooks/useActionSheet';
import useColors from '@app/hooks/useColors';

import Icon from '@app/components/Icon';
import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';
import UIGroupPaginator from '@app/components/UIGroupPaginator';

import ItemListItem from '../components/ItemListItem';

function ItemsScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'Items'>) {
  const { conditions, sortOptions, getItemDetailText } = route.params;
  const [perPage, setPerPage] = React.useState(20);
  const [page, setPage] = React.useState<number>(1);

  const offset = perPage * (page - 1);
  const limit = perPage;

  const [sort, setSort] = useState<SortOption<DataType<'item'>>>(
    Object.values(sortOptions)[0] || [{ __updated_at: 'desc' } as const],
  );

  const {
    count: itemsCount,
    refresh: refreshItemsCount,
    refreshing: itemsCountRefreshing,
  } = useDataCount('item', conditions);
  const {
    data: items,
    loading: itemsLoading,
    refresh: refreshItems,
    refreshing: itemsRefreshing,
  } = useData('item', conditions, { sort, skip: offset, limit });
  const refresh = useCallback(() => {
    refreshItemsCount();
    refreshItems();
  }, [refreshItems, refreshItemsCount]);
  const refreshing = itemsCountRefreshing || itemsRefreshing;

  const numberOfPages = Math.ceil((itemsCount || 0) / perPage);

  const renderListItem = useCallback(
    ({
      item,
      index,
    }: {
      item: ValidDataTypeWithID<'item'> | InvalidDataTypeWithID<'item'>;
      index: number;
    }) => (
      <UIGroup.ListItem.RenderItemContainer
        isFirst={index === 0}
        isLast={index === (items?.length || 0) - 1}
      >
        {item.__valid ? (
          <ItemListItem
            item={item}
            onPress={() =>
              item.__id && navigation.push('Item', { id: item.__id })
            }
            additionalDetails={
              getItemDetailText ? getItemDetailText(item) : undefined
            }
          />
        ) : (
          <UIGroup.ListItem label={`(Invalid Item: ${item.__id})`} />
        )}
      </UIGroup.ListItem.RenderItemContainer>
    ),
    [getItemDetailText, items?.length, navigation],
  );

  const scrollViewRef = useRef<FlatList>(null);
  const { showActionSheet } = useActionSheet();
  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(
      scrollViewRef as any,
    );

  return (
    <ScreenContent
      navigation={navigation}
      title="Items"
      headerLargeTitle
      action2Label="Sort"
      action2SFSymbolName="list.number"
      action2MaterialIconName="sort"
      onAction2Press={() =>
        showActionSheet(
          Object.entries(sortOptions).map(([name, s]) => ({
            name,
            onSelect: () => setSort(s),
          })),
        )
      }
    >
      <FlatList
        ref={scrollViewRef}
        onRefresh={refresh}
        refreshing={refreshing}
        data={items}
        initialNumToRender={32}
        keyExtractor={(item, index) => item.__id || `i-${index}`}
        renderItem={renderListItem}
        ItemSeparatorComponent={
          UIGroup.ListItem.ItemSeparatorComponent.ForItemWithIcon
        }
        ListFooterComponent={
          <>
            <UIGroup.SectionSeparatorComponent />
            <UIGroupPaginator
              perPage={perPage}
              page={page}
              numberOfPages={numberOfPages}
              setPerPage={setPerPage}
              setPage={setPage}
              footer={`Offset: ${offset}, limit: ${limit}.`}
              textInputProps={kiaTextInputProps}
            />
          </>
        }
        ListEmptyComponent={
          <UIGroup
            loading={itemsLoading}
            placeholder={itemsLoading ? undefined : 'No Items'}
          />
        }
        // removeClippedSubviews={true}
      />
    </ScreenContent>
  );
}

export default ItemsScreen;
