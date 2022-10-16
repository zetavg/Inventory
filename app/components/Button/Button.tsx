import React from 'react';
import {
  Platform,
  StyleSheet,
  TouchableHighlight,
  View,
  Text,
} from 'react-native';
import { Button as PaperButton } from 'react-native-paper';

import type { Optional } from '@app/utils/types';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useColors from '@app/hooks/useColors';
import Color from 'color';

type Props = { title?: string } & Optional<
  React.ComponentProps<typeof PaperButton>,
  'children'
>;

function Button({ title, mode = 'text', style, ref, ...props }: Props) {
  const isDarkMode = useIsDarkMode();
  const { iosTintColor, textOnDarkBackgroundColor, gray } = useColors();

  if (Platform.OS === 'ios') {
    const containerBackgroundColor = (() => {
      switch (mode) {
        case 'contained':
        case 'elevated':
        case 'contained-tonal':
          return iosTintColor;

        default:
          return Color(gray)
            .opaquer(isDarkMode ? -0.78 : -0.88)
            .hexa();
      }
    })();
    const textStyle = (() => {
      switch (mode) {
        case 'contained':
        case 'elevated':
        case 'contained-tonal':
          return { color: textOnDarkBackgroundColor };

        default:
          return { color: iosTintColor };
      }
    })();
    return (
      <TouchableHighlight
        {...props}
        style={[
          styles.iosContainer,
          { backgroundColor: containerBackgroundColor },
          style,
        ]}
        underlayColor={Color(containerBackgroundColor)
          .darken(0.2)
          .opaquer(0.4)
          .hexa()}
      >
        <View style={styles.iosContentContainer}>
          <Text style={[styles.iosText, textStyle]}>
            {props.children || title || null}
          </Text>
        </View>
      </TouchableHighlight>
    );
  }

  return (
    <PaperButton
      {...props}
      ref={ref}
      mode={mode}
      style={style}
      children={props.children || title || null}
    />
  );
}

const styles = StyleSheet.create({
  iosContainer: {
    // flex: 1,
    borderRadius: 8,
  },
  iosContentContainer: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosText: {
    fontWeight: '500',
    fontSize: 16,
  },
});

export default Button;
