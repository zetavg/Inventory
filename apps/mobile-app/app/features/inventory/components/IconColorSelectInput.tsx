import React from 'react';
import { View } from 'react-native';

import commonStyles from '@app/utils/commonStyles';

import ColorSelect from '@app/components/ColorSelect';

type Props = React.ComponentProps<typeof ColorSelect>;
export default function IconColorSelectInput(props: Props) {
  return (
    <View style={[commonStyles.flex1, commonStyles.mv8]}>
      <ColorSelect {...props} />
    </View>
  );
}
