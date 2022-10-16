import React, { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import commonStyles from '@app/utils/commonStyles';
import ModalContent from '@app/components/ModalContent';
import InsetGroup from '@app/components/InsetGroup';

import useDB from '@app/hooks/useDB';
import SEARCH_OPTIONS from '../consts/SEARCH_OPTIONS';

function SearchOptionsScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'SearchOptions'>) {
  const { callback, defaultValue } = route.params;
  const [value, setValue] = useState(defaultValue);

  const { db } = useDB();

  const [resetIndexLoading, setResetIndexLoading] = useState(false);
  const resetIndex = useCallback(async () => {
    try {
      setResetIndexLoading(true);
      await (db as any).search({
        ...SEARCH_OPTIONS,
        destroy: true,
      });
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
  }, [db]);

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  const handleDone = useCallback(() => {
    if (!value) return;

    callback(value);
    navigation.goBack();
  }, [callback, value, navigation]);

  const isCancel = useRef(false);
  const handleLeave = useCallback(
    (confirm: () => void) => {
      if (isCancel.current) return confirm();
      if (!value) return confirm();

      callback(value);
      confirm();
    },
    [callback, value],
  );

  const cancel = useCallback(() => {
    isCancel.current = true;
    navigation.goBack();
  }, [navigation]);

  return (
    <ModalContent
      navigation={navigation}
      title="Search Options"
      preventClose={true}
      confirmCloseFn={handleLeave}
      action2Label="Cancel"
      onAction2Press={cancel}
      action1Label={value ? 'Done' : undefined}
      // action1MaterialIconName="check"
      onAction1Press={handleDone}
    >
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={commonStyles.mt16} />
        <InsetGroup
          loading={resetIndexLoading}
          footerLabel="Resetting the search index might resolve some search issues. After resetting the index, the first search may take some more time to wait for the index to be built up."
          style={commonStyles.mh0}
        >
          <InsetGroup.Item
            button
            // destructive
            label="Reset Search Index"
            onPress={resetIndex}
          />
        </InsetGroup>
      </ScrollView>
    </ModalContent>
  );
}

export default SearchOptionsScreen;
