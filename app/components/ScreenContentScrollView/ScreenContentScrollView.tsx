import React, { forwardRef, useRef } from 'react';
import { ScrollView } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import useScrollViewAutomaticallyAdjustKeyboardInsetsFix from '@app/hooks/useScrollViewAutomaticallyAdjustKeyboardInsetsFix';
import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

type Props = React.ComponentProps<typeof ScrollView>;

function ScreenContentScrollView(
  props: Props,
  ref: React.ForwardedRef<ScrollView>,
) {
  const selfRef = useRef<ScrollView>(null);

  const scrollViewRef: typeof selfRef = (ref as any) || selfRef;
  useScrollViewContentInsetFix(scrollViewRef as any);

  const focused = useIsFocused();

  return (
    <ScrollView
      ref={scrollViewRef}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={focused}
      {...props}
    />
  );
}

const ScreenContentScrollViewWithForwardRef = forwardRef(
  ScreenContentScrollView,
);

const utils = {
  st: () => {
    console.warn('`st` is deprecated, use kiaTextInputProps instead.');
  },
  stf: () => {
    console.warn('`stf` is deprecated, use kiaTextInputProps instead.');
  },
  str: () => {
    console.warn('`str` is deprecated, use kiaTextInputProps instead.');
  },
  strf: () => {
    console.warn('`strf` is deprecated, use kiaTextInputProps instead.');
  },
  useAutoAdjustKeyboardInsetsFix: function (
    scrollViewRef: React.RefObject<ScrollView>,
  ) {
    return useScrollViewAutomaticallyAdjustKeyboardInsetsFix(scrollViewRef, {
      // This does not work well - the keyboard inset will not be removed when the keyboard is dismissed.
      // defaultDisableAutomaticallyAdjustKeyboardInsets: true,
    });
  },
};

const ScreenContentScrollViewComponent: typeof ScreenContentScrollViewWithForwardRef &
  typeof utils = Object.assign(ScreenContentScrollViewWithForwardRef, utils);

export default ScreenContentScrollViewComponent;
