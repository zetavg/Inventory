import React, { forwardRef, useRef } from 'react';
import { ScrollView } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import useScrollViewAutomaticallyAdjustKeyboardInsetsFix from '@app/hooks/useScrollViewAutomaticallyAdjustKeyboardInsetsFix';
import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

type Props = React.ComponentProps<typeof ScrollView>;

function ModalContentScrollView(
  { children, ...props }: Props,
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
    >
      {children}
    </ScrollView>
  );
}

const ModalContentScrollViewWithForwardRef = forwardRef(ModalContentScrollView);

const utils = {
  useAutoAdjustKeyboardInsetsFix:
    useScrollViewAutomaticallyAdjustKeyboardInsetsFix,
};

const ModalContentScrollViewComponent: typeof ModalContentScrollViewWithForwardRef &
  typeof utils = Object.assign(ModalContentScrollViewWithForwardRef, utils);

export default ModalContentScrollViewComponent;
