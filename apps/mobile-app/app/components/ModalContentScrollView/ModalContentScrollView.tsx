import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView as RNScrollView,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { GestureHandlerRefContext } from '@react-navigation/stack';
import { ScrollView } from 'react-native-gesture-handler';

import useScrollViewAutomaticallyAdjustKeyboardInsetsFix from '@app/hooks/useScrollViewAutomaticallyAdjustKeyboardInsetsFix';
import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

type Props = {
  disableScrollToDismiss?: boolean;
} & React.ComponentProps<typeof ScrollView>;

function ModalContentScrollView(
  {
    children,
    onScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
    onMomentumScrollEnd,
    disableScrollToDismiss = Platform.OS === 'ios' ? false : true,
    contentInset,
    ...props
  }: Props,
  ref: React.ForwardedRef<ScrollView | RNScrollView>,
) {
  const selfRef = useRef<ScrollView>(null);

  const scrollViewRef: typeof selfRef = (ref as any) || selfRef;
  useScrollViewContentInsetFix(scrollViewRef as any);

  const focused = useIsFocused();

  const [isScrolledToTop, setIsScrolledToTop] = useState(true);
  const isScrolledToTopRef = useRef(true);
  const [delayedIsScrolledToTop, setDelayedIsScrolledToTop] = useState(true);

  const currentScrollOffsetRef = useRef(0);
  const contentInsetTop = contentInset?.top || 0;

  const isScrolling = useRef(false);
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (onScroll) onScroll(event);

      const offset = event.nativeEvent.contentOffset.y + (contentInsetTop || 0);
      currentScrollOffsetRef.current = offset;
      const shouldBeScrolledToTop = offset <= 1;

      isScrolledToTopRef.current = shouldBeScrolledToTop;
      if (isScrolledToTop !== shouldBeScrolledToTop)
        setIsScrolledToTop(shouldBeScrolledToTop);
    },
    [isScrolledToTop, contentInsetTop, onScroll],
  );

  const handleScrollBeginDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isScrolling.current = true;
      if (onScrollBeginDrag) onScrollBeginDrag(event);
    },
    [onScrollBeginDrag],
  );

  const handleScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isScrolling.current = false;
      if (onScrollEndDrag) onScrollEndDrag(event);

      const shouldBeScrolledToTop = isScrolledToTopRef.current;

      // Set delayedIsScrolledToTop to false immediately if it changes from true to false
      if (
        !shouldBeScrolledToTop &&
        delayedIsScrolledToTop !== shouldBeScrolledToTop
      ) {
        setDelayedIsScrolledToTop(shouldBeScrolledToTop);
      }

      // Otherwise wait for MomentumScrollEnd to set it back to true
    },
    [delayedIsScrolledToTop, onScrollEndDrag],
  );

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (onMomentumScrollEnd) onMomentumScrollEnd(event);

      // Wait for some time in case if the momentum scroll is ended by another scroll event (isScrolling.current will not be set to true in time when onMomentumScrollEnd is called).
      setTimeout(() => {
        if (isScrolling.current) return;
        const shouldBeScrolledToTop = isScrolledToTopRef.current;
        setDelayedIsScrolledToTop(shouldBeScrolledToTop);
      }, 100);
    },
    [onMomentumScrollEnd],
  );

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      'keyboardWillShow',
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const wrappedGestureHandlerRef = useRef<any>(null);

  return (
    <GestureHandlerRefContext.Consumer>
      {gestureHandlerRef => {
        const shouldLetGestureHandlerRefWork =
          !disableScrollToDismiss &&
          !isKeyboardVisible &&
          delayedIsScrolledToTop;
        if (shouldLetGestureHandlerRefWork) {
          wrappedGestureHandlerRef.current = (
            gestureHandlerRef as any
          )?.current;
        } else {
          wrappedGestureHandlerRef.current = null;
        }

        return (
          <ScrollView
            ref={scrollViewRef}
            contentInset={contentInset}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={focused}
            onScroll={disableScrollToDismiss ? onScroll : handleScroll}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            simultaneousHandlers={
              shouldLetGestureHandlerRefWork ? gestureHandlerRef : undefined
            }
            bounces={!shouldLetGestureHandlerRefWork || !isScrolledToTop}
            scrollEventThrottle={4}
            {...props}
          >
            {/*
            <View
              // eslint-disable-next-line react-native/no-inline-styles
              style={{
                height: 2,
                backgroundColor: shouldLetGestureHandlerRefWork
                  ? 'green'
                  : 'red',
              }}
            />
            */}
            {children}
          </ScrollView>
        );
      }}
    </GestureHandlerRefContext.Consumer>
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
