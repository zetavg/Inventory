import { useEffect } from 'react';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';

function InventoryTabScreen({
  navigation,
}: StackScreenProps<StackParamList, 'TmpInventoryTab'>) {
  useEffect(() => {
    navigation.replace('RelationalPouchDBType', { type: 'collection' });
  }, [navigation]);

  return null;
}

export default InventoryTabScreen;
