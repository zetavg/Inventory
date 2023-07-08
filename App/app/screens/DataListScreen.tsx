import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  LayoutAnimation,
  RefreshControl,
  ScrollView,
  Text,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { getHumanTypeName, schema, useData } from '@app/data';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useDB from '@app/hooks/useDB';
import useLogger from '@app/hooks/useLogger';
import { usePersistedState } from '@app/hooks/usePersistedState';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

function DataListScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'DataList'>) {
  const scrollViewRef = useRef<ScrollView>(null);
  const { type } = route.params;
  const numberOfItemsPerPageList = [10, 50, 100, 500];
  const [perPage, setPerPage] = React.useState(numberOfItemsPerPageList[2]);
  const [page, setPage] = React.useState<number>(1);
  const skip = perPage * (page - 1);
  const limit = perPage;

  const { loading, data, reload } = useData(
    type as keyof typeof schema,
    {},
    { skip, limit },
  );
  const validData = data && data.filter((d: any) => !!d);

  // const totalRows = 100;
  // const numberOfPages = Math.ceil(totalRows / perPage);

  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  return (
    <ScreenContent
      navigation={navigation}
      title={getHumanTypeName(type, { titleCase: true, plural: true })}
    >
      <ScreenContent.ScrollView
        ref={scrollViewRef}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} />
        }
      >
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        <UIGroup
          loading={loading}
          placeholder={`No ${getHumanTypeName(type, {
            titleCase: false,
            plural: true,
          })}.`}
        >
          {validData &&
            validData.length > 0 &&
            UIGroup.ListItemSeparator.insertBetween(
              validData.map(d => (
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
              )),
            )}
        </UIGroup>

        <UIGroup footer={`Skip: ${skip}, limit: ${limit}.`}>
          <UIGroup.ListTextInputItem
            label="Page"
            horizontalLabel
            keyboardType="number-pad"
            returnKeyType="done"
            value={page.toString()}
            unit={`/ ${'?'}`}
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
                      // if (i > numberOfPages) return numberOfPages;
                      return i - 1;
                    })
                  }
                  disabled={page <= 1}
                >
                  ‹ Prev
                </UIGroup.ListTextInputItem.Button>
                <UIGroup.ListTextInputItem.Button
                  onPress={() => setPage(i => i + 1)}
                  // disabled={page >= numberOfPages}
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
