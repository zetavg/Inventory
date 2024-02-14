import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  Text,
  ViewStyle,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import useColors from '@app/hooks/useColors';
import type { Optional } from '@app/utils/types';
import Color from 'color';
import { NeomorphBox } from '@app/components/NeomorphShadow';

type Props = {
  title?: string;
  color?: 'yellow' | 'red' | 'blue';
  style?: ViewStyle & { width: number };
} & Omit<
  Optional<React.ComponentProps<typeof TouchableWithoutFeedback>, 'children'>,
  'style'
>;

export const useBackgroundColor = (color: Props['color'] = 'yellow') => {
  const colors = useColors();

  switch (color) {
    case 'yellow':
      return colors.yellow2;
    case 'red':
      return colors.red2;
    case 'blue':
      return colors.blue2;
  }
};

function RubberButton({ title, color = 'yellow', style, ...props }: Props) {
  const [down, setDown] = useState(false);
  // const { colors: themeColors } = useTheme();

  // const backgroundColor = (() => {
  //   switch (color) {
  //     case 'yellow':
  //       return Color(colors.yellow).saturate(1).lighten(0.8).hexa();
  //     case 'red':
  //       return Color(colors.red).saturate(1).lighten(0.1).hexa();
  //     case 'blue':
  //       return Color(colors.blue).saturate(1).lighten(0.4).hexa();
  //   }
  // })();
  // const backgroundColor = isDarkMode
  //   ? Color(colors.contentBackgroundColor).lighten(1).hexa()
  //   : Color(colors.backgroundColor).darken(0.2).hexa();
  // const backgroundColor = colors.yellow2;
  // const backgroundColor = (() => {
  //   switch (color) {
  //     case 'yellow':
  //       return Color(colors.yellow).saturate(1).opaquer(-0.3).hexa();
  //     case 'red':
  //       return Color(colors.red).saturate(1).opaquer(-0.1).hexa();
  //     case 'blue':
  //       return Color(colors.blue).saturate(1).opaquer(-0.4).hexa();
  //   }
  // })();
  // const backgroundColor = (() => {
  //   switch (color) {
  //     case 'yellow':
  //       return colors.yellow2;
  //     case 'red':
  //       return colors.red2;
  //     case 'blue':
  //       return colors.blue2;
  //   }
  // })();
  const backgroundColor = useBackgroundColor(color);

  const textColor = Color(backgroundColor).darken(0.7).hexa();

  const handlePressIn = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactMedium');
    setDown(true);
  }, []);
  const handlePressOut = useCallback(() => {
    ReactNativeHapticFeedback.trigger('soft');
    setDown(false);
  }, []);

  return (
    <TouchableWithoutFeedback
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View>
        <NeomorphBox
          invert={down}
          style={{ ...styles.container, ...style }}
          containerStyle={{ backgroundColor }}
          contentStyle={{
            backgroundColor: 'transparent',
            borderWidth: StyleSheet.hairlineWidth,
            // borderWidth: 1,
            borderColor: 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <Text
            style={[
              styles.text,
              { color: textColor },
              down && styles.textPressed,
            ]}
          >
            {title}
          </Text>
        </NeomorphBox>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 100,
    width: 280,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  text: {
    fontSize: 18,
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
  textPressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }, { scale: 0.99 }],
  },
});

export default RubberButton;
