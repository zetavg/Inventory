import React, { forwardRef, useEffect, useRef } from 'react';
import { Keyboard, Platform, ScrollView, View } from 'react-native';

import { safeAreaInsets } from '@app/utils/exposedSafeAreaInsets';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

type Props = React.ComponentProps<typeof ScrollView>;

function ScreenContentScrollView(
  props: Props,
  ref: React.ForwardedRef<ScrollView>,
) {
  const selfRef = useRef<ScrollView>(null);

  const scrollViewRef: typeof selfRef = (ref as any) || selfRef;
  useScrollViewContentInsetFix(scrollViewRef as any);

  // useEffect(() => {
  //   const showSubscription = Keyboard.addListener('keyboardWillShow', () => {
  //     // ...
  //   });
  //   const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
  //     // ...
  //   });

  //   return () => {
  //     showSubscription.remove();
  //     hideSubscription.remove();
  //   };
  // }, []);

  return (
    <ScrollView
      ref={scrollViewRef}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      {...props}
    />
  );
}

const ScreenContentScrollViewWithForwardRef = forwardRef(
  ScreenContentScrollView,
);

const st = (ref: React.RefObject<ScrollView>, position?: number) => {
  if (ref.current) {
    ref.current.scrollTo({ y: position || 0 });
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        ref.current?.scrollTo({ y: position || 0, animated: false });
      }, i * 10 + 200);
    }

    // Need to delay next animation (such as keyboard inset) to make it work
    const startTime = new Date().getTime();
    while (new Date().getTime() - startTime < 100) {}
  }
};

const stf = (ref: React.RefObject<ScrollView>, position?: number) => () => {
  st(ref, position);
};

const str = (
  ref: React.RefObject<ScrollView>,
  targetRef: React.RefObject<{
    measureLayout: NonNullable<
      React.RefObject<View>['current']
    >['measureLayout'];
  }>,
) => {
  if (ref.current) {
    targetRef.current?.measureLayout(
      ref.current as any,
      (_left, top) => {
        const pos = top - safeAreaInsets.top - (Platform.OS === 'ios' ? 64 : 0);
        ref.current?.scrollTo({
          y: pos,
          animated: true,
        });

        for (let i = 0; i < 50; i++) {
          setTimeout(() => {
            ref.current?.scrollTo({ y: pos, animated: false });
          }, i * 10 + 200);
        }
      },
      () => {},
    );

    // Need to delay next animation (such as keyboard inset) to make it work
    const startTime = new Date().getTime();
    while (new Date().getTime() - startTime < 100) {}
  }
};

const strf =
  (
    ref: React.RefObject<ScrollView>,
    targetRef: React.RefObject<{
      measureLayout: NonNullable<
        React.RefObject<View>['current']
      >['measureLayout'];
    }>,
  ) =>
  () => {
    str(ref, targetRef);
  };

const utils = {
  st,
  stf,
  str,
  strf,
};

const ScreenContentScrollViewComponent: typeof ScreenContentScrollViewWithForwardRef &
  typeof utils = Object.assign(ScreenContentScrollViewWithForwardRef, utils);

export default ScreenContentScrollViewComponent;
