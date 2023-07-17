import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import commonStyles from '@app/utils/commonStyles';

import useColors from '@app/hooks/useColors';
import useIsDarkMode from '@app/hooks/useIsDarkMode';

import InsetGroup from '@app/components/InsetGroup';

import { ListTextInputItemButtonProps, ListTextInputItemProps } from './types';

export default function UIGroupListTextInputItem(
  props: ListTextInputItemProps & { ref?: React.RefObject<TextInput> },
  ref: React.ForwardedRef<TextInput>,
): JSX.Element {
  const isDarkMode = useIsDarkMode();
  const { contentSecondaryTextColor, contentDisabledTextColor, iosTintColor } =
    useColors();

  const {
    label,
    unit,
    onUnitPress,
    disabled,
    readonly,
    horizontalLabel,
    controlElement,
    rightElement,
    monospaced,
    small,
    inputElement,
    ...restProps
  } = props;

  if (!label) {
    return (
      <InsetGroup.Item>
        <InsetGroup.TextInput
          {...restProps}
          editable={!disabled && !readonly}
          ref={ref}
        />
      </InsetGroup.Item>
    );
  }

  const vertical2 = !horizontalLabel;
  const compactLabel = horizontalLabel;
  const textAlign = horizontalLabel ? 'right' : 'left';

  if (disabled) {
    return (
      <InsetGroup.Item
        vertical2={vertical2}
        compactLabel={compactLabel}
        label={label}
        labelTextStyle={{ color: contentSecondaryTextColor, fontWeight: '500' }}
        detail={props.value}
        detailAsText
        detailTextStyle={[
          { color: contentDisabledTextColor },
          monospaced && styles.monospaced,
          small && styles.small,
        ]}
      />
    );
  }
  if (readonly) {
    return (
      <InsetGroup.Item
        vertical2={vertical2}
        compactLabel={compactLabel}
        label={label}
        labelTextStyle={{ color: contentSecondaryTextColor, fontWeight: '500' }}
        detail={props.value}
        detailAsText
        detailTextStyle={[
          // eslint-disable-next-line react-native/no-inline-styles
          {
            color: isDarkMode ? 'hsl(240, 4%, 80%)' : 'hsl(240, 2%, 50%)',
          },
          monospaced && styles.monospaced,
          small && styles.small,
        ]}
      />
    );
  }

  const element = (
    <InsetGroup.Item
      vertical2={vertical2}
      compactLabel={compactLabel}
      label={label}
      labelTextStyle={{ color: contentSecondaryTextColor, fontWeight: '500' }}
      labelRightElement={
        controlElement && vertical2 ? (
          <View style={styles.insetGroupTextInputRightElementContainer}>
            {controlElement}
          </View>
        ) : undefined
      }
      detail={
        <View style={styles.insetGroupTextInputContainer}>
          {inputElement ? (
            inputElement
          ) : (
            <InsetGroup.TextInput
              ref={ref}
              textAlign={textAlign}
              {...restProps}
              style={[
                monospaced && styles.monospaced,
                small && styles.small,
                restProps.style,
              ]}
            />
          )}
          {unit ? (
            onUnitPress ? (
              <TouchableOpacity
                onPress={onUnitPress}
                style={styles.pressableUnitContainer}
              >
                <InsetGroup.ItemAffix
                  style={[styles.pressableUnitText, { color: iosTintColor }]}
                >
                  {unit}
                </InsetGroup.ItemAffix>
              </TouchableOpacity>
            ) : (
              <InsetGroup.ItemAffix>{unit}</InsetGroup.ItemAffix>
            )
          ) : null}
          {controlElement && !vertical2 ? (
            <View style={styles.insetGroupTextInputRightElementContainer}>
              {controlElement}
            </View>
          ) : null}
        </View>
      }
      containerStyle={rightElement ? commonStyles.flex1 : undefined}
    />
  );

  if (rightElement) {
    return (
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
  }

  return element;
}
// eslint-disable-next-line no-func-assign
(UIGroupListTextInputItem as any) = React.forwardRef(UIGroupListTextInputItem);

export function UIGroupListTextInputItemButton(
  props: ListTextInputItemButtonProps,
) {
  const { iosTintColor, contentDisabledTextColor } = useColors();
  const { children, disabled, ...restProps } = props;

  const content = (() => {
    if (typeof children === 'function') {
      return (
        <View style={styles.iosRenderedListTextInputItemButtonContainer}>
          {children({
            textProps: {
              style: { color: iosTintColor },
            },
            iconProps: {
              color: iosTintColor,
              size: 16,
              sfSymbolWeight: 'regular',
              style: undefined,
            },
          })}
        </View>
      );
    }

    return (
      <Text
        style={{ color: disabled ? contentDisabledTextColor : iosTintColor }}
      >
        {children}
      </Text>
    );
  })();

  if (disabled) {
    return (
      <View
        {...(restProps as any)}
        style={[styles.iosListTextInputItemButtonContainer, restProps.style]}
      >
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity
      {...restProps}
      style={[styles.iosListTextInputItemButtonContainer, restProps.style]}
    >
      {content}
    </TouchableOpacity>
  );
}

UIGroupListTextInputItem.Button = UIGroupListTextInputItemButton;

const styles = StyleSheet.create({
  insetGroupTextInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insetGroupTextInputRightElementContainer: {
    paddingLeft: 8,
    flexDirection: 'row',
    gap: 8,
  },
  iosListTextInputItemButtonContainer: {
    // backgroundColor: 'red',
    margin: -12,
    padding: 12,
    marginLeft: -8,
  },
  monospaced: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  small: {
    fontSize: 14,
  },
  iosRenderedListTextInputItemButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  pressableUnitContainer: {
    marginTop: -12,
    marginBottom: -12,
    marginRight: -12,
  },
  pressableUnitText: {
    marginTop: 12,
    marginBottom: 8,
    marginRight: 12,
  },
  itemAndRightElementContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightElementContainer: {
    marginRight: InsetGroup.MARGIN_HORIZONTAL,
  },
});
