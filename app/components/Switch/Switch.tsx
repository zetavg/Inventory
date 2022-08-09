import React from 'react';

import { Switch as PaperSwitch } from 'react-native-paper';

type Props = React.ComponentProps<typeof PaperSwitch>;

function Switch({ ...props }: Props) {
  return <PaperSwitch {...props} />;
}

export default Switch;
