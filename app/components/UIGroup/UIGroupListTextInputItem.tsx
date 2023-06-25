import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import useColors from '@app/hooks/useColors';
import useIsDarkMode from '@app/hooks/useIsDarkMode';

import InsetGroup from '@app/components/InsetGroup';

import { ListTextInputItemButtonProps, ListTextInputItemProps } from './types';

export default function UIGroupListTextInputItem(
  props: ListTextInputItemProps & { ref?: React.RefObject<TextInput> },
  ref: React.ForwardedRef<TextInput>,
): JSX.Element {
  const isDarkMode = useIsDarkMode();
  const { contentSecondaryTextColor, contentDisabledTextColor } = useColors();

  const {
    label,
    unit,
    disabled,
    readonly,
    horizontalLabel,
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
        labelTextStyle={{ color: contentSecondaryTextColor }}
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
        labelTextStyle={{ color: contentSecondaryTextColor }}
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

  return (
    <InsetGroup.Item
      vertical2={vertical2}
      compactLabel={compactLabel}
      label={label}
      labelTextStyle={{ color: contentSecondaryTextColor }}
      labelRightElement={
        rightElement && vertical2 ? (
          <View style={styles.insetGroupTextInputRightElementContainer}>
            {rightElement}
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
          {unit ? <InsetGroup.ItemAffix>{unit}</InsetGroup.ItemAffix> : null}
          {rightElement && !vertical2 ? (
            <View style={styles.insetGroupTextInputRightElementContainer}>
              {rightElement}
            </View>
          ) : null}
        </View>
      }
    />
  );
}
// eslint-disable-next-line no-func-assign
(UIGroupListTextInputItem as any) = React.forwardRef(UIGroupListTextInputItem);

export function UIGroupListTextInputItemButton(
  props: ListTextInputItemButtonProps,
) {
  const { iosTintColor } = useColors();
  const { children, ...restProps } = props;
  return (
    <TouchableOpacity
      {...restProps}
      style={[styles.iosListTextInputItemButtonContainer, restProps.style]}
    >
      {(() => {
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

        return <Text style={{ color: iosTintColor }}>{children}</Text>;
      })()}
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
});
