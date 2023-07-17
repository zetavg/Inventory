import React from 'react';
import { Platform, StyleSheet, TouchableHighlight, View } from 'react-native';

import Color from 'color';

import commonStyles from '@app/utils/commonStyles';

import useColors from '@app/hooks/useColors';

import Icon from '@app/components/Icon';
import InsetGroup from '@app/components/InsetGroup';
import Switch from '@app/components/Switch';

import { ListItemProps } from './types';

export default function UIGroupListItem(props: ListItemProps): JSX.Element {
  const {
    label,
    labelTextStyle,
    detail,
    detailTextStyle,
    monospaceDetail,
    verticalArrangedIOS,
    verticalArrangedNormalLabelIOS,
    verticalArrangedLargeTextIOS,
    selected,
    navigable,
    onPress,
    button,
    destructive,
    disabled,
    adjustsDetailFontSizeToFit,
    icon,
    iconColor,
    rightElement,
    ...restProps
  } = props;
  const { contentTextColor } = useColors();
  const leftElement = (() => {
    if (icon) {
      return (
        <Icon
          name={icon}
          color={iconColor}
          style={styles.iosItemIcon}
          size={30}
          showBackground
          backgroundPadding={4}
        />
      );
    }

    return undefined;
  })();
  const element = (
    <InsetGroup.Item
      label={label}
      labelTextStyle={[
        labelTextStyle,
        verticalArrangedNormalLabelIOS && styles.normalSizedLabel_labelText,
        verticalArrangedLargeTextIOS && styles.largeText_labelText,
      ]}
      detail={detail}
      detailTextStyle={[
        detailTextStyle,
        verticalArrangedNormalLabelIOS && styles.normalSizedLabel_detailText,
        monospaceDetail && styles.monospaceDetail_detailText,
      ]}
      leftElement={leftElement}
      vertical={verticalArrangedIOS || verticalArrangedNormalLabelIOS}
      vertical2={verticalArrangedLargeTextIOS}
      selected={selected}
      arrow={navigable}
      onPress={
        rightElement
          ? undefined /* will use a TouchableHighlight to wrap the whole thing later */
          : onPress
      }
      button={button}
      destructive={destructive}
      disabled={disabled}
      adjustsDetailFontSizeToFit={adjustsDetailFontSizeToFit}
      containerStyle={commonStyles.flex1}
      {...restProps}
    />
  );

  if (rightElement) {
    const elementWithRightElement = (
      <View style={styles.itemAndRightElementContainer}>
        {element}
        <View style={styles.rightElementContainer}>
          {(() => {
            if (typeof rightElement === 'function') {
              return rightElement({
                textProps: { style: {} },
                iconProps: { size: 40, showBackground: true },
              });
            }

            return rightElement;
          })()}
        </View>
      </View>
    );

    if (!onPress) return elementWithRightElement;

    return (
      <TouchableHighlight
        onPress={onPress}
        underlayColor={Color(contentTextColor).opaquer(-0.92).hexa()}
      >
        {elementWithRightElement}
      </TouchableHighlight>
    );
  }

  return element;
}

export function UIGroupListItemSwitch(
  props: React.ComponentProps<typeof Switch>,
) {
  const { style, ...restProps } = props;
  return <Switch style={[styles.iosSwitch, style]} {...restProps} />;
}

UIGroupListItem.Switch = UIGroupListItemSwitch;

UIGroupListItem.styles = StyleSheet.create({
  // Deprecated. Use the `adjustsDetailFontSizeToFit` prop on ListItem instead.
  // iosSmallFont: {
  //   ...Platform.select({
  //     ios: {
  //       fontSize: 14,
  //     },
  //     android: {
  //       // Since android version isn't implemented yet. After done, remove this so that the style only apply on iOS.
  //       fontSize: 14,
  //     },
  //   }),
  // },
});

const styles = StyleSheet.create({
  iosSwitch: {
    marginVertical: -4,
  },
  iosItemIcon: { marginRight: -2 },
  normalSizedLabel_labelText: { fontSize: 16 },
  normalSizedLabel_detailText: { fontSize: 12 },
  largeText_labelText: {
    fontWeight: '500',
  },
  monospaceDetail_detailText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  itemAndRightElementContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightElementContainer: {
    marginRight: InsetGroup.MARGIN_HORIZONTAL,
    flexDirection: 'row',
  },
});
