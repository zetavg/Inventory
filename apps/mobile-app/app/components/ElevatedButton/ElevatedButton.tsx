import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  Text,
  ViewStyle,
  LayoutChangeEvent,
  GestureResponderEvent,
  ActivityIndicator,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import type { Optional } from '@app/utils/types';
import Color from 'color';
import useColors from '@app/hooks/useColors';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import commonStyles from '@app/utils/commonStyles';

type Props = {
  title?: string;
  color?: string;
  down?: boolean;
  loading?: boolean;
  style?: ViewStyle & { width: number };
} & Omit<
  Optional<React.ComponentProps<typeof TouchableWithoutFeedback>, 'children'>,
  'style'
>;

// export const useBackgroundColor = (color: Props['color'] = 'yellow') => {
//   const colors = useColors();

//   switch (color) {
//     case 'yellow':
//       return colors.yellow2;
//     case 'red':
//       return colors.red2;
//     case 'blue':
//       return colors.blue2;
//   }
// };

function ElevatedButton({
  title,
  color,
  style,
  onLayout,
  onPressIn,
  onPressOut,
  down: downProp,
  loading,
  disabled,
  ...props
}: Props) {
  const [down, setDown] = useState(false);

  const isDarkMode = useIsDarkMode();

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      if (typeof onPressIn === 'function') onPressIn(e);
      setDown(true);
    },
    [onPressIn],
  );
  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      if (typeof onPressOut === 'function') onPressOut(e);
      setDown(false);
    },
    [onPressOut],
  );
  const prevDown = useRef(false);
  const currentDown = down || downProp || false;
  useEffect(() => {
    if (prevDown.current === currentDown) return;

    if (currentDown) {
      ReactNativeHapticFeedback.trigger('impactMedium');
    } else {
      ReactNativeHapticFeedback.trigger('soft');
    }

    prevDown.current = currentDown;
  }, [currentDown]);

  const bgColor = color || (isDarkMode ? '#eee' : '#fff');
  const textColor = Color(bgColor).darken(0.64).hexa();
  const barColor = Color(bgColor).darken(0.32).hexa();
  const backgroundColor = Color(bgColor)
    .darken(currentDown ? 0.2 : 0)
    .hexa();

  const [height, setHeight] = useState(-100);
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setHeight(event.nativeEvent.layout.height);
      if (typeof onLayout === 'function') onLayout(event);
    },
    [onLayout],
  );

  return (
    <TouchableWithoutFeedback
      {...props}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View
        style={[
          styles.container,
          currentDown && styles.containerDown,
          disabled && styles.containerDisabled,
          { backgroundColor },
          style,
        ]}
        onLayout={handleLayout}
      >
        <View
          style={[
            styles.contentContainer,
            { backgroundColor },
            currentDown && styles.contentContainerDown,
          ]}
        >
          <View
            style={[
              styles.bar,
              styles.leftBar,
              { left: height / 2, backgroundColor: barColor },
              currentDown && styles.barPressed,
            ]}
          />
          <View
            style={[
              styles.bar,
              styles.rightBar,
              { right: height / 2, backgroundColor: barColor },
              currentDown && styles.barPressed,
            ]}
          />
          <View style={commonStyles.centerChildren}>
            {loading && (
              <ActivityIndicator
                color={textColor}
                style={[styles.activityIndicator]}
              />
            )}
            <Text
              style={[
                styles.text,
                { color: textColor },
                currentDown && styles.textPressed,
              ]}
            >
              {title}
            </Text>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

export function SecondaryButton({
  title,
  color,
  style,
  primary,
  onLayout,
  onPressIn,
  onPressOut,
  down: downProp,
  loading,
  disabled,
  ...props
}: Props & { primary?: boolean }) {
  const [down, setDown] = useState(false);

  const isDarkMode = useIsDarkMode();
  const { contentTextColor, iosTintColor } = useColors();

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      if (typeof onPressIn === 'function') onPressIn(e);
      setDown(true);
    },
    [onPressIn],
  );
  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      if (typeof onPressOut === 'function') onPressOut(e);
      setDown(false);
    },
    [onPressOut],
  );
  const prevDown = useRef(false);
  const currentDown = down || downProp || false;
  useEffect(() => {
    if (prevDown.current === currentDown) return;

    if (currentDown) {
      ReactNativeHapticFeedback.trigger('selection');
    } else {
      ReactNativeHapticFeedback.trigger('selection');
    }

    prevDown.current = currentDown;
  }, [currentDown]);

  const downBgColor = Color(contentTextColor).opaquer(-0.9).hexa();
  const textColor = primary
    ? iosTintColor
    : Color(contentTextColor).opaquer(-0.5).hexa();
  const barColor = Color(contentTextColor).opaquer(-0.9).hexa();
  const backgroundColor = currentDown ? downBgColor : 'transparent';

  const [height, setHeight] = useState(-100);
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setHeight(event.nativeEvent.layout.height);
      if (typeof onLayout === 'function') onLayout(event);
    },
    [onLayout],
  );

  return (
    <TouchableWithoutFeedback
      {...props}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View
        onLayout={handleLayout}
        style={[
          styles.secondaryContentContainer,
          disabled && styles.secondaryContentContainerDisabled,
          { backgroundColor },
          currentDown && styles.contentContainerDown,
        ]}
      >
        <View
          style={[
            styles.secondaryBar,
            styles.leftBar,
            { left: height * 0.4, backgroundColor: barColor },
            currentDown && styles.barPressed,
          ]}
        />
        <View
          style={[
            styles.secondaryBar,
            styles.rightBar,
            { right: height * 0.4, backgroundColor: barColor },
            currentDown && styles.barPressed,
          ]}
        />
        <View style={commonStyles.centerChildren}>
          {loading && (
            <ActivityIndicator
              color={textColor}
              style={[styles.activityIndicator]}
            />
          )}
          <Text
            style={[
              styles.secondaryText,
              { color: textColor },
              currentDown && styles.textPressed,
            ]}
          >
            {title}
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 100,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.02,
    shadowRadius: 1,

    elevation: 4,
  },
  containerDown: {
    shadowOpacity: 0.01,
    shadowOffset: {
      width: 0,
      height: 1,
    },

    elevation: 1,

    transform: [{ translateX: 0 }, { translateY: 1 }, { scale: 0.999 }],
  },
  containerDisabled: {
    opacity: 0.5,
  },
  contentContainer: {
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  contentContainerDown: {
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: {
      width: 0,
      height: 1,
    },
  },
  secondaryContentContainer: {
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  secondaryContentContainerDisabled: {
    opacity: 0.32,
  },
  bar: {
    position: 'absolute',
    top: 12,
    bottom: 12,
    width: 4,
    borderRadius: 4,
  },
  secondaryBar: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    width: 2,
    borderRadius: 4,
  },
  leftBar: { left: -100 },
  rightBar: { right: -100 },
  barPressed: {
    // transform: [{ translateX: 0 }, { translateY: 1 }, { scale: 0.99 }],
  },
  activityIndicator: {
    position: 'absolute',
    left: -28,
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    textTransform: 'uppercase',
    // shadowColor: 'red',
    // shadowRadius: 1,
    // shadowOpacity: 1,
    // shadowOffset: {
    //   width: 0,
    //   height: 0,
    // },
  },
  secondaryText: {
    fontSize: 16,
  },
  textPressed: {
    // transform: [{ translateX: 0 }, { translateY: 1 }, { scale: 0.99 }],
  },
});

export default ElevatedButton;
