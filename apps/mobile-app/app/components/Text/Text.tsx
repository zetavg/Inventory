import React from 'react';
import { Text as RNText } from 'react-native';
import { Text } from 'react-native-paper';

import useColors from '@app/hooks/useColors';

export default Text;

export function Link(props: React.ComponentProps<typeof RNText>) {
  const { iosTintColor } = useColors();

  return <RNText {...props} style={[{ color: iosTintColor }, props.style]} />;
}
