import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, SectionList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

import { InvalidDataTypeWithID, ValidDataTypeWithID } from '@deps/data/types';

import { MAJOR_VERSION_IOS } from '@app/consts/icons';

import useView from '@app/data/hooks/useView';

import type { StackParamList } from '@app/navigation/MainStack';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

import ItemListItem from '../components/ItemListItem';

function RFIDUntaggedItemsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'RFIDUntaggedItems'>) {
  const [sort, setSort] = useState<'updated_time' | 'created_time'>(
    'updated_time',
  );
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const {
    data: rfidUntaggedItemsData,
    loading: rfidUntaggedItemsDataLoading,
    refresh: refreshRfidUntaggedItems,
    refreshing: rfidUntaggedItemsRefreshing,
  } = useView(
    sort === 'updated_time'
      ? 'rfid_untagged_items_by_updated_time'
      : 'rfid_untagged_items_by_created_time',
    {
      includeDocs: true,
      descending: order === 'desc',
    },
  );
  const rfidUntaggedItems = rfidUntaggedItemsData
    ? rfidUntaggedItemsData
        .map(d => d.data)
        .filter((d): d is NonNullable<typeof d> => !!d)
    : rfidUntaggedItemsData;

  const {
    data: rfidTagOutdatedItemsData,
    loading: rfidTagOutdatedItemsDataLoading,
    refresh: refreshRfidTagOutdatedItems,
    refreshing: rfidTagOutdatedItemsRefreshing,
  } = useView(
    sort === 'updated_time'
      ? 'rfid_tag_outdated_items_by_updated_time'
      : 'rfid_tag_outdated_items_by_created_time',
    {
      includeDocs: true,
      descending: order === 'desc',
    },
  );
  const rfidTagOutdatedItems = rfidTagOutdatedItemsData
    ? rfidTagOutdatedItemsData
        .map(d => d.data)
        .filter((d): d is NonNullable<typeof d> => !!d)
    : rfidTagOutdatedItemsData;

  const refresh = useCallback(() => {
    refreshRfidUntaggedItems();
    refreshRfidTagOutdatedItems();
  }, [refreshRfidUntaggedItems, refreshRfidTagOutdatedItems]);
  const refreshing =
    rfidUntaggedItemsRefreshing || rfidTagOutdatedItemsRefreshing;

  const sections = useMemo(() => {
    return [
      {
        title: 'untagged',
        data:
          rfidUntaggedItems && !rfidUntaggedItemsDataLoading
            ? rfidUntaggedItems.length > 0
              ? rfidUntaggedItems
              : (['null'] as const)
            : (['loading'] as const),
      },
      {
        title: 'tag-outdated',
        data:
          rfidTagOutdatedItems && !rfidTagOutdatedItemsDataLoading
            ? rfidTagOutdatedItems.length > 0
              ? rfidTagOutdatedItems
              : (['null'] as const)
            : (['loading'] as const),
      },
    ];
  }, [
    rfidTagOutdatedItems,
    rfidTagOutdatedItemsDataLoading,
    rfidUntaggedItems,
    rfidUntaggedItemsDataLoading,
  ]);

  const loading =
    rfidUntaggedItemsDataLoading || rfidTagOutdatedItemsDataLoading;

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
        | 'null';
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
      action1Label="Order"
      action1SFSymbolName={
        MAJOR_VERSION_IOS >= 16
          ? 'arrow.up.and.down.text.horizontal'
          : 'slider.vertical.3'
      }
      action1MaterialIconName="sort-ascending"
      action1MenuActions={[
        {
          type: 'section',
          children: [
            {
              title: 'Sort by Created Time',
              state: sort === 'created_time' ? 'on' : 'off',
              onPress: () => setSort('created_time'),
            },
            {
              title: 'Sort by Updated Time',
              state: sort === 'updated_time' ? 'on' : 'off',
              onPress: () => setSort('updated_time'),
            },
          ],
        },
        {
          type: 'section',
          children: [
            {
              title: 'Ascending',
              state: order === 'asc' ? 'on' : 'off',
              onPress: () => setOrder('asc'),
            },
            {
              title: 'Descending',
              state: order === 'desc' ? 'on' : 'off',
              onPress: () => setOrder('desc'),
            },
          ],
        },
      ]}
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
                case 'untagged': {
                  return 'Untagged Items';
                }
                case 'tag-outdated': {
                  return 'Tag Outdated';
                }
                default: {
                  return title;
                }
              }
            })()}
            headerRight={(() => {
              switch (title) {
                case 'untagged': {
                  if (!Array.isArray(rfidUntaggedItems)) {
                    return 'Loading';
                  }
                  return rfidUntaggedItems.length.toLocaleString();
                }
                case 'tag-outdated': {
                  if (!Array.isArray(rfidTagOutdatedItems)) {
                    return 'Loading';
                  }
                  return rfidTagOutdatedItems.length.toLocaleString();
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

export default RFIDUntaggedItemsScreen;
