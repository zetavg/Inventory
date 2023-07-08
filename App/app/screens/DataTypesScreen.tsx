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

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useDB from '@app/hooks/useDB';
import useLogger from '@app/hooks/useLogger';
import { usePersistedState } from '@app/hooks/usePersistedState';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

import { getHumanTypeName, schema, typePlurals } from '@app/data';

function DataTypesScreen({
  navigation,
}: StackScreenProps<StackParamList, 'DataTypes'>) {
  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  return (
    <ScreenContent navigation={navigation} title="Data">
      <ScreenContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        <UIGroup>
          {UIGroup.ListItemSeparator.insertBetween(
            Object.keys(schema).map(type => (
              <UIGroup.ListItem
                key={type}
                label={getHumanTypeName(type, {
                  titleCase: true,
                  plural: true,
                })}
                navigable
                onPress={() => {
                  navigation.navigate('DataList', { type });
                }}
              />
            )),
          )}
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default DataTypesScreen;
