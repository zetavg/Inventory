import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  LayoutAnimation,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import SearchBar from 'react-native-platform-searchbar';

import { DEFAULT_LAYOUT_ANIMATION_CONFIG } from '@app/consts/animations';
import { IconName, ICONS } from '@app/consts/icons';

import cs from '@app/utils/commonStyles';
import objectEntries from '@app/utils/objectEntries';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useColors from '@app/hooks/useColors';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import Icon from '@app/components/Icon';
import InsetGroup from '@app/components/InsetGroup';
import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

function SelectIconScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'SelectIcon'>) {
  const { callback, defaultValue } = route.params;

  const [shownIconsLimit, setShownIconsLimit] = useState<number | null>(100);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShownIconsLimit(null);
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  const [value, setValue] = useState(defaultValue);
  const [search, setSearch] = useState('');

  const iconNames = useMemo(() => {
    let iconEntries = objectEntries(ICONS);

    if (search) {
      const searchTerm = search.toLowerCase();
      iconEntries = iconEntries.filter(([k, v]) =>
        `${k} ${(v as any).keywords}`.match(searchTerm),
      );
    }

    LayoutAnimation.configureNext(DEFAULT_LAYOUT_ANIMATION_CONFIG);

    return iconEntries.map(([k]) => k);
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

  const handleIconPress = useCallback((iconName: IconName) => {
    ReactNativeHapticFeedback.trigger('clockTick');
    setValue(iconName);
  }, []);

  return (
    <ModalContent
      navigation={navigation}
      title="Select Icon"
      preventClose={true}
      confirmCloseFn={handleLeave}
      action2Label="Cancel"
      onAction2Press={cancel}
      action1Label={value ? 'Select' : undefined}
      // action1MaterialIconName="check"
      onAction1Press={handleSelect}
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
            cancelTextStyle={{
              color: iosTintColor,
            }}
            onFocus={() => scrollViewRef?.current?.scrollTo({ y: -9999 })}
          />
        </View>
        <UIGroup style={[cs.centerChildren]} placeholder="No matched icons">
          {iconNames.length > 0 && (
            <View style={styles.iconsContainer}>
              {(shownIconsLimit
                ? iconNames.slice(0, shownIconsLimit)
                : iconNames
              ).map(iconName => (
                <IconItemMemo
                  key={iconName}
                  iconName={iconName}
                  selected={iconName === value}
                  onPress={handleIconPress}
                />
                // <TouchableWithoutFeedback
                //   key={iconName}
                //   onPress={() => {
                //     ReactNativeHapticFeedback.trigger('clockTick');
                //     setValue(iconName);
                //   }}
                // >
                //   <View
                //     style={[
                //       styles.iconItemContainer,
                //       iconName === value && { borderColor: iosTintColor },
                //     ]}
                //   >
                //     <Icon name={iconName} size={20} />
                //   </View>
                // </TouchableWithoutFeedback>
              ))}
            </View>
          )}
        </UIGroup>
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

function IconItem({
  iconName,
  selected,
  onPress,
}: {
  iconName: IconName;
  onPress: (iconName: IconName) => void;
  selected: boolean;
}) {
  const { iosTintColor } = useColors();

  return (
    <TouchableWithoutFeedback
      key={iconName}
      onPress={
        selected
          ? undefined
          : () => {
              onPress(iconName);
            }
      }
    >
      <View
        style={[
          styles.iconItemContainer,
          selected && { borderColor: iosTintColor },
        ]}
      >
        <Icon name={iconName} size={20} />
      </View>
    </TouchableWithoutFeedback>
  );
}

const IconItemMemo = React.memo(IconItem);

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
