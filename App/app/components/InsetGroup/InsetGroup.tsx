import React, { useMemo } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import Color from 'color';

import commonStyles from '@app/utils/commonStyles';
import isTextContent from '@app/utils/isTextContent';

import useColors from '@app/hooks/useColors';
import useIsDarkMode from '@app/hooks/useIsDarkMode';

import Icon from '../Icon';
import LoadingOverlay from '../LoadingOverlay';

const FONT_SIZE = 17;
const GROUP_LABEL_FONT_SIZE = 13;
const INSET_GROUP_ITEM_PADDING_HORIZONTAL = 16;

type Props = {
  children: React.ReactNode;
  label?: string | JSX.Element;
  footerLabel?:
    | string
    | JSX.Element
    | ((context: {
        textProps: React.ComponentProps<typeof Text>;
      }) => React.ReactNode);
  labelVariant?: 'normal' | 'large';
  labelRight?: JSX.Element;
  labelContainerStyle?: React.ComponentProps<typeof View>['style'];
  loading?: boolean;
  backgroundTransparent?: boolean;
  hideContent?: boolean;
} & React.ComponentProps<typeof View>;

type AddRefToPropsHack = { ref?: React.ForwardedRef<View> };

function InsetGroup(
  {
    children,
    style,
    label,
    footerLabel,
    labelVariant,
    labelRight,
    labelContainerStyle,
    loading,
    backgroundTransparent,
    hideContent,
    ...props
  }: Props & AddRefToPropsHack,
  ref?: React.ForwardedRef<View>,
) {
  const { contentBackgroundColor, contentTextColor, groupTitleColor } =
    useColors();
  return (
    <>
      {label && (
        <View
          ref={ref}
          style={[
            (() => {
              switch (labelVariant) {
                case 'large':
                  return styles.groupTitleLargeContainer;

                case 'normal':
                default:
                  return styles.groupTitleContainer;
              }
            })(),
            ...(Array.isArray(labelContainerStyle)
              ? labelContainerStyle
              : [labelContainerStyle]),
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              (() => {
                switch (labelVariant) {
                  case 'large':
                    return [
                      styles.groupTitleLarge,
                      styles.groupTitleLargeText,
                      { color: contentTextColor },
                    ];

                  case 'normal':
                  default:
                    return [styles.groupTitle, { color: groupTitleColor }];
                }
              })(),
            ]}
          >
            {label}
          </Text>
          {labelRight}
        </View>
      )}
      {!hideContent && (
        <View
          ref={label ? undefined : ref}
          {...props}
          style={[
            styles.container,
            loading && styles.containerLoading,
            !backgroundTransparent && {
              backgroundColor: contentBackgroundColor,
            },
            footerLabel ? styles.containerMarginBottom0 : {},
            ...(Array.isArray(style) ? style : [style]),
          ]}
        >
          {children}
          {loading && <LoadingOverlay show />}
        </View>
      )}
      {footerLabel &&
        (typeof footerLabel === 'string' ? (
          <>
            <Text
              style={[
                styles.groupFooterLabel,
                {
                  color: groupTitleColor,
                },
              ]}
            >
              {footerLabel}
            </Text>
            <View style={styles.groupFooterLabelAfter} />
          </>
        ) : typeof footerLabel === 'function' ? (
          <>
            {footerLabel({
              textProps: {
                style: [
                  styles.groupFooterLabel,
                  {
                    color: groupTitleColor,
                  },
                ],
              },
            })}
            <View style={styles.groupFooterLabelAfter} />
          </>
        ) : (
          footerLabel
        ))}
    </>
  );
}

(InsetGroup as any) = React.forwardRef(InsetGroup);

type InsetGroupContainerProps = {
  children: React.ReactNode;
} & React.ComponentProps<typeof View>;

function InsetGroupContainer({
  children,
  style,
  ...props
}: InsetGroupContainerProps) {
  const { backgroundColor } = useColors();
  return (
    <View
      {...props}
      style={[
        { backgroundColor: backgroundColor },
        styles.insetGroupContainer,
        ...(Array.isArray(style) ? style : [style]),
      ]}
    >
      {children}
    </View>
  );
}

