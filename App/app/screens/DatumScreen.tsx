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

import { getHumanTypeName, schema, toTitleCase, useData } from '@app/data';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useDB from '@app/hooks/useDB';
import useLogger from '@app/hooks/useLogger';
import { usePersistedState } from '@app/hooks/usePersistedState';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

function DatumScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'Datum'>) {
  const scrollViewRef = useRef<ScrollView>(null);
  const { type, id, preloadedTitle } = route.params;

  const { loading, data, reload } = useData(type as keyof typeof schema, id);

  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  return (
    <ScreenContent
      navigation={navigation}
      title={
        preloadedTitle ||
        getHumanTypeName(type, { titleCase: true, plural: false })
      }
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
          placeholder={
            loading
              ? undefined
              : `Can't load ${getHumanTypeName(type, {
                  titleCase: false,
                  plural: false,
                })} with ID "${id}".`
          }
        >
          {data &&
            UIGroup.ListItemSeparator.insertBetween(
              Object.entries(schema[type as keyof typeof schema].shape).map(
                ([k, v]) => (
                  <UIGroup.ListItem
                    key={k}
                    label={toTitleCase(k.replace(/_/g, ' '))}
                    detail={data[k]}
                    verticalArrangedIOS
                  />
                ),
              ),
            )}
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default DatumScreen;
