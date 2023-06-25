import React from 'react';
import { StyleSheet } from 'react-native';

import InsetGroup from '@app/components/InsetGroup';
import Switch from '@app/components/Switch';

import { ListItemProps } from './types';

export default function UIGroupListItem(props: ListItemProps): JSX.Element {
  const {
    label,
    labelTextStyle,
    detail,
    detailTextStyle,
    verticalArrangedIOS,
    selected,
    navigable,
    onPress,
    button,
    destructive,
    disabled,
    ...restProps
  } = props;
  return (
    <InsetGroup.Item
      label={label}
      labelTextStyle={labelTextStyle}
      detail={detail}
      detailTextStyle={detailTextStyle}
      vertical={verticalArrangedIOS}
      selected={selected}
      arrow={navigable}
      onPress={onPress}
      button={button}
      destructive={destructive}
      disabled={disabled}
      {...restProps}
    />
  );
}

export function UIGroupListItemSwitch(
  props: React.ComponentProps<typeof Switch>,
) {
  const { style, ...restProps } = props;
  return <Switch style={[styles.iosSwitch, style]} {...restProps} />;
}

UIGroupListItem.Switch = UIGroupListItemSwitch;

const styles = StyleSheet.create({
  iosSwitch: {
    marginVertical: -4,
  },
});
