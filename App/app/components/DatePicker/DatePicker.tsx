import React, { useCallback, useMemo } from 'react';
import {
  Platform,
  StyleSheet,
  Text as RNText,
  TouchableOpacity,
  View,
} from 'react-native';

import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';

import commonStyles from '@app/utils/commonStyles';

import useColors from '@app/hooks/useColors';
import useIsDarkMode from '@app/hooks/useIsDarkMode';

import Text from '@app/components/Text';

type DateType = {
  y: number;
  m: number;
  d: number;
};

type Props = {
  value: DateType | undefined | null;
  onChangeValue?: (value: DateType | undefined) => void;
  textProps?: React.ComponentProps<typeof RNText>;
  style?: React.ComponentProps<typeof View>['style'];
  iosStyle?: React.ComponentProps<typeof View>['style'];
  androidStyle?: React.ComponentProps<typeof View>['style'];
};

export default function DatePicker({
  value,
  onChangeValue,
  textProps,
  style,
  iosStyle,
  androidStyle,
}: Props) {
  const { contentBackgroundColor, iosTintColor, contentTextColor } =
    useColors();
  const isDarkMode = useIsDarkMode();
  const iosBackgroundColor = isDarkMode ? '#313135' : '#EEEEEF';
  const date = useMemo(() => {
    return value ? new Date(value.y, value.m - 1, value.d) : new Date();
  }, [value]);

  const androidShowDatePicker = useCallback(() => {
    if (Platform.OS !== 'android') return;

    DateTimePickerAndroid.open({
      value: date,
      onChange: (event, d) => {
        if (event.type === 'dismissed') return;
        if (!onChangeValue) return;
        if (!d) {
          onChangeValue(d);
        } else {
          onChangeValue({
            y: d.getFullYear(),
            m: d.getMonth() + 1,
            d: d.getDate(),
          });
        }
      },
      mode: 'date',
    });
  }, [onChangeValue, date]);

  switch (Platform.OS) {
    case 'ios': {
      const element = (
        <DateTimePicker
          mode="date"
          display="compact"
          value={date}
          onChange={(_event, d) => {
            if (!onChangeValue) return;
            if (!d) {
              onChangeValue(d);
            } else {
              onChangeValue({
                y: d.getFullYear(),
                m: d.getMonth() + 1,
                d: d.getDate(),
              });
            }
          }}
          style={styles.iosDatePicker}
          accentColor={iosTintColor}
        />
      );

      return (
        <View style={[styles.iosDatePickerContainer, style, iosStyle]}>
          {element}
          <View
            style={[
              styles.iosPlaceholderContainer,
              {
                backgroundColor: contentBackgroundColor,
              },
              value ? styles.opacity0 : {},
            ]}
            pointerEvents="none"
          >
            <View
              style={[
                styles.iosPlaceholder,
                {
                  backgroundColor: iosBackgroundColor,
                },
              ]}
            >
              <View
                style={[
                  styles.iosPlaceholderContent,
                  {
                    backgroundColor: contentTextColor,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      );
    }
    case 'android': {
      return (
        <TouchableOpacity
          onPress={androidShowDatePicker}
          style={[style, androidStyle]}
        >
          <Text {...textProps}>
            {value ? date.toLocaleDateString() : 'Not Set'}
          </Text>
        </TouchableOpacity>
      );
    }
    default:
      return <Text {...textProps}>This platform is not supported.</Text>;
  }
}

const styles = StyleSheet.create({
  iosDatePicker: {
    flexGrow: 1,
    flexShrink: 0,
  },
  iosDatePickerContainer: {
    flexGrow: 1,
    flexShrink: 0,
  },
  iosPlaceholderContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  iosPlaceholder: {
    height: 36,
    width: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosPlaceholderContent: {
    height: 1,
    width: 16,
    opacity: 0.2,
  },
  opacity0: {
    opacity: 0,
  },
});
