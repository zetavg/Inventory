import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useDB from '@app/hooks/useDB';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

import {
  DEFAULT_SEARCH_FIELDS,
  DEFAULT_SEARCH_LANGUAGES,
} from './PouchDBScreen';

function PouchDBSettingsScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'PouchDBSettings'>) {
  const { db } = useDB();
  const {
    searchFields,
    setSearchFields,
    searchLanguages,
    setSearchLanguages,
    resetSearchIndexRef,
  } = route.params;
  const rootNavigation = useRootNavigation();

  const [searchFieldsStr, setSearchFieldsStr] = useState(
    JSON.stringify(searchFields, null, 2),
  );
  const searchFieldsStrErrorMessage = useMemo(() => {
    let json;
    try {
      json = JSON.parse(searchFieldsStr);
      if (Array.isArray(json)) {
        if (!json.every(item => typeof item === 'string')) {
          return '⚠ All items in the array should be strings';
        }
      } else if (typeof json === 'object') {
        if (!Object.entries(json).every(([_k, v]) => typeof v === 'number')) {
          return '⚠ All values in the object should be numbers';
        }
      } else {
        return '⚠ Should be an array or an object';
      }
    } catch (_) {
      return '⚠ Invalid JSON';
    }
    return undefined;
  }, [searchFieldsStr]);
  const handleSaveSearchFields = useCallback(() => {
    if (searchFieldsStrErrorMessage) return;
    setSearchFields(JSON.parse(searchFieldsStr));
  }, [searchFieldsStr, searchFieldsStrErrorMessage, setSearchFields]);
  const handleSetSearchFieldsToDefault = useCallback(() => {
    setSearchFields(DEFAULT_SEARCH_FIELDS);
    setSearchFieldsStr(JSON.stringify(DEFAULT_SEARCH_FIELDS, null, 2));
  }, [setSearchFields]);

  const [searchLanguagesStr, setSearchLanguagesStr] = useState(
    JSON.stringify(searchLanguages, null, 2),
  );
  const searchLanguagesStrErrorMessage = useMemo(() => {
    let json;
    try {
      json = JSON.parse(searchLanguagesStr);
      if (Array.isArray(json)) {
        if (!json.every(item => typeof item === 'string')) {
          return '⚠ All items in the array should be strings';
        }
      } else {
        return '⚠ Should be an array or an object';
      }
    } catch (_) {
      return '⚠ Invalid JSON';
    }
    return undefined;
  }, [searchLanguagesStr]);
  const handleSaveSearchLanguages = useCallback(() => {
    if (searchLanguagesStrErrorMessage) return;
    setSearchLanguages(JSON.parse(searchLanguagesStr));
  }, [searchLanguagesStr, searchLanguagesStrErrorMessage, setSearchLanguages]);
  const handleSetSearchLanguagesToDefault = useCallback(() => {
    setSearchLanguages(DEFAULT_SEARCH_LANGUAGES);
    setSearchLanguagesStr(JSON.stringify(DEFAULT_SEARCH_LANGUAGES, null, 2));
  }, [setSearchLanguages]);

  const [resetSearchIndexLoading, setResetSearchIndexLoading] = useState(false);
  const resetSearchIndex = useCallback(async () => {
    try {
      setResetSearchIndexLoading(true);
      await resetSearchIndexRef.current();
      Alert.alert('Reset Index Done', 'The search index has been reset.');
    } catch (e: any) {
      Alert.alert(e?.message, JSON.stringify(e?.stack));
    } finally {
      setResetSearchIndexLoading(false);
    }
  }, [resetSearchIndexRef]);

  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  return (
    <ScreenContent
      navigation={navigation}
      title="Settings"
      headerLargeTitle={false}
    >
      <ScreenContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />

        <UIGroup
          loading={resetSearchIndexLoading}
          footer={searchFieldsStrErrorMessage}
        >
          <UIGroup.ListTextInputItem
            label="Search Fields"
            monospaced
            multiline
            value={searchFieldsStr}
            onChangeText={setSearchFieldsStr}
            rightElement={
              <UIGroup.ListTextInputItem.Button
                onPress={handleSetSearchFieldsToDefault}
              >
                Set to Default
              </UIGroup.ListTextInputItem.Button>
            }
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            button
            disabled={!!searchFieldsStrErrorMessage}
            label="Save"
            onPress={handleSaveSearchFields}
          />
        </UIGroup>

        <UIGroup
          loading={resetSearchIndexLoading}
          footer={searchLanguagesStrErrorMessage}
        >
          <UIGroup.ListTextInputItem
            label="Search Languages"
            monospaced
            multiline
            value={searchLanguagesStr}
            onChangeText={setSearchLanguagesStr}
            rightElement={
              <UIGroup.ListTextInputItem.Button
                onPress={handleSetSearchLanguagesToDefault}
              >
                Set to Default
              </UIGroup.ListTextInputItem.Button>
            }
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            button
            disabled={!!searchLanguagesStrErrorMessage}
            label="Save"
            onPress={handleSaveSearchLanguages}
          />
        </UIGroup>

        <UIGroup
          loading={resetSearchIndexLoading}
          footer="Resetting the search index might resolve some search issues."
        >
          <UIGroup.ListItem
            button
            label="Reset Search Index"
            onPress={resetSearchIndex}
          />
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default PouchDBSettingsScreen;
