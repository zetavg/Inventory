import React, { useCallback, useRef } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { getHumanTypeName, useData, useDataCount } from '@app/data';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

function DataListScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'DataList'>) {
  const rootNavigation = useRootNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const { type } = route.params;
  const numberOfItemsPerPageList = [10, 50, 100, 500];
  const [perPage, setPerPage] = React.useState(numberOfItemsPerPageList[2]);
  const [page, setPage] = React.useState<number>(1);
  const skip = perPage * (page - 1);
  const limit = perPage;

  const {
    loading,
    data,
    ids,
    refresh: refreshData,
    refreshing: refreshingData,
  } = useData(type, {}, { skip, limit });

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

  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  return (
    <ScreenContent
      navigation={navigation}
      title={getHumanTypeName(type, { titleCase: true, plural: true })}
      action1Label="Add Data"
      action1SFSymbolName="plus.square.fill"
      action1MaterialIconName="square-edit-outline"
      onAction1Press={() =>
        rootNavigation?.navigate('SaveData', {
          type,
          afterSave: ({ type: t, id: i }) =>
            navigation.navigate('Datum', { type: t, id: i }),
        })
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
          placeholder={`No ${getHumanTypeName(type, {
            titleCase: false,
            plural: true,
          })}.`}
          footer={
            count
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
                d ? (
                  <UIGroup.ListItem
                    verticalArrangedIOS
                    navigable
                    key={d.__id}
                    label={d.name}
                    detail={`ID: ${d.__id}`}
                    onPress={() => {
                      navigation.navigate('Datum', {
                        type: d.__type,
                        id: d.__id,
                        preloadedTitle: d.name,
                      });
                    }}
                  />
                ) : ids && ids[i] ? (
                  <UIGroup.ListItem
                    verticalArrangedIOS
                    navigable
                    key={ids[i]}
                    label={`(Invalid ${getHumanTypeName(type, {
                      titleCase: false,
                      plural: false,
                    })}: ${ids[i]})`}
                    detail={`ID: ${ids[i]}`}
                    onPress={() => {
                      navigation.navigate('Datum', {
                        type: type,
                        id: ids[i],
                      });
                    }}
                  />
                ) : (
                  <UIGroup.ListItem
                    verticalArrangedIOS
                    navigable
                    key={i}
                    label={`(Invalid ${getHumanTypeName(type, {
                      titleCase: false,
                      plural: false,
                    })} with unknown ID})`}
                    detail="Unknown ID"
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
            rightElement={
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
            rightElement={
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
