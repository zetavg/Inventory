import React, { useCallback, useEffect, useRef } from 'react';
import { Dimensions, Platform, ScrollView, TextInput } from 'react-native';

import appLogger from '@app/logger';
const logger = appLogger.for({
  module: 'UI_hooks',
  function: 'useAutoFocus',
});

export default function useAutoFocus(
  ref: React.RefObject<TextInput>,
  {
    scrollViewRef,
    disable,
  }: {
    scrollViewRef: React.RefObject<ScrollView>;
    disable?: boolean;
  },
) {
  const disableNextKeyboardInsetsAdjustmentTimer = useRef<any>();
  const disableNextKeyboardInsetsAdjustment = useCallback(() => {
    if (Platform.OS !== 'ios') return;

    scrollViewRef.current?.setNativeProps({
      automaticallyAdjustKeyboardInsets: false,
    });
    if (disableNextKeyboardInsetsAdjustmentTimer.current) {
      clearTimeout(disableNextKeyboardInsetsAdjustmentTimer.current);
    }
    disableNextKeyboardInsetsAdjustmentTimer.current = setTimeout(() => {
      scrollViewRef.current?.setNativeProps({
        automaticallyAdjustKeyboardInsets: true,
      });
    }, 300);
  }, [scrollViewRef]);

  useEffect(() => {
    if (disable) return;
    if (!scrollViewRef?.current) return;

    const windowHeight = Dimensions.get('window').height;
    const timer = setTimeout(() => {
      ref.current?.measureLayout(scrollViewRef?.current as any, (_x, y) => {
        const shouldDisableNextKeyboardInsetsAdjustment = y < windowHeight / 3;
        logger.debug(
          `Auto focus element y: ${y}, window height: ${windowHeight}, shouldDisableNextKeyboardInsetsAdjustment: ${shouldDisableNextKeyboardInsetsAdjustment}`,
        );

        if (shouldDisableNextKeyboardInsetsAdjustment) {
          disableNextKeyboardInsetsAdjustment();
          ref.current?.focus();
        } else {
          setTimeout(() => {
            ref.current?.focus();
          }, 500);
        }
      });
    }, 50);

    return () => timer && clearTimeout(timer);
  }, [disable, disableNextKeyboardInsetsAdjustment, ref, scrollViewRef]);
}
