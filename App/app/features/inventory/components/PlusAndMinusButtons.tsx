import React, { useCallback } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { TouchableOpacity, View } from 'react-native';
import { Alert } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import useColors from '@app/hooks/useColors';
import useIsDarkMode from '@app/hooks/useIsDarkMode';

import Icon from '@app/components/Icon';

type Props = {
  value: number;
} & (
  | {
      onChangeValue: (value: number) => void;
      onChangeValueUpdater?: undefined;
    }
  | {
      onChangeValue?: undefined;
      onChangeValueUpdater: (updater: (n: number) => number) => void;
    }
);

export default function PlusAndMinusButtons({
  value,
  onChangeValue,
  onChangeValueUpdater,
}: Props) {
  const isDarkMode = useIsDarkMode();
  const { contentSecondaryTextColor } = useColors();

  const handlePlus = useCallback(() => {
    if (onChangeValue) onChangeValue(value + 1);
    if (onChangeValueUpdater) onChangeValueUpdater(v => v + 1);
  }, [onChangeValue, onChangeValueUpdater, value]);
  const handleMinus = useCallback(() => {
    if (onChangeValue) onChangeValue(value > 0 ? value - 1 : 0);
    if (onChangeValueUpdater) onChangeValueUpdater(v => (v > 0 ? v - 1 : 0));
  }, [onChangeValue, onChangeValueUpdater, value]);

  const handlePlusN = useCallback(() => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('impactMedium', {
        enableVibrateFallback: false,
      });
      Alert.prompt(
        'Add Quantity',
        'Type the quantity to add',
        [
          {
            text: 'Ok',
            onPress: qTxt => {
              if (!qTxt) return;
              const q = parseInt(qTxt, 10);
              if (isNaN(q)) return;

              if (onChangeValue) onChangeValue(value + q);
              if (onChangeValueUpdater) onChangeValueUpdater(v => v + q);
            },
            isPreferred: true,
            style: 'default',
          },
          { text: 'Cancel', style: 'cancel' },
        ],
        'plain-text',
        '10',
        'number-pad',
      );
    }
  }, [onChangeValue, onChangeValueUpdater, value]);
  const handleMinusN = useCallback(() => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('impactMedium', {
        enableVibrateFallback: false,
      });
      Alert.prompt(
        'Add Reduce',
        'Type the quantity to reduce',
        [
          {
            text: 'Ok',
            onPress: qTxt => {
              if (!qTxt) return;
              const q = parseInt(qTxt, 10);
              if (isNaN(q)) return;

              if (onChangeValue) onChangeValue(value > 0 ? value - q : 0);
              if (onChangeValueUpdater)
                onChangeValueUpdater(v => (v > 0 ? v - q : 0));
            },
            isPreferred: true,
            style: 'default',
          },
          { text: 'Cancel', style: 'cancel' },
        ],
        'plain-text',
        '10',
        'number-pad',
      );
    }
  }, [onChangeValue, onChangeValueUpdater, value]);

  const buttonColor = isDarkMode ? '#39393C' : '#E9E9EB';
  return (
    <View style={styles.container}>
      <TouchableOpacity
        disabled={value <= 0}
        onPress={handleMinus}
        onLongPress={handleMinusN}
        style={styles.buttonContainer}
      >
        <View
          style={[
            styles.button,
            styles.buttonLeft,
            value <= 0 && styles.buttonDisabled,
            { backgroundColor: buttonColor },
          ]}
        >
          <Icon
            name="app-minus-without-frame"
            color={contentSecondaryTextColor}
            size={16}
          />
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handlePlus}
        onLongPress={handlePlusN}
        style={styles.buttonContainer}
      >
        <View
          style={[
            styles.button,
            styles.buttonRight,
            { backgroundColor: buttonColor },
          ]}
        >
          <Icon
            name="app-plus-without-frame"
            color={contentSecondaryTextColor}
            size={16}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: StyleSheet.hairlineWidth,
    marginVertical: -12,
  },
  buttonContainer: {
    marginVertical: -8,
  },
  button: {
    marginVertical: 8,
    backgroundColor: 'red',
    height: 32,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  buttonRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
