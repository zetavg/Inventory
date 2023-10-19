import React, { useCallback, useMemo, useRef, useState } from 'react';
import { SectionList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

import { InvalidDataTypeWithID, ValidDataTypeWithID } from '@deps/data/types';

import useView from '@app/data/hooks/useView';

import type { StackParamList } from '@app/navigation/MainStack';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

import ItemListItem from '../components/ItemListItem';

function ExpiredItemsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'ExpiredItems'>) {
  const [nowDate, setNowDate] = useState(Date.now());
  useFocusEffect(
    useCallback(() => {
      setNowDate(Date.now());
    }, []),
  );

  const {
    data: expiredItemsData,
    loading: expiredItemsLoading,
    refresh: refreshExpiredItems,
    refreshing: expiredItemsRefreshing,
  } = useView('expiring_items', {
    descending: true,
    startKey: nowDate,
    includeDocs: true,
  });
  const expiredItems = expiredItemsData
    ? expiredItemsData
        .map(d => d.data)
        .filter((d): d is NonNullable<typeof d> => !!d)
    : expiredItemsData;

  const {
    data: aboutToExpireItemsData,
    loading: aboutToExpireItemsLoading,
    refresh: refreshAboutToExpireItems,
    refreshing: aboutToExpireItemsRefreshing,
  } = useView('expiring_items', {
    descending: true,
    startKey: nowDate + 2629746000,
    includeDocs: true,
  });
  const aboutToExpireItems = aboutToExpireItemsData
    ? aboutToExpireItemsData
        .map(d => d.data)
        .filter((d): d is NonNullable<typeof d> => !!d)
        .filter(d => {
          const expiryDate =
            typeof d.expiry_date === 'number' ? d.expiry_date : nowDate;

          return expiryDate >= nowDate;
        })
    : aboutToExpireItemsData;

  const refresh = useCallback(() => {
    refreshExpiredItems();
    refreshAboutToExpireItems();
  }, [refreshExpiredItems, refreshAboutToExpireItems]);
  const refreshing = expiredItemsRefreshing || aboutToExpireItemsRefreshing;

  const sections = useMemo(() => {
    return [
      {
        title: 'expired',
        data: expiredItems
          ? expiredItems.length > 0
            ? expiredItems
            : (['null'] as const)
          : (['loading'] as const),
      },
      {
        title: 'about-to-expire',
        data: aboutToExpireItems
          ? aboutToExpireItems.length > 0
            ? aboutToExpireItems
            : (['null'] as const)
          : (['loading'] as const),
      },
    ];
  }, [aboutToExpireItems, expiredItems]);

  const loading = expiredItemsLoading || aboutToExpireItemsLoading;

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
            additionalDetails={
              typeof item.expiry_date === 'number'
                ? (() => {
                    const dateStr = new Date(
                      item.expiry_date,
                    ).toLocaleDateString();

                    if (item.expiry_date < nowDate) {
                      return `Expired at ${dateStr}`;
                    } else {
                      return `Expire at ${dateStr}`;
                    }
                  })()
                : undefined
            }
          />
        ) : (
          <UIGroup.ListItem label={`(Invalid Item: ${item.__id})`} />
        )}
      </UIGroup.ListItem.RenderItemContainer>
    ),
    [navigation, nowDate],
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
                case 'expired': {
                  return 'Expired Items';
                }
                case 'about-to-expire': {
                  return 'About to Expire';
                }
                default: {
                  return title;
                }
              }
            })()}
            headerRight={(() => {
              switch (title) {
                case 'expired': {
                  if (!Array.isArray(expiredItems)) {
                    return 'Loading';
                  }
                  return expiredItems.length.toLocaleString();
                }
                case 'about-to-expire': {
                  if (!Array.isArray(aboutToExpireItems)) {
                    return 'Loading';
                  }
                  return aboutToExpireItems.length.toLocaleString();
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

export default ExpiredItemsScreen;
