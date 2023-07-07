import React, { useCallback, useMemo, useRef } from 'react';
import { Dimensions, Platform, ScrollView, TextInput } from 'react-native';

import appLogger from '@app/logger';
const logger = appLogger.for({
  module: 'UI_hooks',
  function: 'useScrollViewAutomaticallyAdjustKeyboardInsetsFix',
});

type ReturnType = {
  disableNextKeyboardInsetsAdjustment: () => void;
  handleKiaTextInputTouchStart: React.ComponentProps<
    typeof TextInput
  >['onTouchStart'];
  kiaTextInputProps: React.ComponentProps<typeof TextInput>;
};

// Since Platform.OS will not change during the app's lifetime.
/* eslint-disable react-hooks/rules-of-hooks */

export default function useScrollViewAutomaticallyAdjustKeyboardInsetsFix(
  scrollViewRef: React.RefObject<ScrollView>,
  {
    defaultDisableAutomaticallyAdjustKeyboardInsets = false,
  }: { defaultDisableAutomaticallyAdjustKeyboardInsets?: boolean } = {},
): ReturnType {
  if (Platform.OS !== 'ios') {
    return useMemo(
      () => ({
        disableNextKeyboardInsetsAdjustment: () => {},
        handleKiaTextInputTouchStart: () => {},
        kiaTextInputProps: {},
      }),
      [],
    );
  }

  const disableNextKeyboardInsetsAdjustmentTimer = useRef<any>();
  const disableNextKeyboardInsetsAdjustment = useCallback(() => {
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

  const enableNextKeyboardInsetsAdjustmentTimer = useRef<any>();
  const enableNextKeyboardInsetsAdjustment = useCallback(() => {
    scrollViewRef.current?.setNativeProps({
      automaticallyAdjustKeyboardInsets: true,
    });
    if (enableNextKeyboardInsetsAdjustmentTimer.current) {
      clearTimeout(enableNextKeyboardInsetsAdjustmentTimer.current);
    }
    enableNextKeyboardInsetsAdjustmentTimer.current = setTimeout(() => {
      scrollViewRef.current?.setNativeProps({
        automaticallyAdjustKeyboardInsets: false,
      });
    }, 300);
  }, [scrollViewRef]);

  const handleKiaTextInputTouchStart = useCallback<
    NonNullable<React.ComponentProps<typeof TextInput>['onTouchStart']>
  >(
    event => {
      const loc = event.nativeEvent.pageY;
      const windowHeight = Dimensions.get('window').height;
      const shouldDisableNextKeyboardInsetsAdjustment = loc < windowHeight / 2;
      logger.debug(
        `TextInput touched at ${loc}, window height: ${windowHeight}, shouldDisableNextKeyboardInsetsAdjustment: ${shouldDisableNextKeyboardInsetsAdjustment}`,
      );
      if (shouldDisableNextKeyboardInsetsAdjustment) {
        if (!defaultDisableAutomaticallyAdjustKeyboardInsets) {
          disableNextKeyboardInsetsAdjustment();
        }
      } else {
        if (defaultDisableAutomaticallyAdjustKeyboardInsets) {
          enableNextKeyboardInsetsAdjustment();
        }
      }
    },
    [
      defaultDisableAutomaticallyAdjustKeyboardInsets,
      disableNextKeyboardInsetsAdjustment,
      enableNextKeyboardInsetsAdjustment,
    ],
  );

  const kiaTextInputProps = useMemo<
    React.ComponentProps<typeof TextInput>
  >(() => {
    return {
      onTouchStart: handleKiaTextInputTouchStart,
    };
  }, [handleKiaTextInputTouchStart]);

  return {
    disableNextKeyboardInsetsAdjustment,
    handleKiaTextInputTouchStart,
    kiaTextInputProps,
  };
}
