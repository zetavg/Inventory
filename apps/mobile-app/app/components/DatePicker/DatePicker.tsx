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
  /** iOS DateTimePicker must have a value provided, so if the current value is blank, we use today as the date shown on UI. However, the current date will not be pressable on the DateTimePicker, and it will cause some inconvenience if the user want to select today's date (they will need to select another date, and select back). With this prop, we can change the default shown date to tomorrow to avoid this inconvenience. */
  iosBlankDateWorkaround?: 'tmr';
};

export default function DatePicker({
  value,
  onChangeValue,
  textProps,
  style,
  iosStyle,
  androidStyle,
  iosBlankDateWorkaround,
}: Props) {
  const { contentBackgroundColor, iosTintColor, contentTextColor } =
    useColors();
  const isDarkMode = useIsDarkMode();
  const iosBackgroundColor = isDarkMode ? '#313135' : '#EEEEEF';
  const date = useMemo(() => {
    return value
      ? new Date(value.y, value.m - 1, value.d)
      : (() => {
          const d = new Date();
          if (iosBlankDateWorkaround === 'tmr') {
            d.setDate(d.getDate() - 1);
          }
          return d;
        })();
  }, [iosBlankDateWorkaround, value]);

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
