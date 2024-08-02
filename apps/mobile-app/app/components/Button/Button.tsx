import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { Button as PaperButton, useTheme } from 'react-native-paper';

import Color from 'color';

import useColors from '@app/hooks/useColors';
import useIsDarkMode from '@app/hooks/useIsDarkMode';

import Icon from '@app/components/Icon';

type Props = { title?: string } & Omit<
  React.ComponentProps<typeof PaperButton>,
  'children'
> & {
    children?: (p: {
      color: string;
      textProps: Partial<React.ComponentProps<typeof Text>>;
      iconProps: Partial<React.ComponentProps<typeof Icon>>;
    }) => JSX.Element;
  };

function Button({
  title,
  mode = 'text',
  style,
  ref,
  children,
  ...props
}: Props) {
  const isDarkMode = useIsDarkMode();
  const { iosTintColor, textOnDarkBackgroundColor, gray } = useColors();

  const paperTheme = useTheme();

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
    const color = (() => {
      switch (mode) {
        case 'contained':
        case 'elevated':
        case 'contained-tonal':
          return textOnDarkBackgroundColor;

        default:
          return iosTintColor;
      }
    })();
    const textStyle = (() => {
      switch (mode) {
        case 'contained':
        case 'elevated':
        case 'contained-tonal':
          return { color };

        default:
          return { color };
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
          {children ? (
            typeof children === 'function' ? (
              <View style={styles.childrenFnContainer}>
                {children({
                  color,
                  textProps: { style: [styles.iosText, textStyle] },
                  iconProps: {
                    color,
                    size: 16,
                    style: styles.iconInButton,
                    sfSymbolWeight: 'bold',
                  },
                })}
              </View>
            ) : (
              <Text style={[styles.iosText, textStyle]}>{children}</Text>
            )
          ) : (
            <Text style={[styles.iosText, textStyle]}>{title || null}</Text>
          )}
        </View>
      </TouchableHighlight>
    );
  }

  const color = (() => {
    switch (mode) {
      case 'contained':
        return paperTheme.colors.onPrimary;

      case 'contained-tonal':
        // return paperTheme.colors.shadow;
        return paperTheme.colors.onPrimaryContainer;

      default:
        return paperTheme.colors.primary;
    }
  })();

  return (
    <PaperButton
      {...props}
      ref={ref}
      mode={mode}
      style={style}
      children={
        children ? (
          typeof children === 'function' ? (
            <Text style={styles.childrenFnContainer}>
              {(() => {
                const element = children({
                  color,
                  textProps: { style: styles.androidFnTextStyle },
                  iconProps: { color, size: 16, style: styles.iconInButton },
                });

                if (Array.isArray(element.props.children)) {
                  element.props.children = element.props.children
                    .flatMap((c: any) => [c, ' '])
                    .slice(0, -1);
                }

                return element;
              })()}
            </Text>
          ) : (
            children
          )
        ) : (
          title || null
        )
      }
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
  childrenFnContainer: {
    justifySelf: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  androidFnTextStyle: {},
  iconInButton: {},
});

export default Button;
