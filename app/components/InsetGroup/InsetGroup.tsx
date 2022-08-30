import React from 'react';
import {
  Platform,
  useWindowDimensions,
  StyleSheet,
  View,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  TextInput,
  Image,
} from 'react-native';
import Color from 'color';
import useColors from '@app/hooks/useColors';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import isTextContent from '@app/utils/isTextContent';

const FONT_SIZE = 17;
const GROUP_LABEL_FONT_SIZE = 13;
const INSET_GROUP_ITEM_PADDING_HORIZONTAL = 16;

type Props = {
  children: React.ReactNode;
  label?: string;
  footerLabel?: string;
  labelVariant?: 'normal' | 'large';
  labelRight?: JSX.Element;
  labelContainerStyle?: React.ComponentProps<typeof View>['style'];
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
      <View
        ref={label ? undefined : ref}
        {...props}
        style={[
          styles.container,
          { backgroundColor: contentBackgroundColor },
          footerLabel ? styles.containerMarginBottom0 : {},
          ...(Array.isArray(style) ? style : [style]),
        ]}
      >
        {children}
      </View>
      {footerLabel && (
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
      )}
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

type InsetGroupItemProps = {
  label?: string;
  detail?: string | React.ReactNode;
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
} & React.ComponentProps<typeof View>;

function InsetGroupItem({
  style,
  label,
  detail,
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
    <>
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
            {
              paddingVertical: (vertical ? 4 : vertical2 ? 8 : 12) * fontScale,
            },
            ...(Array.isArray(style) ? style : [style]),
          ]}
        >
          <Text
            style={[
              vertical2
                ? styles.insetGroupItemVertical2Text
                : vertical
                ? styles.insetGroupItemVerticalText
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
              detail && !(vertical || vertical2)
                ? styles.insetGroupItemWithDetailText
                : {},
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
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
            {isTextContent(detail) || detailAsText ? (
              <Text
                style={{
                  fontSize: vertical ? FONT_SIZE * 0.8 : FONT_SIZE,
                  color: vertical2
                    ? contentTextColor
                    : contentSecondaryTextColor,
                }}
                numberOfLines={vertical2 ? undefined : 1}
                selectable
              >
                {detail}
              </Text>
            ) : (
              detail
            )}
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
            <Image
              source={
                isDarkMode
                  ? require('./images/ios-ui.tableview.checked.dark.png')
                  : require('./images/ios-ui.tableview.checked.light.png')
              }
              style={styles.itemCheckedImage}
            />
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
    </>
  );

  if (onPress && !disabled)
    return (
      <TouchableHighlight
        activeOpacity={1}
        underlayColor={Color(contentTextColor).opaquer(-0.92).hexa()}
        onPress={onPress}
      >
        {/*<Text>{Color(contentTextColor).opaquer(-0.1).hexa()}</Text>*/}
        {element}
      </TouchableHighlight>
    );

  return element;
}

InsetGroup.Item = InsetGroupItem;

function InsetGroupItemSeperator() {
  const { insetGroupSeperatorColor } = useColors();
  return (
    <View
      style={[
        styles.insetGroupItemSeperator,
        { backgroundColor: insetGroupSeperatorColor },
      ]}
    />
  );
}

InsetGroup.ItemSeperator = InsetGroupItemSeperator;

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
          alignRight ? styles.insetGroupTextInputAlighRight : {},
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
        alignRight ? styles.insetGroupTextInputAlighRight : {},
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

function InsetGroupItemAffix({ children }: { children: string }) {
  const { contentSecondaryTextColor } = useColors();
  return (
    <Text
      style={[styles.insetGroupItemAffix, { color: contentSecondaryTextColor }]}
    >
      {children}
    </Text>
  );
}

InsetGroup.ItemAffix = InsetGroupItemAffix;

function InsetGroupItemDetailButton({
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
        style={[styles.insetGroupItemDetailButtonText, { color: iosTintColor }]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

InsetGroup.ItemDetailButton = InsetGroupItemDetailButton;

InsetGroup.FONT_SIZE = FONT_SIZE;
InsetGroup.GROUP_LABEL_FONT_SIZE = GROUP_LABEL_FONT_SIZE;
InsetGroup.ITEM_PADDING_HORIZONTAL = INSET_GROUP_ITEM_PADDING_HORIZONTAL;

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    marginBottom: 35,
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
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
    marginHorizontal: 16,
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
    fontSize: 20,
    fontWeight: '700',
  },
  groupFooterLabel: {
    marginHorizontal: 32,
    marginTop: 8,
    marginBottom: 35,
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
  insetGroupItemText: {
    fontSize: FONT_SIZE,
    maxWidth: '95%',
  },
  insetGroupItemVertical2Text: {
    fontSize: FONT_SIZE * 0.8,
    fontWeight: '500',
    maxWidth: '95%',
  },
  insetGroupItemVerticalText: {
    maxWidth: '95%',
  },
  insetGroupItemCompactLabelText: {
    fontSize: FONT_SIZE * 0.85,
    fontWeight: '500',
  },
  insetGroupItemWithDetailText: {
    maxWidth: '60%',
  },
  insetGroupItemDetail: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  insetGroupItemVerticalDetail: { flex: 1, alignSelf: 'stretch' },
  insetGroupItemSeperator: {
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
  insetGroupTextInputAlighRight: {
    textAlign: 'right',
  },
  insetGroupItemAffix: {
    marginLeft: 4,
    fontSize: FONT_SIZE * 0.8,
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
  insetGroupContainer: {
    paddingTop: 16,
  },
});

export default InsetGroup;
