import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import useColors from '@app/hooks/useColors';

import InsetGroup from '@app/components/InsetGroup';

import { useStyles } from './hooks';
import { UIGroupProps, UIGroupTitleButtonProps } from './types';
import UIGroupFirstGroupSpacing from './UIGroupFirstGroupSpacing';
import UIGroupListItem from './UIGroupListItem';
import UIGroupListItemSeparator from './UIGroupListItemSeparator';
import UIGroupListTextInputItem from './UIGroupListTextInputItem';

export function UIGroup(
  props: UIGroupProps & { ref?: React.RefObject<View> },
  ref?: React.ForwardedRef<View>,
): JSX.Element {
  const { contentSecondaryTextColor } = useColors();
  const {
    header,
    footer,
    largeTitle,
    headerRight,
    transparentBackground,
    loading,
    children,
    placeholder,
    style,
    asSectionHeader,
    ...restProps
  } = props;
  return (
    <InsetGroup
      ref={ref}
      label={header}
      footerLabel={footer}
      labelVariant={largeTitle ? 'large' : 'normal'}
      labelRight={
        headerRight ? (
          <View style={styles.iosHeaderRightContainer}>{headerRight}</View>
        ) : undefined
      }
      backgroundTransparent={transparentBackground}
      loading={loading}
      hideContent={asSectionHeader}
      {...restProps}
      style={[loading && !!children && styles.iosNonEmptyLoading, style]}
    >
      {children ? (
        children
      ) : (
        <Text
          style={[
            styles.iosPlaceholderText,
            { color: contentSecondaryTextColor },
          ]}
        >
          {placeholder}
        </Text>
      )}
    </InsetGroup>
  );
}
// eslint-disable-next-line no-func-assign
(UIGroup as any) = React.forwardRef(UIGroup);

export function UIGroupTitleButton(props: UIGroupTitleButtonProps) {
  const { iosTintColor, textOnDarkBackgroundColor } = useColors();
  const { children, primary, ...restProps } = props;
  return (
    <InsetGroup.LabelButton primary={primary} contentAsText {...restProps}>
      {(() => {
        if (typeof children === 'function') {
          const color = primary ? textOnDarkBackgroundColor : iosTintColor;
          // return children({
          //   color,
          //   size: 16,
          //   weight: 'bold',
          //   iconProps: {
          //     color,
          //     size: 16,
          //     sfSymbolWeight: 'bold',
          //     style: { paddingTop: 8 },
          //   },
          // });
          return (
            <View style={styles.iosTitleButtonRenderedChildrenContainer}>
              {children({
                textProps: {
                  style: { color, fontWeight: '500' },
                },
                iconProps: {
                  color,
                  size: 15,
                  sfSymbolWeight: 'bold',
                  style: undefined,
                },
              })}
            </View>
          );
        }
        return children;
      })()}
    </InsetGroup.LabelButton>
  );
}

UIGroup.TitleButton = UIGroupTitleButton;

function UIGroupSectionSeparatorComponent({ trailingItem }: any) {
  if (trailingItem) return null;
  return <View style={styles.sectionSeparatorComponent} />;
}

const styles = StyleSheet.create({
  iosNonEmptyLoading: {
    minHeight: 'auto',
  },
  iosPlaceholderText: {
    paddingHorizontal: 18,
    paddingVertical: 52,
    alignSelf: 'center',
    textAlign: 'center',
  },
  iosTitleButtonRenderedChildrenContainer: {
    marginBottom: -6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  iosHeaderRightContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sectionSeparatorComponent: {
    height: 35,
  },
});

UIGroup.useStyles = useStyles;
UIGroup.FirstGroupSpacing = UIGroupFirstGroupSpacing;
UIGroup.ListItem = UIGroupListItem;
UIGroup.ListItemSeparator = UIGroupListItemSeparator;
UIGroup.ListTextInputItem = UIGroupListTextInputItem;
UIGroup.ListTextInputItemButton = UIGroupListTextInputItem.Button;
UIGroup.SectionSeparatorComponent = UIGroupSectionSeparatorComponent;

export default UIGroup;
