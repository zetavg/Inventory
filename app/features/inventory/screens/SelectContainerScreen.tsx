import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import SearchBar from 'react-native-platform-searchbar';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import useColors from '@app/hooks/useColors';
import ModalContent from '@app/components/ModalContent';
import InsetGroup from '@app/components/InsetGroup';

import useIsDarkMode from '@app/hooks/useIsDarkMode';

import useDB from '@app/hooks/useDB';
import { DataTypeWithID } from '@app/db/relationalUtils';
import ItemItem from '../components/ItemItem';

function SelectContainerScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'SelectContainer'>) {
  const { callback, defaultValue } = route.params;
  const [value, setValue] = useState(defaultValue);
  const { db } = useDB();
  const [search, setSearch] = useState('');

  const [data, setData] = useState<null | ReadonlyArray<
    DataTypeWithID<'item'>
  >>(null);
  const loadData = useCallback(async () => {
    await db.indexesReady;
    const result = await db.find({
      selector: {
        $and: [
          { type: 'item' },
          { 'data.isContainer': true },
          { 'data.updatedAt': { $gt: null } },
        ],
      },
      sort: [
        { type: 'desc' },
        { 'data.isContainer': 'desc' },
        { 'data.updatedAt': 'desc' },
      ],
      use_index: 'index-item-isContainer',
    });
    const { docs } = result;
    const d = docs.map(({ _id, data: d2 }: any) => ({
      ...d2,
      id: _id.replace(/^item-[0-9]-/, ''),
    }));
    setData(d);
  }, [db]);
  useEffect(() => {
    loadData();
  }, [loadData]);

  const searchedData = useMemo(() => {
    if (!data) return data;

    return data.filter(item =>
      ` ${item.name} ${item.individualAssetReference} ${
        (item._collectionData as DataTypeWithID<'collection'> | undefined)?.name
      } ${
        (item._collectionData as DataTypeWithID<'collection'> | undefined)
          ?.collectionReferenceNumber
      }`
        .toLowerCase()
        .match(search.toLowerCase()),
    );
  }, [data, search]);

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
      title="Select Container"
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
        <InsetGroup loading={!data}>
          {searchedData &&
            searchedData
              .flatMap(item => [
                <ItemItem
                  key={item.id}
                  item={item}
                  reloadCounter={0}
                  onPress={() => setValue(item.id)}
                  arrow={false}
                  // hideDetails
                  selected={item.id === value}
                />,
                <InsetGroup.ItemSeparator
                  key={`s-${item.id}`}
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

export default SelectContainerScreen;
