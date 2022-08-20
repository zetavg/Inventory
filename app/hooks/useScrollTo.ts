import React, { useCallback } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function useScrollTo(
  scrollViewRef: React.RefObject<{
    scrollTo: NonNullable<React.RefObject<ScrollView>['current']>['scrollTo'];
  }>,
) {
  const safeAreaInsets = useSafeAreaInsets();

  const scrollTo = useCallback(
    (
      targetRef: React.RefObject<{
        measureLayout: NonNullable<
          React.RefObject<View>['current']
        >['measureLayout'];
      }>,
    ) => {
      if (!scrollViewRef.current) return;
      targetRef.current?.measureLayout(
        scrollViewRef.current as any,
        (_left, top) => {
          scrollViewRef.current?.scrollTo({
            y: top - safeAreaInsets.top - (Platform.OS === 'ios' ? 64 : 0),
            animated: true,
          });
        },
        () => {},
      );
    },
    [safeAreaInsets.top, scrollViewRef],
  );

  return scrollTo;
}
