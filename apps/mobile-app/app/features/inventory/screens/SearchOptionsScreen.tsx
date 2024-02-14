import React, { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { useData } from '@app/data';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useDB from '@app/hooks/useDB';
import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

import SEARCH_OPTIONS, {
  getItemSearchOptionsForCollection,
  SEARCH_ITEM_AS_CONTAINER_OPTIONS,
  SEARCH_ITEMS_OPTIONS,
} from '../consts/SEARCH_OPTIONS';

function SearchOptionsScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'SearchOptions'>) {
  // const { callback, defaultValue } = route.params;
  // const [value, setValue] = useState(defaultValue);

  const { db } = useDB();
  const { data: collections } = useData('collection', {});

  const [resetIndexLoading, setResetIndexLoading] = useState(false);
  const isResetIndexReady = collections !== null;
  const resetIndex = useCallback(async () => {
    if (!isResetIndexReady) return;

    try {
      setResetIndexLoading(true);
      await (db as any).search({
        ...SEARCH_OPTIONS,
        destroy: true,
      });
      await (db as any).search({
        ...SEARCH_ITEMS_OPTIONS,
        destroy: true,
      });
      await (db as any).search({
        ...SEARCH_ITEM_AS_CONTAINER_OPTIONS,
        destroy: true,
      });
      for (const collection of collections) {
        if (!collection.__id) continue;
        const searchOptions = getItemSearchOptionsForCollection(
          collection.__id,
        );
        await (db as any).search({
          ...searchOptions,
          destroy: true,
        });
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert(
        'Reset Index Done',
        'Index has been reset, the first search may take some more time to wait for the index to be built up.',
      );
    } catch (e: any) {
      Alert.alert(e?.message, JSON.stringify(e?.stack));
    } finally {
      setResetIndexLoading(false);
    }
  }, [collections, db, isResetIndexReady]);

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  // const handleDone = useCallback(() => {
  //   if (!value) return;

  //   callback(value);
  //   navigation.goBack();
  // }, [callback, value, navigation]);

  // const isCancel = useRef(false);
  // const handleLeave = useCallback(
  //   (confirm: () => void) => {
  //     if (isCancel.current) return confirm();
  //     if (!value) return confirm();

  //     callback(value);
  //     confirm();
  //   },
  //   [callback, value],
  // );

  // const cancel = useCallback(() => {
  //   isCancel.current = true;
  //   navigation.goBack();
  // }, [navigation]);

  return (
    <ModalContent
      navigation={navigation}
      title="Search Options"
      // preventClose={true}
      // confirmCloseFn={handleLeave}
      // action2Label="Cancel"
      // onAction2Press={cancel}
      // action1Label={value ? 'Done' : undefined}
      // // action1MaterialIconName="check"
      // onAction1Press={handleDone}
    >
      <ModalContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />
        <UIGroup
          loading={resetIndexLoading}
          footer="Resetting the search index might resolve some search issues. After resetting the index, the first search may take some more time to wait for the index to be built up."
        >
          <UIGroup.ListItem
            button
            // destructive
            label="Reset Search Index"
            onPress={resetIndex}
            disabled={!isResetIndexReady || resetIndexLoading}
          />
        </UIGroup>
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default SearchOptionsScreen;
