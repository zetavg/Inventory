import React, { useCallback, useRef, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { SortOption } from '@deps/data/types';

import {
  getHumanName,
  getPropertyNames,
  useData,
  useDataCount,
} from '@app/data';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useActionSheet from '@app/hooks/useActionSheet';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

function DataListScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'DataList'>) {
  const rootNavigation = useRootNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const { type } = route.params;
  const numberOfItemsPerPageList = [10, 20, 50, 100, 500];
  const [perPage, setPerPage] = React.useState(numberOfItemsPerPageList[1]);
  const [page, setPage] = React.useState<number>(1);
  const limit = perPage;
  const skip = perPage * (page - 1);

  const [searchText, setSearchText] = useState('');
  const [sort, setSort] = useState<any | undefined>(undefined);

  const {
    loading,
    data,
    refresh: refreshData,
    refreshing: refreshingData,
  } = useData(
    type,
    searchText ? { __id: { $gte: searchText, $lte: `${searchText}zzz` } } : {},
    {
      sort,
      limit,
      skip,
    },
  );

  const {
    count,
    refresh: refreshCount,
    refreshing: refreshingCount,
  } = useDataCount(type);

  const refreshing = refreshingData || refreshingCount;
  const refresh = useCallback(() => {
    refreshData();
    refreshCount();
  }, [refreshCount, refreshData]);

  const numberOfPages = count === null ? null : Math.ceil(count / perPage);

  const { showActionSheet } = useActionSheet();

  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  return (
    <ScreenContent
      navigation={navigation}
      title={getHumanName(type, { titleCase: true, plural: true })}
      showSearch
      searchPlaceholder="Find by ID..."
      onSearchChangeText={setSearchText}
      action1Label="Add Data"
      action1SFSymbolName="plus.square.fill"
      action1MaterialIconName="square-edit-outline"
      onAction1Press={() =>
        rootNavigation?.navigate('SaveData', {
          type,
          afterSave: ({ __type: t, __id: i }) =>
            i && navigation.navigate('Datum', { type: t, id: i }),
        })
      }
      action2Label="Sort"
      action2SFSymbolName="list.number"
      action2MaterialIconName="sort"
      onAction2Press={() =>
        showActionSheet([
          { name: 'Default', onSelect: () => setSort(undefined) },
          ...[
            '__created_at',
            '__updated_at',
            ...getPropertyNames(type),
          ].flatMap(name => [
            {
              name: `${name} ASC`,
              onSelect: () => setSort([{ [name]: 'asc' }]),
            },
            {
              name: `${name} DESC`,
              onSelect: () => setSort([{ [name]: 'desc' }]),
            },
          ]),
        ])
      }
    >
      <ScreenContent.ScrollView
        ref={scrollViewRef}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        <UIGroup
          loading={loading}
          placeholder={`No${searchText ? ' matched' : ''} ${getHumanName(type, {
            titleCase: false,
            plural: true,
          })}.`}
          footer={
            count && !searchText
              ? `Showing ${skip + 1}-${Math.max(
                  Math.min(skip + perPage, count),
                  skip + 1,
                )} of ${count}.`
              : undefined
          }
        >
          {data &&
            data.length > 0 &&
            UIGroup.ListItemSeparator.insertBetween(
              data.map((d, i) =>
                d.__valid ? (
                  <UIGroup.ListItem
                    verticalArrangedIOS
                    navigable
                    key={d.__id || `no_id-${i}`}
                    label={typeof d.name === 'string' ? d.name : d.__id}
                    detail={`ID: ${d.__id}`}
                    onPress={() => {
                      navigation.navigate('Datum', {
                        type: d.__type,
                        id: d.__id || '',
                        preloadedTitle:
                          typeof d.name === 'string' ? d.name : d.__id,
                      });
                    }}
                  />
                ) : (
                  <UIGroup.ListItem
                    verticalArrangedIOS
                    navigable
                    key={d.__id || `no_id-${i}`}
                    label={
                      (typeof d.name === 'string' ? `${d.name} ` : '') +
                      '(invalid)'
                    }
                    detail={`ID: ${d.__id}`}
                    onPress={() => {
                      navigation.navigate('Datum', {
                        type: type,
                        id: d.__id || '',
                      });
                    }}
                  />
                ),
              ),
            )}
        </UIGroup>

        <UIGroup footer={`Skip: ${skip}, limit: ${limit}.`}>
          <UIGroup.ListTextInputItem
            label="Page"
            horizontalLabel
            keyboardType="number-pad"
            returnKeyType="done"
            value={page.toString()}
            unit={`/ ${numberOfPages === null ? '?' : numberOfPages}`}
            onChangeText={t => {
              const n = parseInt(t, 10);
              if (isNaN(n)) return;
              if (n <= 0) return;

              setPage(n);
            }}
            selectTextOnFocus
            controlElement={
              <>
                <UIGroup.ListTextInputItem.Button
                  onPress={() =>
                    setPage(i => {
                      if (i <= 1) return i;
                      if (numberOfPages !== null && i > numberOfPages) {
                        return numberOfPages;
                      }
                      return i - 1;
                    })
                  }
                  disabled={page <= 1}
                >
                  ‹ Prev
                </UIGroup.ListTextInputItem.Button>
                <UIGroup.ListTextInputItem.Button
                  onPress={() => setPage(i => i + 1)}
                  disabled={numberOfPages != null && page >= numberOfPages}
                >
                  Next ›
                </UIGroup.ListTextInputItem.Button>
              </>
            }
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Per Page"
            horizontalLabel
            keyboardType="number-pad"
            returnKeyType="done"
            value={perPage.toString()}
            onChangeText={t => {
              const n = parseInt(t, 10);
              if (isNaN(n)) return;
              if (n <= 0) return;

              setPerPage(n);
            }}
            selectTextOnFocus
            controlElement={
              <>
                {numberOfItemsPerPageList.map((n, i) => (
                  <UIGroup.ListTextInputItem.Button
                    key={i}
                    onPress={() => setPerPage(n)}
                  >
                    {n.toString()}
                  </UIGroup.ListTextInputItem.Button>
                ))}
              </>
            }
            {...kiaTextInputProps}
          />
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default DataListScreen;
