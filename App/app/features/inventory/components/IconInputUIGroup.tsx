import React, { useCallback } from 'react';
import type { StackScreenProps } from '@react-navigation/stack';

import { verifyIconColor, verifyIconName } from '@app/consts/icons';

import type { RootStackParamList } from '@app/navigation/Navigation';

import { IconColor, IconName } from '@app/components/Icon';
import UIGroup from '@app/components/UIGroup';

import IconColorSelectInput from './IconColorSelectInput';
import IconSelectInput from './IconSelectInput';

type Props = {
  iconName: string | undefined;
  iconColor: string | undefined;
  onChangeIconName: (iconName: IconName) => void;
  onChangeIconColor: (iconColor: IconColor) => void;
  navigation: StackScreenProps<
    RootStackParamList,
    keyof RootStackParamList
  >['navigation'];
} & React.ComponentProps<typeof UIGroup>;

function IconInputUIGroup({
  iconName,
  iconColor,
  onChangeIconName,
  onChangeIconColor,
  navigation,
  ...uiGroupProps
}: Props) {
  const handleOpenSelectIcon = useCallback(
    () =>
      navigation.navigate('SelectIcon', {
        defaultValue: verifyIconName(iconName),
        callback: n => {
          onChangeIconName(n);
        },
      }),
    [iconName, navigation, onChangeIconName],
  );

  return (
    <UIGroup {...uiGroupProps}>
      <UIGroup.ListTextInputItem
        label="Icon"
        inputElement={
          <IconSelectInput
            iconName={verifyIconName(iconName)}
            iconColor={verifyIconColor(iconColor)}
            onPress={handleOpenSelectIcon}
          />
        }
        controlElement={
          <UIGroup.ListTextInputItem.Button onPress={handleOpenSelectIcon}>
            Select
          </UIGroup.ListTextInputItem.Button>
        }
      />
      <UIGroup.ListItemSeparator />
      <UIGroup.ListTextInputItem
        label="Icon Color"
        inputElement={
          <IconColorSelectInput
            value={verifyIconColor(iconColor)}
            onChange={onChangeIconColor}
          />
        }
      />
    </UIGroup>
  );
}

export default IconInputUIGroup;
