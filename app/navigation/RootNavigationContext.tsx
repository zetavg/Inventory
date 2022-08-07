import React, { useContext } from 'react';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from './index';

type RootNavigation = StackScreenProps<
  RootStackParamList,
  'Main'
>['navigation'];

const RootNavigationContext = React.createContext<RootNavigation | null>(null);

export function useRootNavigation() {
  return useContext(RootNavigationContext);
}

export default RootNavigationContext;
