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

function SelectIconScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'SelectIcon'>) {
  const { callback, defaultValue } = route.params;
  const [value, setValue] = useState(defaultValue);
  const [search, setSearch] = useState('');

  const iconNames = useMemo(() => {
    let iconEnteries = objectEntries(ICONS);

    if (search) {
      const searchTerm = search.toLowerCase();
      iconEnteries = iconEnteries.filter(([k, v]) =>
        `${k} ${v.keywords}`.match(searchTerm),
      );
    }

    return iconEnteries.map(([k]) => k);
  }, [search]);

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  const isDarkMode = useIsDarkMode();
  const { iosTintColor } = useColors();

  const handleSelect = useCallback(() => {
    if (!value) return;

    callback(value);
    navigation.goBack();
  }, [callback, value, navigation]);

  return (
    <ModalContent
      navigation={navigation}
      title="Select Icon"
      backButtonLabel="Cancel"
      action1Label={value ? 'Select' : undefined}
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
          />
        </View>
        <InsetGroup style={[cs.centerChildren]}>
          <View style={styles.iconsContainer}>
            {iconNames.map(iconName => (
              <TouchableWithoutFeedback
                key={iconName}
                onPress={() => setValue(iconName)}
              >
                <View
                  style={[
                    styles.iconItemContainer,
                    iconName === value && { borderColor: iosTintColor },
                  ]}
                >
                  <Icon name={iconName} />
                </View>
              </TouchableWithoutFeedback>
            ))}
          </View>
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

export default SelectIconScreen;
