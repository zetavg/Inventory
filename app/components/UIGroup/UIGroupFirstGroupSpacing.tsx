import React from 'react';
import { StyleSheet, View } from 'react-native';

import { UIGroupFirstGroupSpacingProps } from './types';

export default function UIGroupFirstGroupSpacing(
  props: UIGroupFirstGroupSpacingProps,
): JSX.Element {
  const { iosLargeTitle, ...restProps } = props;
  return (
    <View
      {...restProps}
      style={[
        styles.view,
        iosLargeTitle && styles.iosLargeTitleView,
        props.style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  view: {
    height: 16,
  },
  iosLargeTitleView: {
    height: 8,
  },
});