InsetGroup.Container = InsetGroupContainer;

type InsetGroupLabelButtonProps = {
  children?: React.ReactNode;
  title?: string;
  contentAsText?: boolean;
  primary?: boolean;
} & React.ComponentProps<typeof TouchableHighlight>;

function InsetGroupLabelButton({
  children,
  title,
  primary,
  style,
  contentAsText,
  ...props
}: InsetGroupLabelButtonProps) {
  const { iosTintColor, textOnDarkBackgroundColor, contentTextColor } =
    useColors();
  const Container: any = primary ? TouchableHighlight : TouchableOpacity;
  const containerProps = primary
    ? { underlayColor: Color(iosTintColor).darken(0.2).hexa() }
    : {};

  const ContentContainer = contentAsText === false ? React.Fragment : Text;
  const contentContainerProps =
    contentAsText !== false
      ? {
          style: [
            primary
              ? { color: textOnDarkBackgroundColor }
              : { color: iosTintColor },
            styles.insetGroupLabelButtonText,
          ],
        }
      : {};

  return (
    <Container
      {...containerProps}
      {...props}
      style={[
        {
          backgroundColor: primary
            ? iosTintColor
            : Color(contentTextColor).opaquer(-0.9).hexa(),
        },
        styles.insetGroupLabelButton,
        ...(Array.isArray(style) ? style : [style]),
      ]}
    >
      <ContentContainer {...contentContainerProps}>
        {children || title}
      </ContentContainer>
    </Container>
  );
}

InsetGroup.LabelButton = InsetGroupLabelButton;

type InsetGroupItemProps = {
  containerStyle?: React.ComponentProps<typeof View>['style'];
  leftElement?: JSX.Element;
  labelRightElement?: JSX.Element;
  label?: string;
  labelTextStyle?: React.ComponentProps<typeof Text>['style'];
  detail?:
    | string
    | React.ReactNode
    | ((context: {
        textProps: React.ComponentProps<typeof Text>;
        iconProps: Partial<React.ComponentProps<typeof Icon>>;
      }) => React.ReactNode);
  detailTextStyle?: React.ComponentProps<typeof Text>['style'];
  detailAsText?: boolean;
  compactLabel?: boolean;
  vertical?: boolean;
  vertical2?: boolean;
  arrow?: boolean;
  selected?: boolean;
  button?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  adjustsDetailFontSizeToFit?: boolean;
} & React.ComponentProps<typeof View>;

