import React from 'react';
import { StyleSheet, View, TouchableWithoutFeedback } from 'react-native';
import useColors from '@app/hooks/useColors';
import titleCase from '@app/utils/titleCase';

export const COLOR_SELECTOR_COLORS = [
  'blue',
  'brown',
  'gray',
  'green',
  'indigo',
  'yellow',
  'red',
  'purple',
  'orange',
  'teal',
] as const;

export type ColorSelectColor = typeof COLOR_SELECTOR_COLORS[number];

type Props = {
  value?: ColorSelectColor;
  onChange: (color: ColorSelectColor) => void;
};

export default function ColorSelect({ value, onChange }: Props) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {COLOR_SELECTOR_COLORS.map(color => (
        <TouchableWithoutFeedback key={color} onPress={() => onChange(color)}>
          <View
            style={[
              styles.colorItemContainer,
              value === color && { borderColor: colors.iosTintColor },
            ]}
          >
            <View
              style={[
                styles.colorItem,
                {
                  backgroundColor: (colors as any)[`icon${titleCase(color)}`],
                },
              ]}
            />
          </View>
        </TouchableWithoutFeedback>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorItemContainer: {
    width: 32,
    height: 32,
    borderRadius: 128,
    borderColor: 'transparent',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorItem: {
    width: 20,
    height: 20,
    borderRadius: 128,
  },
});
