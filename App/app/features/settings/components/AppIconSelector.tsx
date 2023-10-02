import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import ChangeAppIcon from '@app/modules/ChangeAppIcon';

import useColors from '@app/hooks/useColors';

import UIGroup from '@app/components/UIGroup';

const APP_NAME = DeviceInfo.getApplicationName();

export const APP_ICONS: ReadonlyArray<{
  name: string;
  value: string;
  isDefault?: boolean;
}> = [
  // {
  //   name: 'Default',
  //   value: (() => {
  //     if (APP_NAME.endsWith('(Dev)')) {
  //       return 'AppIcon-dev';
  //     } else if (APP_NAME.endsWith('(Nightly)')) {
  //       return 'AppIcon-stg';
  //     } else {
  //       return 'AppIcon';
  //     }
  //   })(),
  //   isDefault: true,
  // },
  { name: 'Inventory', value: 'AppIcon' },
  { name: 'Dark', value: 'AppIcon-dark' },
  { name: 'Black', value: 'AppIcon-black' },
  { name: 'Nightly', value: 'AppIcon-stg' },
  { name: 'Development', value: 'AppIcon-dev' },
].map(icon => {
  if (APP_NAME.endsWith('(Dev)')) {
    if (icon.name === 'Development') {
      return { name: 'Default', value: icon.value, isDefault: true };
    }
  } else if (APP_NAME.endsWith('(Nightly)')) {
    if (icon.name === 'Nightly') {
      return { name: 'Default', value: icon.value, isDefault: true };
    }
  } else if (icon.name === 'Inventory') {
    return { name: 'Default', value: icon.value, isDefault: true };
  }

  return icon;
});

type Props = {};

export default function AppIconSelector({}: Props) {
  const { gray, iosTintColor, contentSecondaryTextColor } = useColors();
  const [loading, setLoading] = useState(true);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  useEffect(() => {
    ChangeAppIcon.get()
      .then(setSelectedIcon)
      .then(() => setLoading(false));
  }, []);

  const setIcon = useCallback(
    (v: string) => {
      const prevSelectedIcon = selectedIcon;
      ReactNativeHapticFeedback.trigger('impactLight');
      setSelectedIcon(v);
      ChangeAppIcon.set(v).catch(() => {
        ReactNativeHapticFeedback.trigger('impactLight');
        setSelectedIcon(prevSelectedIcon);
      });
    },
    [selectedIcon],
  );

  return (
    <UIGroup loading={loading}>
      <UIGroup.ListTextInputItem
        label="App Icon"
        inputElement={
          <View style={styles.inputElementContainer}>
            <ScrollView
              horizontal
              contentContainerStyle={styles.iconsScrollViewContentContainer}
            >
              {APP_ICONS.map(({ name, value, isDefault }) => {
                const selected =
                  value === selectedIcon ||
                  (isDefault && selectedIcon === 'default');

                return (
                  <TouchableOpacity
                    key={value}
                    style={styles.iconContainer}
                    disabled={selected}
                    onPress={() => setIcon(isDefault ? 'default' : value)}
                  >
                    <View
                      style={[
                        styles.iconImageContainer,
                        selected && {
                          borderColor: iosTintColor,
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: value }}
                        style={[
                          styles.iconImage,
                          { backgroundColor: gray, borderColor: gray },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.iconText,
                        { color: contentSecondaryTextColor },
                      ]}
                    >
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
      />
    </UIGroup>
  );
}

const styles = StyleSheet.create({
  inputElementContainer: {
    flex: 1,
    marginHorizontal: -2,
  },
  iconsScrollViewContentContainer: {
    gap: 8,
    paddingVertical: 8,
  },
  iconContainer: {
    alignItems: 'center',
  },
  iconImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  iconImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    // borderWidth: StyleSheet.hairlineWidth,
  },
  iconText: {
    marginTop: 1,
    fontSize: 12,
  },
});
