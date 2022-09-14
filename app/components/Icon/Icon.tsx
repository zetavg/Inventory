import React from 'react';
import { Platform, View } from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Color from 'color';
import useColors from '@app/hooks/useColors';
import { IconColor, IconName, ICONS } from '@app/consts/icons';
import commonStyles from '@app/utils/commonStyles';
import titleCase from '@app/utils/titleCase';

type Props = {
  name: IconName;
  color?: IconColor | string;
  size?: number;
  showBackground?: boolean;
  backgroundColor?: string;
  backgroundPadding?: number;
  style?: React.ComponentProps<typeof View>['style'];
  sfSymbolWeight?: React.ComponentProps<typeof SFSymbol>['weight'];
  sfSymbolScale?: React.ComponentProps<typeof SFSymbol>['scale'];
};

export default function Icon({
  name,
  color: colorName,
  size = 16,
  showBackground,
  backgroundPadding = 8,
  backgroundColor: bgColor,
  style,
  sfSymbolWeight,
  sfSymbolScale,
}: Props) {
  const colors = useColors();
  const icon = ICONS[name];
  let color = colorName
    ? (colors as any)[`icon${titleCase(colorName)}`]
    : Color(colors.contentTextColor).opaquer(-0.32).hexa();
  if (!color) color = colorName;

  const iconSize = showBackground ? size - backgroundPadding * 2 : size;

  const iconElement = (() => {
    if (!icon) return <View style={{ width: iconSize, height: iconSize }} />;

    if (Platform.OS === 'ios') {
      const { sfSymbolName } = icon as any;

      if (sfSymbolName) {
        return (
          <View
            style={[
              { width: iconSize, height: iconSize, overflow: 'visible' },
              commonStyles.centerChildren,
              !showBackground && style,
            ]}
          >
            <SFSymbol
              name={(icon as any).sfSymbolName}
              color={color}
              size={iconSize * 0.88}
              weight={sfSymbolWeight}
              scale={sfSymbolScale}
            />
          </View>
        );
      }

      return (
        <View
          style={[
            { width: iconSize, height: iconSize, overflow: 'visible' },
            commonStyles.centerChildren,
            !showBackground && style,
          ]}
        >
          <MaterialCommunityIcon
            name={icon.materialIconName}
            size={iconSize * 1.16}
            color={color}
            style={{
              position: 'absolute',
              top: iconSize * -0.08,
              bottom: iconSize * -0.08,
              left: iconSize * -0.08,
              right: iconSize * -0.08,
            }}
          />
        </View>
      );
    }

    return (
      <MaterialCommunityIcon
        name={icon.materialIconName}
        size={iconSize}
        color={color}
        style={[!showBackground && style]}
      />
    );
  })();

  if (showBackground) {
    const backgroundColor =
      bgColor || Color(colors.contentTextColor).opaquer(-0.95).hexa();
    return (
      <View
        style={[
          {
            padding: backgroundPadding,
            borderRadius: 4,
            backgroundColor,
          },
          style,
        ]}
      >
        {iconElement}
      </View>
    );
  }

  return iconElement;
}

export type { IconName, IconColor };
