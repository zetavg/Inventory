import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import useColors from '@app/hooks/useColors';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import Color from 'color';

const HEIGHT = 58;

type Props = {
  title: string;
  left?: JSX.Element;
  right?: JSX.Element;
};

function AppBarIOS({ title, left, right }: Props) {
  const isDarkMode = useIsDarkMode();
  const { contentTextColor } = useColors();
  return (
    <>
      <View
        style={[
          styles.shadow,
          {
            backgroundColor: Color(isDarkMode ? '#fff' : '#000')
              .opaquer(-0.95)
              .hexa(),
            borderBottomColor: Color(isDarkMode ? '#fff' : '#000')
              .opaquer(isDarkMode ? -0.95 : -0.7)
              .hexa(),
          },
        ]}
      />
      <BlurView
        blurType={isDarkMode ? 'dark' : 'light'}
        style={styles.blurView}
      >
        <View style={styles.actions}>{left}</View>
        <Text
          style={[styles.titleText, { color: contentTextColor }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <View style={[styles.actions, styles.actionRight]}>{right}</View>
      </BlurView>
    </>
  );
}

function BarButton({
  children,
  strong,
  destructive,
  ...props
}: React.ComponentProps<typeof TouchableOpacity> & {
  strong?: boolean;
  destructive?: boolean;
}) {
  const { iosTintColor, iosDestructiveColor } = useColors();

  return (
    <TouchableOpacity {...props}>
      {typeof children === 'string' ? (
        <Text
          style={[
            styles.barButtonText,
            { color: destructive ? iosDestructiveColor : iosTintColor },
            strong && styles.barButtonTextStrong,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

AppBarIOS.Button = BarButton;
AppBarIOS.HEIGHT = HEIGHT;

const styles = StyleSheet.create({
  shadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEIGHT + StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  titleText: { flex: 1, fontSize: 17, fontWeight: '600', textAlign: 'center' },
  actions: {
    width: 80,
    marginHorizontal: 16,
  },
  actionRight: {
    alignItems: 'flex-end',
  },
  barButtonText: {
    fontSize: 17,
  },
  barButtonTextStrong: {
    fontWeight: '500',
  },
});

export default AppBarIOS;
