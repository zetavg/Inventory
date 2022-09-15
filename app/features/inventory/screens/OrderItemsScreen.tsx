import React, { useCallback, useState } from 'react';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';

import ModalContent from '@app/components/ModalContent';
import EditingListView from '@app/components/EditingListView';

import commonStyles from '@app/utils/commonStyles';
import moveItemInArray from '@app/utils/moveItemInArray';

function OrderItemsScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'OrderItems'>) {
  const { orderedItems, updateOrderFunctionRef } = route.params;
  const [orderedItemsMap] = useState(
    Object.fromEntries(orderedItems.map(item => [item.id, item])),
  );
  const [newOrder, setNewOrder] = useState<string[]>(
    orderedItems.map(d => d.id).filter((id): id is string => !!id),
  );

  const handleItemMove = useCallback(
    ({ from, to }: { from: number; to: number }) => {
      const newNewOrder = moveItemInArray(newOrder, from, to);
      setNewOrder(newNewOrder);
      updateOrderFunctionRef.current(newNewOrder);
    },
    [newOrder, updateOrderFunctionRef],
  );
  const [editingListViewKey, setEditingListViewKey] = useState(0);
  const handleItemDelete = useCallback(
    () => setEditingListViewKey(v => v + 1),
    [],
  );

  return (
    <ModalContent
      navigation={navigation}
      title="Order Items"
      backButtonLabel="Done"
    >
      <EditingListView
        style={[commonStyles.flex1, commonStyles.pt16]}
        editing
        onItemMove={handleItemMove}
        onItemDelete={handleItemDelete}
        key={editingListViewKey}
      >
        {newOrder
          .map(id => orderedItemsMap[id])
          .map(item => (
            <EditingListView.Item key={item.id} label={item.name} />
          ))}
      </EditingListView>
    </ModalContent>
  );
}

export default OrderItemsScreen;
