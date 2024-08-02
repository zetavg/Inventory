import React from 'react';

import InsetGroup from '@app/components/InsetGroup';

import { ListItemSeparatorProps } from './types';

export default function UIGroupListItemSeparator(
  props: ListItemSeparatorProps,
): JSX.Element {
  const { leftInsetIOS, forItemWithIcon, color, ...restProps } = props;

  let leftInsetIOSOvr;
  if (forItemWithIcon) {
    leftInsetIOSOvr = 60;
  }
  return (
    <InsetGroup.ItemSeparator
      leftInset={leftInsetIOS || leftInsetIOSOvr}
      style={[!!color && { backgroundColor: color, opacity: 1 }]}
      {...restProps}
    />
  );
}

UIGroupListItemSeparator.insertBetween = (
  elements: ReadonlyArray<JSX.Element>,
  props?: ListItemSeparatorProps,
): Array<JSX.Element> => {
  return elements
    .flatMap((element, index) => [
      element,
      <UIGroupListItemSeparator key={`_separator_${index}`} {...props} />,
    ])
    .slice(0, -1);
};