function InsetGroupItem({
  containerStyle,
  style,
  leftElement,
  labelRightElement,
  label,
  labelTextStyle,
  detail,
  detailTextStyle,
  detailAsText,
  compactLabel,
  vertical,
  vertical2,
  arrow,
  selected,
  button,
  destructive,
  disabled,
  onPress,
  onLongPress,
  adjustsDetailFontSizeToFit,
  children,
  ...props
}: InsetGroupItemProps) {
  const {
    contentTextColor,
    iosTintColor,
    iosDestructiveColor,
    contentSecondaryTextColor,
    contentDisabledTextColor,
  } = useColors();
  const isDarkMode = useIsDarkMode();
  const { fontScale } = useWindowDimensions();

  const element = (
    <View style={[styles.insetGroupItem, !onPress && containerStyle]}>
      {leftElement && (
        <View style={styles.insetGroupLeftElementContainer}>{leftElement}</View>
      )}
      <View style={commonStyles.flex1}>
        {label && (
          <View
            {...props}
            style={[
              vertical || vertical2
                ? styles.insetGroupItemVerticalContainer
                : styles.insetGroupItemContainer,
              (vertical || vertical2) &&
                arrow &&
                styles.insetGroupItemVerticalContainerWithArrow,
              (vertical || vertical2) &&
                selected &&
                styles.insetGroupItemVerticalContainerWithCheckmark,
              {
                paddingVertical:
                  (vertical ? 5 : vertical2 ? 8 : 12) * fontScale,
              },
              ...(Array.isArray(style) ? style : [style]),
            ]}
          >
            <View
              style={[
                styles.insetGroupItemLabelContainer,
                vertical2
                  ? styles.insetGroupItemVertical2TextContainer
                  : vertical
                  ? styles.insetGroupItemVerticalTextContainer
                  : styles.insetGroupItemTextContainer,
                detail && !(vertical || vertical2)
                  ? styles.insetGroupItemWithDetailTextContainer
                  : {},
                labelTextStyle,
              ]}
            >
              <Text
                style={[
                  vertical2
                    ? styles.insetGroupItemVertical2Text
                    : vertical
                    ? {}
                    : styles.insetGroupItemText,
                  compactLabel ? styles.insetGroupItemCompactLabelText : {},
                  {
                    color: (() => {
                      if (disabled) return contentDisabledTextColor;

                      if (button) {
                        if (destructive) return iosDestructiveColor;

                        return iosTintColor;
                      }

                      if (vertical2 && !compactLabel)
                        return contentSecondaryTextColor;

                      return contentTextColor;
                    })(),
                  },
                  labelTextStyle,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
              {labelRightElement || null}
            </View>
            <View
              style={
                vertical || vertical2
                  ? [
                      styles.insetGroupItemVerticalDetail,
                      { marginTop: 2 * fontScale },
                    ]
                  : styles.insetGroupItemDetail
              }
            >
              {(() => {
                const textProps: React.ComponentProps<typeof Text> = {
                  style: [
                    {
                      fontSize: vertical ? FONT_SIZE * 0.8 : FONT_SIZE,
                      color: vertical2
                        ? contentTextColor
                        : contentSecondaryTextColor,
                    },
                    detailTextStyle,
                  ],
                  numberOfLines: vertical2 ? undefined : 1,
                  selectable: !onLongPress,
                  adjustsFontSizeToFit: adjustsDetailFontSizeToFit,
                };
                const iconProps: Partial<React.ComponentProps<typeof Icon>> = {
                  color: vertical2
                    ? contentTextColor
                    : contentSecondaryTextColor,
                  size: 11,
                  style: styles.itemDetailIcon,
                };

                if (typeof detail === 'function') {
                  return detail({ textProps, iconProps });
                }
                if (isTextContent(detail) || detailAsText) {
                  return <Text {...textProps}>{detail}</Text>;
                }

                return detail;
              })()}
            </View>
            {arrow && Platform.OS === 'ios' && (
              <View
                style={
                  vertical || vertical2
                    ? styles.itemVerticalArrowContainer
                    : styles.itemArrowContainer
                }
              >
                <Image
                  source={{
                    uri: isDarkMode
                      ? 'ios-ui.tableview.arrow.dark.png'
                      : 'ios-ui.tableview.arrow.light.png',
                  }}
                  style={styles.iosArrow}
                />
              </View>
            )}
            {selected && (
              <View
                style={
                  (vertical || vertical2) &&
                  styles.itemVerticalCheckedImageContainer
                }
              >
                <Image
                  source={
                    isDarkMode
                      ? require('./images/ios-ui.tableview.checked.dark.png')
                      : require('./images/ios-ui.tableview.checked.light.png')
                  }
                  style={styles.itemCheckedImage}
                />
              </View>
            )}
          </View>
        )}
        {children && (
          <View
            style={[
              styles.insetGroupItemContainer,
              !label && { paddingTop: 12 * fontScale },
              { paddingBottom: 12 * fontScale },
              { marginTop: -2 * fontScale },
            ]}
          >
            {children}
          </View>
        )}
      </View>
    </View>
  );

  if (onPress && !disabled)
    return (
      <TouchableHighlight
        activeOpacity={1}
        underlayColor={Color(contentTextColor).opaquer(-0.92).hexa()}
        onPress={onPress}
        onLongPress={onLongPress}
        style={containerStyle}
      >
        {/*<Text>{Color(contentTextColor).opaquer(-0.1).hexa()}</Text>*/}
        {element}
      </TouchableHighlight>
    );

  return element;
}

InsetGroup.Item = InsetGroupItem;

function InsetGroupItemSeparator({
  leftInset,
  style,
  ...restProps
}: { leftInset?: number } & React.ComponentProps<typeof View>) {
  const { insetGroupSeparatorColor } = useColors();
  const backgroundColorStyle = useMemo(
    () => ({ backgroundColor: insetGroupSeparatorColor }),
    [insetGroupSeparatorColor],
  );
  const leftInsetStyle = useMemo(
    () => (leftInset ? { marginLeft: leftInset } : undefined),
    [leftInset],
  );

  return (
    <View
      style={[
        styles.insetGroupItemSeparator,
        backgroundColorStyle,
        leftInsetStyle,
        style,
      ]}
      {...restProps}
    />
  );
}

InsetGroup.ItemSeparator = InsetGroupItemSeparator;

function InsetGroupTextInput(
  {
    style,
    alignRight,
    disabled,
    value,
    scrollEnabled = false,
    ...props
  }: React.ComponentProps<typeof TextInput> & {
    alignRight?: boolean;
    disabled?: boolean;
  },
  ref: React.ForwardedRef<TextInput>,
) {
  const {
    contentTextColor,
    contentDisabledTextColor,
    contentSecondaryTextColor,
  } = useColors();

  if (disabled) {
    return (
      <Text
        selectable
        style={[
          styles.insetGroupTextInput,
          alignRight ? styles.insetGroupTextInputAlignRight : {},
          { color: contentDisabledTextColor },
          style,
        ]}
        {...props}
      >
        {value}
      </Text>
    );
  }

  return (
    <TextInput
      ref={ref}
      style={[
        styles.insetGroupTextInput,
        alignRight ? styles.insetGroupTextInputAlignRight : {},
        { color: contentTextColor },
        style,
      ]}
      scrollEnabled={scrollEnabled}
      placeholderTextColor={Color(contentSecondaryTextColor)
        .opaquer(-0.6)
        .hexa()}
      value={value}
      {...props}
    />
  );
}

InsetGroup.TextInput = React.forwardRef(InsetGroupTextInput);

function InsetGroupItemAffix({
  children,
  style,
  ...props
}: { children: string } & React.ComponentProps<typeof Text>) {
  const { contentSecondaryTextColor } = useColors();
  return (
    <Text
      {...props}
      style={[
        styles.insetGroupItemAffix,
        { color: contentSecondaryTextColor },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

InsetGroup.ItemAffix = InsetGroupItemAffix;

function InsetGroupItemDetailButton({
  label,
  onPress,
  style,
  textStyle,
  destructive,
}: {
  label: string;
  onPress: () => void;
  style?: React.ComponentProps<typeof TouchableOpacity>['style'];
  textStyle?: React.ComponentProps<typeof Text>['style'];
  destructive?: boolean;
}) {
  const { iosTintColor, iosDestructiveColor } = useColors();
  return (
    <TouchableOpacity onPress={onPress} style={style}>
      <Text
        style={[
          styles.insetGroupItemDetailButtonText,
          { color: destructive ? iosDestructiveColor : iosTintColor },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

InsetGroup.ItemDetailButton = InsetGroupItemDetailButton;

function InsetGroupGroupLabelRightButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { iosTintColor } = useColors();
  return (
    <TouchableOpacity onPress={onPress}>
      <Text
        style={{
          fontSize: GROUP_LABEL_FONT_SIZE,
          color: iosTintColor,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

InsetGroup.GroupLabelRightButton = InsetGroupGroupLabelRightButton;

InsetGroup.FONT_SIZE = FONT_SIZE;
InsetGroup.GROUP_LABEL_FONT_SIZE = GROUP_LABEL_FONT_SIZE;
InsetGroup.ITEM_PADDING_HORIZONTAL = INSET_GROUP_ITEM_PADDING_HORIZONTAL;

const ITEM_AFFIX_FONT_SIZE = FONT_SIZE * 0.8;
InsetGroup.ITEM_AFFIX_FONT_SIZE = ITEM_AFFIX_FONT_SIZE;

const MARGIN_HORIZONTAL = 16;
InsetGroup.MARGIN_HORIZONTAL = MARGIN_HORIZONTAL;

export const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    marginBottom: 35,
    marginHorizontal: MARGIN_HORIZONTAL,
    borderRadius: 8,
    overflow: 'hidden',
  },
  containerLoading: {
    minHeight: 120,
  },
  containerMarginBottom0: {
    marginBottom: 0,
  },
  groupTitleContainer: {
    marginHorizontal: 32,
    marginTop: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupTitleLargeContainer: {
    // marginHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupTitle: {
    marginRight: 4,
    flex: 1,
    textTransform: 'uppercase',
    fontSize: GROUP_LABEL_FONT_SIZE,
  },
  groupTitleLarge: {
    marginRight: 4,
    flex: 1,
  },
  groupTitleLargeText: {
    fontSize: 20,
    fontWeight: '700',
  },
  groupFooterLabel: {
    marginHorizontal: 32,
    marginTop: 8,
  },
  groupFooterLabelAfter: {
    height: 35,
  },
  insetGroupLeftElementContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: INSET_GROUP_ITEM_PADDING_HORIZONTAL,
    paddingBottom: 1,
  },
  insetGroupItem: {
    flexDirection: 'row',
    minHeight: 50,
    alignItems: 'center',
  },
  insetGroupItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: INSET_GROUP_ITEM_PADDING_HORIZONTAL,
  },
  insetGroupItemVerticalContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
  },
  insetGroupItemVerticalContainerWithArrow: {
    paddingRight: 36,
  },
  insetGroupItemVerticalContainerWithCheckmark: {
    paddingRight: 42,
  },
  insetGroupItemText: {
    fontSize: FONT_SIZE,
  },
  insetGroupItemTextContainer: {
    maxWidth: '95%',
  },
  insetGroupItemVertical2Text: {
    fontSize: FONT_SIZE * 0.8,
    flex: 1,
  },
  insetGroupItemLabelContainer: {
    flexDirection: 'row',
  },
  insetGroupItemVertical2TextContainer: {
    // maxWidth: '95%',
  },
  insetGroupItemVerticalTextContainer: {
    maxWidth: '95%',
  },
  insetGroupItemCompactLabelText: {
    fontSize: FONT_SIZE * 0.85,
    fontWeight: '500',
  },
  insetGroupItemWithDetailTextContainer: {
    maxWidth: '60%',
  },
  insetGroupItemDetail: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexDirection: 'row',
  },
  insetGroupItemVerticalDetail: {
    flex: 1,
    alignSelf: 'stretch',
  },
  insetGroupItemSeparator: {
    marginTop: -StyleSheet.hairlineWidth * 2,
    height: StyleSheet.hairlineWidth,
    width: 'auto',
    marginLeft: 16,
    marginRight: 0,
    opacity: 0.9,
  },
  insetGroupTextInput: {
    flex: 1,
    fontSize: FONT_SIZE,
  },
  insetGroupTextInputAlignRight: {
    textAlign: 'right',
  },
  insetGroupItemAffix: {
    marginLeft: 4,
    fontSize: ITEM_AFFIX_FONT_SIZE,
    alignSelf: 'flex-end',
  },
  insetGroupItemDetailButtonText: {
    fontSize: FONT_SIZE * 0.82,
  },
  itemCheckedImage: { width: 14, height: 16 },
  iosArrow: { width: 8.12, height: 14.41 },
  itemArrowContainer: { marginLeft: 12 },
  itemVerticalArrowContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 16,
    justifyContent: 'center',
  },
  itemVerticalCheckedImageContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 16,
    justifyContent: 'center',
  },
  insetGroupContainer: {
    paddingTop: 16,
  },
  insetGroupLabelButton: {
    marginTop: -3,
    marginVertical: -0,
    marginLeft: 4,
    borderRadius: 6,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  insetGroupLabelButtonText: {
    fontWeight: '500',
    fontSize: 15,
  },
  itemDetailIcon: {
    opacity: 0.7,
    marginBottom: -1.5,
  },
});

export default InsetGroup;
