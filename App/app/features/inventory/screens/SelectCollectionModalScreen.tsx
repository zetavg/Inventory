import React, { useCallback, useMemo, useRef, useState } from 'react';
import { LayoutAnimation, ScrollView, StyleSheet, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import SearchBar from 'react-native-platform-searchbar';

import { onlyValid, useConfig, useData } from '@app/data';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useOrdered from '@app/hooks/useOrdered';

import InsetGroup from '@app/components/InsetGroup';
import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

import CollectionListItem from '../components/CollectionListItem';

const LAYOUT_ANIMATION_CONFIG = {
  ...LayoutAnimation.Presets.easeInEaseOut,
  duration: 100,
};

function SelectCollectionModalScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'SelectCollection'>) {
  const { callback, defaultValue } = route.params;
  const [value, setValue] = useState(defaultValue);
  const [search, setSearch] = useState('');

  const { data, loading: dataLoading } = useData(
    'collection',
    {},
    { sort: [{ __created_at: 'asc' }] },
  );
  const { config, loading: configLoading } = useConfig();
  const [orderedData] = useOrdered(
    data && onlyValid(data),
    config?.collections_order || [],
  );

  const loading = dataLoading || configLoading;

  const collections = useMemo(() => {
    if (!orderedData) return orderedData;

    if (search) {
      const searchTerm = search.toLowerCase();
      return orderedData.filter(c =>
        `${c.collection_reference_number} ${c.name.toLowerCase()}`.match(
          searchTerm,
        ),
      );
    }

    LayoutAnimation.configureNext(LAYOUT_ANIMATION_CONFIG);

    return orderedData;
  }, [orderedData, search]);

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
      title="Select Collection"
      preventClose={true}
      confirmCloseFn={handleLeave}
      action2Label="Cancel"
      onAction2Press={cancel}
      action1Label={value ? 'Select' : undefined}
      // action1MaterialIconName="check"
      onAction1Press={handleSelect}
      action1Variant="strong"
    >
      <ModalContent.ScrollView ref={scrollViewRef}>
        <View style={styles.searchBarContainer}>
          <SearchBar
            theme={isDarkMode ? 'dark' : 'light'}
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            onFocus={() => scrollViewRef?.current?.scrollTo({ y: -9999 })}
          />
        </View>
        <UIGroup loading={loading}>
          {collections &&
            collections
              .flatMap(collection => [
                <CollectionListItem
                  key={collection.__id}
                  reloadCounter={0}
                  hideDetails
                  collection={collection}
                  onPress={() => setValue(collection.__id)}
                  navigable={false}
                  selected={collection.__id === value}
                />,
                <UIGroup.ListItemSeparator
                  forItemWithIcon
                  key={`s-${collection.__id}`}
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

export default SelectCollectionModalScreen;
