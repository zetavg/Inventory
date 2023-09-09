import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Text, TouchableOpacity, View } from 'react-native';

import commonStyles from '@app/utils/commonStyles';

import useColors from '@app/hooks/useColors';
import useIsDarkMode from '@app/hooks/useIsDarkMode';

import Icon from '@app/components/Icon';

type Props = {
  value: number;
  onChangeValue: (value: number) => void;
};

export default function PlusAndMinusButtons({ value, onChangeValue }: Props) {
  const isDarkMode = useIsDarkMode();
  const { contentSecondaryTextColor } = useColors();

  const handlePlus = useCallback(() => {
    onChangeValue(value + 1);
  }, [onChangeValue, value]);
  const handleMinus = useCallback(() => {
    onChangeValue(value > 0 ? value - 1 : 0);
  }, [onChangeValue, value]);

  const buttonColor = isDarkMode ? '#39393C' : '#E9E9EB';
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          styles.buttonLeft,
          value <= 0 && styles.buttonDisabled,
          { backgroundColor: buttonColor },
        ]}
        onPress={handleMinus}
      >
        <Icon
          name="app-minus-without-frame"
          color={contentSecondaryTextColor}
          size={16}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button,
          styles.buttonRight,
          { backgroundColor: buttonColor },
        ]}
        onPress={handlePlus}
      >
        <Icon
          name="app-plus-without-frame"
          color={contentSecondaryTextColor}
          size={16}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: StyleSheet.hairlineWidth,
    marginVertical: -8,
  },
  button: {
    backgroundColor: 'red',
    height: 24,
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLeft: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  buttonRight: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
