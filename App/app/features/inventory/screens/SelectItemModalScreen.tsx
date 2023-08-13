import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LayoutAnimation, ScrollView, StyleSheet, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import SearchBar from 'react-native-platform-searchbar';

import { DEFAULT_LAYOUT_ANIMATION_CONFIG } from '@app/consts/animations';

import {
  DataTypeWithAdditionalInfo,
  onlyValid,
  useConfig,
  useData,
} from '@app/data';
import { getDatumFromDoc } from '@app/data/pouchdb-utils';

import { useDB } from '@app/db';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useLogger from '@app/hooks/useLogger';
import useOrdered from '@app/hooks/useOrdered';

import InsetGroup from '@app/components/InsetGroup';
import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

import CollectionListItem from '../components/CollectionListItem';
import ItemListItem from '../components/ItemListItem';
import {
  SEARCH_ITEM_AS_CONTAINER_OPTIONS,
  SEARCH_ITEMS_OPTIONS,
} from '../consts/SEARCH_OPTIONS';

function SelectItemModalScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'SelectItem'>) {
  const logger = useLogger('SelectItemModalScreen');
  const { callback, defaultValue, as } = route.params;
  const [value, setValue] = useState(defaultValue);
  const [search, setSearch] = useState('');

  const cond = useMemo(() => {
    switch (as) {
      case 'container':
        return { _can_contain_items: true };
      default:
        return {};
    }
  }, [as]);

  const { data, loading: dataLoading } = useData('item', cond, {
    sort: [{ __updated_at: 'desc' }],
    limit: 100,
  });
  const orderedData = data && onlyValid(data);

  const [searched, setSearched] = useState('');
  const [searchResults, setSearchResults] = useState<
    DataTypeWithAdditionalInfo<'item'>[] | null
  >(null);
  const { db } = useDB();
  const doSearch = useCallback(
    async (c?: { canceled: boolean }) => {
      if (!db) return;
      if (!search) return;

      let searchOptions = SEARCH_ITEMS_OPTIONS;

      if (as === 'container') {
        searchOptions = SEARCH_ITEM_AS_CONTAINER_OPTIONS;
      }

      const results: PouchDB.Core.AllDocsResponse<{}> = await (
        db as any
      ).search({
        query: search,
        ...searchOptions,
        include_docs: true,
        skip: 0,
        limit: 100,
      });

      if (c?.canceled) return;

      const d = results.rows.map(r =>
        getDatumFromDoc('item', r.doc || null, logger),
      );
      const validData = onlyValid(d);

      setSearchResults(validData);
      setSearched(search);
    },
    [db, search, as, logger],
  );
  useEffect(() => {
    const c = { canceled: false };
    doSearch(c);
    return () => {
      c.canceled = true;
    };
  }, [doSearch]);

  const loading = search ? searched !== search : dataLoading;

  const items = useMemo(() => {
    if (!orderedData) return orderedData;

    LayoutAnimation.configureNext(DEFAULT_LAYOUT_ANIMATION_CONFIG);

    if (search) {
      if ((searchResults?.length || 0) <= 0) return null;
      return searchResults;
    }

    return orderedData;
  }, [orderedData, search, searchResults]);

  const scrollViewRef = useRef<ScrollView>(null);

  const handleSelect = useCallback(() => {
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

  const isDarkMode = useIsDarkMode();

  return (
    <ModalContent
      navigation={navigation}
      title={`Select ${(() => {
        switch (as) {
          case 'container':
            return 'Container';
          default:
            return 'Item';
        }
      })()}`}
      preventClose={true}
      confirmCloseFn={handleLeave}
      action2Label="Cancel"
      onAction2Press={cancel}
      action1Label={value ? 'Select' : undefined}
      // action1MaterialIconName="check"
      onAction1Press={handleSelect}
      action1Variant="strong"
    >
      <ModalContent.ScrollView
        ref={scrollViewRef}
        automaticallyAdjustKeyboardInsets={false}
      >
        <View style={styles.searchBarContainer}>
          <SearchBar
            theme={isDarkMode ? 'dark' : 'light'}
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            // onFocus={() => scrollViewRef?.current?.scrollTo({ y: -9999 })}
            autoFocus
          />
        </View>
        <UIGroup
          loading={loading}
          placeholder={
            search ? (loading ? undefined : 'No matching items') : undefined
          }
        >
          {items &&
            items
              .flatMap(item => [
                <ItemListItem
                  key={item.__id}
                  reloadCounter={0}
                  hideDetails
                  item={item}
                  onPress={() => setValue(item.__id)}
                  navigable={false}
                  selected={item.__id === value}
                />,
                <UIGroup.ListItemSeparator
                  forItemWithIcon
                  key={`s-${item.__id}`}
                />,
              ])
              .slice(0, -1)}
        </UIGroup>
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

const styles = StyleSheet.create({
  searchBarContainer: {
    marginTop: InsetGroup.MARGIN_HORIZONTAL,
    marginHorizontal: InsetGroup.MARGIN_HORIZONTAL,
    marginBottom: InsetGroup.MARGIN_HORIZONTAL,
  },
});

export default SelectItemModalScreen;
