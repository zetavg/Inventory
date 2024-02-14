import React, { useCallback, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  LayoutRectangle,
  PanResponder,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import titleCase from '@app/utils/titleCase';

import useColors from '@app/hooks/useColors';

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

export type ColorSelectColor = (typeof COLOR_SELECTOR_COLORS)[number];

type Props = {
  value?: ColorSelectColor;
  onChange: (color: ColorSelectColor) => void;
};

export default function ColorSelect({ value, onChange }: Props) {
  const colors = useColors();

  const containerRef = useRef<View | null>(null);
  const containerPageX = useRef<number | null>(null);
  const colorItemLayouts = useRef<{
    [key: string]: LayoutRectangle;
  }>({});

  const handleContainerLayout = () => {
    containerRef.current?.measure(
      (_x, _y, _width, _height, pageX) => (containerPageX.current = pageX),
    );
  };

  const handleColorLayout = (
    color: ColorSelectColor,
    event: LayoutChangeEvent,
  ) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    colorItemLayouts.current[color] = { x, y, width, height };
  };

  const isPanHandled = useRef(false);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        const { dx, dy } = gestureState;
        return isPanHandled.current || Math.abs(dx) > Math.abs(dy);
      },
      onPanResponderMove: (_evt, gestureState) => {
        if (!isPanHandled.current && Math.abs(gestureState.dx) < 24) {
          return;
        }
        isPanHandled.current = true;

        if (typeof containerPageX.current !== 'number') return;
        const containerX = containerPageX.current;

        const { moveX } = gestureState;
        const fingerX = moveX - containerX;

        const hoveredColor = COLOR_SELECTOR_COLORS.find(color => {
          const layout = colorItemLayouts.current[color];
          if (!layout) return false;

          const { x, width } = layout;
          return fingerX >= x && fingerX <= x + width;
        });

        if (hoveredColor) changeColor(hoveredColor);
      },
      onPanResponderRelease: () => {
        isPanHandled.current = false;
      },
      onPanResponderTerminate: () => {
        isPanHandled.current = false;
      },
    }),
  ).current;

  const currentValueRef = useRef(value);
  currentValueRef.current = value;
  const changeColor = useCallback(
    (color: ColorSelectColor) => {
      if (currentValueRef.current !== color) {
        ReactNativeHapticFeedback.trigger('clockTick');
        currentValueRef.current = color;
      }
      onChange(color);
    },
    [onChange],
  );

  return (
    <View
      style={styles.container}
      ref={containerRef}
      onLayout={handleContainerLayout}
      {...panResponder.panHandlers}
    >
      {COLOR_SELECTOR_COLORS.map(color => (
        <TouchableWithoutFeedback
          key={color}
          onPress={() => changeColor(color)}
          onLayout={event => handleColorLayout(color, event)}
        >
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
    marginHorizontal: -1,
    maxWidth: 400,
  },
  colorItemContainer: {
    width: 32,
    height: 32,
    marginHorizontal: -2,
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
