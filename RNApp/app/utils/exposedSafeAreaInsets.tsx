import React, { useEffect } from 'react';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

export const safeAreaInsets: EdgeInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export function ExposeSafeAreaInsets() {
  const cSafeAreaInsets = useSafeAreaInsets();
  useEffect(() => {
    safeAreaInsets.top = cSafeAreaInsets.top;
    safeAreaInsets.right = cSafeAreaInsets.right;
    safeAreaInsets.bottom = cSafeAreaInsets.bottom;
    safeAreaInsets.left = cSafeAreaInsets.left;
  }, [cSafeAreaInsets]);
  return <React.Fragment />;
}
