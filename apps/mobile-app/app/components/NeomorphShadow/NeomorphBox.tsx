import React from 'react';
import { View, ViewStyle } from 'react-native';
import { NeomorphBox as RNNeomorphBox } from 'react-native-neomorph-shadows';

import useIsDarkMode from '@app/hooks/useIsDarkMode';

type Props = {
  children?: React.ComponentProps<typeof View>['children'];
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  shadowOpacity?: number;
  shadowRadius?: number;
  innerShadowOpacity?: number;
  innerShadowRadius?: number;
  invert?: boolean;
};

export function NeomorphBox({
  children,
  style,
  containerStyle,
  contentStyle,
  shadowOpacity = 0.2,
  shadowRadius = 5,
  innerShadowOpacity = 0.32,
  innerShadowRadius = 2,
  invert,
}: Props) {
  const cInvert = false;
  const isDarkMode = useIsDarkMode();

  return (
    <RNNeomorphBox
      useSvg
      swapShadowLevel={false}
      darkShadowColor={invert ? 'white' : 'black'}
      lightShadowColor={invert ? 'black' : 'white'}
      style={{
        shadowOpacity: invert ? innerShadowOpacity / 2 : shadowOpacity,
        shadowOpacityLight: invert
          ? innerShadowOpacity * 0.2
          : shadowOpacity * 1.2,
        shadowOpacityDark: invert
          ? innerShadowOpacity * 0.2
          : shadowOpacity * 0.8,
        shadowRadius: invert ? innerShadowRadius : shadowRadius,
        ...style,
        ...containerStyle,
      }}
    >
      <RNNeomorphBox
        inner
        useSvg
        darkShadowColor={invert ? 'black' : 'white'}
        lightShadowColor={invert ? 'white' : 'black'}
        style={{
          shadowOpacity: invert ? shadowOpacity * 1.6 : innerShadowOpacity,
          shadowOpacityLight: invert ? shadowOpacity * 1.6 : innerShadowOpacity,
          shadowOpacityDark: invert ? shadowOpacity * 1.2 : innerShadowOpacity,
          shadowRadius: invert ? shadowRadius : innerShadowRadius,
          ...style,
          ...contentStyle,
        }}
      >
        {children}
      </RNNeomorphBox>
    </RNNeomorphBox>
  );
}

export default NeomorphBox;
