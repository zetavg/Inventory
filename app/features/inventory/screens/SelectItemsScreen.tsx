import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import SearchBar from 'react-native-platform-searchbar';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import useColors from '@app/hooks/useColors';
import ModalContent from '@app/components/ModalContent';
import InsetGroup from '@app/components/InsetGroup';
import Text from '@app/components/Text';

import useIsDarkMode from '@app/hooks/useIsDarkMode';

import useDB from '@app/hooks/useDB';
import { getDataFromDocs } from '@app/db/hooks';
import { DataTypeWithID } from '@app/db/relationalUtils';
import ItemItem from '../components/ItemItem';

import { SEARCH_ITEMS_OPTIONS } from '../consts/SEARCH_OPTIONS';
import commonStyles from '@app/utils/commonStyles';

function SelectItemsScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'SelectItems'>) {
  const { callback, defaultValue } = route.params;
  const [value, setValue] = useState(() => ({ set: new Set(defaultValue) }));
  const { db } = useDB();
  const [search, setSearch] = useState('');
  const [showSelected, setShowSelected] = useState(false);

  const [data, setData] = useState<null | ReadonlyArray<
    DataTypeWithID<'item'>
  >>(null);
  const loadData = useCallback(async () => {
    if (search) {
      const result = await (db as any).search({
        ...SEARCH_ITEMS_OPTIONS,
        query: search,
      });
      console.log(result);
      setData(
        getDataFromDocs(
          'item',
          result.rows.map(({ doc }: any) => doc),
        ),
      );
      return;
    }

    if (showSelected) {
      const promises = Array.from(value.set).map(async id => {
        try {
          const doc = await db.get(`item-2-${id}`);
          if (doc.type !== 'item') return null;
          const [d] = getDataFromDocs('item', [doc]);
          if (!d) return null;

          return d;
        } catch (e) {
          // Handle non-404 errors
          return null;
        }
      });
      const its = (await Promise.all(promises)).filter(
        (i): i is DataTypeWithID<'item'> & { checklistItemId: string } => !!i,
      );
      setData(its);
      return;
    }

    await db.indexesReady;
    const result = await db.find({
      selector: {
        $and: [{ type: 'item' }, { 'data.updatedAt': { $gt: null } }],
      },
      sort: [{ type: 'desc' }, { 'data.updatedAt': 'desc' }],
      limit: 30,
      use_index: 'index-type-updatedAt',
    });
    const { docs } = result;
    const d = docs.map(({ _id, data: d2 }: any) => ({
      ...d2,
      id: _id.replace(/^item-[0-9]-/, ''),
    }));
    setData(d);
  }, [db, search, showSelected, value]);
  useEffect(() => {
    loadData();
  }, [loadData]);

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  const isDarkMode = useIsDarkMode();

  const handleSelect = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const isCancel = useRef(false);
  const handleLeave = useCallback(
    (confirm: () => void) => {
      if (isCancel.current) return confirm();
      callback(Array.from(value.set));
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
      title="Select Items"
      preventClose={true}
      confirmCloseFn={handleLeave}
      action2Label="Cancel"
      onAction2Press={cancel}
      action1Label={value.set.size > 0 ? 'Done' : undefined}
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
        <InsetGroup
          loading={!data}
          label={search ? undefined : `${value.set.size} Items Selected`}
          labelRight={
            search ? undefined : (
              <InsetGroup.GroupLabelRightButton
                label={showSelected ? 'Show All' : 'Show Selected'}
                onPress={() => setShowSelected(v => !v)}
              />
            )
          }
        >
          {data && data.length > 0 ? (
            data
              .flatMap(item => [
                <ItemItem
                  key={item.id}
                  item={item}
                  reloadCounter={0}
                  onPress={() =>
                    setValue(({ set }) => {
                      if (!item.id) return { set };

                      if (set.has(item.id)) {
                        set.delete(item.id);
                      } else {
                        set.add(item.id);
                      }

                      return { set };
                    })
                  }
                  arrow={false}
                  // hideDetails
                  selected={value.set.has(item.id || '')}
                />,
                <InsetGroup.ItemSeparator
                  key={`s-${item.id}`}
                  // leftInset={50}
                  leftInset={60}
                />,
              ])
              .slice(0, -1)
          ) : (
            <Text
              style={[commonStyles.tac, commonStyles.mv16, commonStyles.mh16]}
            >
              No items
            </Text>
          )}
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

export default SelectItemsScreen;
