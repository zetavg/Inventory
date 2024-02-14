import React from 'react';
import { Switch as RNSwitch } from 'react-native';
import { Switch as PaperSwitch } from 'react-native-paper';

type Props = React.ComponentProps<typeof RNSwitch>;

function Switch({ ...props }: Props) {
  return <RNSwitch {...props} />;
}

export default Switch;
