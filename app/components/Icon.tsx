import React from 'react';
import { Platform, View } from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Color from 'color';
import useColors from '@app/hooks/useColors';
import { IconColor, IconName, ICONS } from '@app/consts/icons';
import commonStyles from '@app/utils/commonStyles';

type Props = {
  name: IconName;
  color?: IconColor;
  size?: number;
};

export default function Icon({ name, color: colorName, size = 16 }: Props) {
  const colors = useColors();
  const icon = ICONS[name];
  const color = colorName
    ? colors[colorName]
    : Color(colors.contentTextColor).opaquer(-0.2).hexa();

  if (!icon) return <View style={{ width: size, height: size }} />;

  if (Platform.OS === 'ios') {
    return (
      <View
        style={[{ width: size, height: size }, commonStyles.centerChildren]}
      >
        <SFSymbol name={icon.sfSymbolName} color={color} size={size} />
      </View>
    );
  }

  return (
    <MaterialCommunityIcon
      name={icon.materialIconName}
      size={size}
      color={color}
    />
  );
}

export type { IconName, IconColor };
