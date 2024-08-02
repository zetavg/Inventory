import React, { useCallback, useRef } from 'react';
import { Platform, StyleSheet, TouchableHighlight, View } from 'react-native';

import Color from 'color';

import commonStyles from '@app/utils/commonStyles';

import useColors from '@app/hooks/useColors';

import DatePicker from '@app/components/DatePicker';
import Icon from '@app/components/Icon';
import InsetGroup from '@app/components/InsetGroup';
import Switch from '@app/components/Switch';

import { ListItemProps, ListItemRenderItemContainerProps } from './types';
import UIGroupListItemSeparator from './UIGroupListItemSeparator';

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
    onLongPress,
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
    if (typeof icon === 'string') {
      return (
        <Icon
          name={icon}
          color={iconColor}
          style={styles.iosItemIcon}
          size={30}
          showBackground={iconColor !== 'transparent'}
          backgroundPadding={4}
        />
      );
    } else if (typeof icon === 'function') {
      const iconProps = {
        color: iconColor,
        style: styles.iosItemIcon,
        size: 30,
        showBackground: true,
        backgroundPadding: 4,
      };

      return icon({ iconProps });
    }

    return undefined;
  })();

  // Preventing double tapping triggering onPress multiple times
  const isHandlingPress = useRef(false);
  const handlePress = useCallback(() => {
    if (!onPress) return;
    if (isHandlingPress.current) return;

    isHandlingPress.current = true;
    onPress();

    setTimeout(() => {
      isHandlingPress.current = false;
    }, 10);
  }, [onPress]);

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
          : onPress && handlePress
      }
      onLongPress={
        rightElement
          ? undefined /* will use a TouchableHighlight to wrap the whole thing later */
          : onLongPress
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

export function UIGroupListItemDatePicker(
  props: React.ComponentProps<typeof DatePicker>,
) {
  const { style, ...restProps } = props;
  return (
    <DatePicker style={style} iosStyle={styles.iosDatePicker} {...restProps} />
  );
}

UIGroupListItem.DatePicker = UIGroupListItemDatePicker;

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

export function UIGroupListItemRenderItemContainer({
  children,
  isFirst,
  isLast,
}: ListItemRenderItemContainerProps) {
  const { contentBackgroundColor, contentTextColor, groupTitleColor } =
    useColors();
  return (
    <View
      style={[
        styles.renderItemContainer,
        { backgroundColor: contentBackgroundColor },
        isFirst && styles.renderItemContainer_first,
        isLast && styles.renderItemContainer_last,
      ]}
    >
      {children}
    </View>
  );
}

UIGroupListItem.RenderItemContainer = UIGroupListItemRenderItemContainer;

function UIGroupListItemItemSeparatorComponent() {
  return (
    <UIGroupListItemRenderItemContainer>
      <UIGroupListItemSeparator />
    </UIGroupListItemRenderItemContainer>
  );
}
function UIGroupListItemItemSeparatorComponentForItemWithIcon() {
  return (
    <UIGroupListItemRenderItemContainer>
      <UIGroupListItemSeparator forItemWithIcon />
    </UIGroupListItemRenderItemContainer>
  );
}
UIGroupListItemItemSeparatorComponent.ForItemWithIcon =
  UIGroupListItemItemSeparatorComponentForItemWithIcon;
UIGroupListItem.ItemSeparatorComponent = UIGroupListItemItemSeparatorComponent;

const styles = StyleSheet.create({
  iosSwitch: {
    marginVertical: -4,
  },
  iosDatePicker: {
    marginVertical: -6,
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
  renderItemContainer: {
    marginHorizontal: InsetGroup.MARGIN_HORIZONTAL,
  },
  renderItemContainer_first: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  renderItemContainer_last: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
});
