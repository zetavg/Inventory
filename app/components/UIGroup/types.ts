import React from 'react';
import { Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { SymbolWeight } from 'react-native-sfsymbols';

import Icon from '../Icon';

type RenderFunctionProps = {
  textProps: {
    style: React.ComponentProps<typeof Text>['style'] | undefined;
  };
  iconProps: {
    color: string;
    size: number;
    sfSymbolWeight: SymbolWeight;
    style: React.ComponentProps<typeof Icon>['style'] | undefined;
  };
};

export type UIGroupProps = {
  children?: React.ReactNode;
  header?: string | JSX.Element;
  footer?: string | JSX.Element;
  largeTitle?: boolean;
  headerRight?: JSX.Element;
  transparentBackground?: boolean;
  loading?: boolean;
  placeholder?: string;
} & React.ComponentProps<typeof View>;

export type UIGroupTitleButtonProps = {
  primary?: boolean;
  children?: string | ((context: RenderFunctionProps) => React.ReactNode);
} & Omit<React.ComponentProps<typeof TouchableWithoutFeedback>, 'children'>;

export type UIGroupFirstGroupSpacingProps = {
  iosLargeTitle?: boolean;
} & React.ComponentProps<typeof View>;

export type ListItemProps = {
  label?: string;
  labelTextStyle?: React.ComponentProps<typeof Text>['style'];
  detail?: string | React.ReactNode;
  detailTextStyle?: React.ComponentProps<typeof Text>['style'];
  verticalArrangedIOS?: boolean;
  selected?: boolean;
  navigable?: boolean;
  onPress?: () => void;
  button?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  adjustsDetailFontSizeToFit?: boolean;
} & React.ComponentProps<typeof View>;

export type ListItemSeparatorProps = {
  leftInsetIOS?: number;
};

export type ListTextInputItemProps = {
  label?: string;
  unit?: string;
  disabled?: boolean;
  readonly?: boolean;
  horizontalLabel?: boolean;
  rightElement?: React.ReactNode;
  monospaced?: boolean;
  small?: boolean;
  inputElement?: JSX.Element;
} & React.ComponentProps<typeof TextInput>;

export type ListTextInputItemButtonProps = {
  children?: string | ((context: RenderFunctionProps) => React.ReactNode);
} & Omit<React.ComponentProps<typeof TouchableWithoutFeedback>, 'children'>;
