import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import {
  verifyIconColorWithDefault,
  verifyIconNameWithDefault,
} from '@app/consts/icons';

import commonStyles from '@app/utils/commonStyles';

import Icon from '@app/components/Icon';
import Text from '@app/components/Text';

type Props = {
  onPress: () => void;
  iconName: string | undefined;
  defaultIconName?: string | undefined;
  iconColor: string | undefined;
};
export default function IconSelectInput({
  onPress,
  iconName,
  defaultIconName,
  iconColor,
}: Props) {
  return (
    <TouchableOpacity
      style={[commonStyles.flex1, commonStyles.mv8]}
      onPress={onPress}
    >
      <View style={[commonStyles.row, commonStyles.alignItemsCenter]}>
        <Icon
          name={verifyIconNameWithDefault(iconName || defaultIconName)}
          color={verifyIconColorWithDefault(iconColor)}
          showBackground
          size={40}
        />
        <Text style={[commonStyles.ml12, commonStyles.opacity05]}>
          {iconName || 'Select...'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
