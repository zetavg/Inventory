import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableWithoutFeedback,
} from 'react-native';
import SearchBar from 'react-native-platform-searchbar';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import cs from '@app/utils/commonStyles';

import useColors from '@app/hooks/useColors';
import ModalContent from '@app/components/ModalContent';
import InsetGroup from '@app/components/InsetGroup';
import Icon from '@app/components/Icon';

import { ICONS } from '@app/consts/icons';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import objectEntries from '@app/utils/objectEntries';
import { useRelationalData } from '@app/db';
import useOrderedData from '@app/hooks/useOrderedData';
import CollectionItem from '../components/CollectionItem';

function SelectCollectionScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'SelectCollection'>) {
  const { callback, defaultValue } = route.params;
  const [value, setValue] = useState(defaultValue);
  const [search, setSearch] = useState('');

  const { data, reloadData } = useRelationalData('collection');
  const { orderedData, reloadOrder, updateOrder } = useOrderedData({
    data,
    settingName: 'collections',
  });

  const collections = useMemo(() => {
    if (!orderedData) return orderedData;

    if (search) {
      const searchTerm = search.toLowerCase();
      return orderedData.filter(c =>
        `${c.collectionReferenceNumber} ${c.name.toLowerCase()}`.match(
          searchTerm,
        ),
      );
    }

    return orderedData;
  }, [orderedData, search]);

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  const isDarkMode = useIsDarkMode();
  const { iosTintColor } = useColors();

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
    >
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.searchBarContainer}>
          <SearchBar
            theme={isDarkMode ? 'dark' : 'light'}
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            onFocus={() => scrollViewRef?.current?.scrollTo({ y: -9999 })}
          />
        </View>
        <InsetGroup loading={!orderedData}>
          {collections &&
            collections
              .flatMap(collection => [
                <CollectionItem
                  key={collection.id}
                  reloadCounter={0}
                  hideDetails
                  collection={collection}
                  onPress={() => setValue(collection.id)}
                  arrow={false}
                  selected={collection.id === value}
                />,
                <InsetGroup.ItemSeparator
                  key={`s-${collection.id}`}
                  // leftInset={50}
                  leftInset={60}
                />,
              ])
              .slice(0, -1)}
        </InsetGroup>
      </ScrollView>
    </ModalContent>
  );
}

const styles = StyleSheet.create({
  searchBarContainer: {
    marginTop: InsetGroup.MARGIN_HORIZONTAL,
    marginHorizontal: InsetGroup.MARGIN_HORIZONTAL,
    marginBottom: InsetGroup.MARGIN_HORIZONTAL,
  },
  iconsContainer: {
    marginHorizontal: 'auto',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  iconItemContainer: {
    marginVertical: 4,
    marginHorizontal: 4,
    width: 40,
    height: 40,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SelectCollectionScreen;
