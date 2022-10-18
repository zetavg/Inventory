import React, { useCallback, useState } from 'react';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';

import ModalContent from '@app/components/ModalContent';
import EditingListView from '@app/components/EditingListView';

import commonStyles from '@app/utils/commonStyles';
import moveItemInArray from '@app/utils/moveItemInArray';
import { Alert } from 'react-native';

function OrderItemsScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'OrderItems'>) {
  const { orderedItems, updateOrderFunctionRef, itemDeleteFunctionRef, title } =
    route.params;
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
    async (index: number) => {
      const id = newOrder[index];

      if (itemDeleteFunctionRef) {
        const isSuccess = await itemDeleteFunctionRef.current(id);
        if (!isSuccess) setEditingListViewKey(v => v + 1);
      } else {
        Alert.alert("Can't delete item", "Items can't be deleted from here.");
        setEditingListViewKey(v => v + 1);
      }
    },
    [newOrder, itemDeleteFunctionRef],
  );

  return (
    <ModalContent
      navigation={navigation}
      title={title || 'Order Items'}
      backButtonLabel="Done"
    >
      <EditingListView
        style={[commonStyles.flex1]}
        contentInset={{ topA: 24 } as any}
        editing
        onItemMove={handleItemMove}
        onItemDelete={handleItemDelete}
        key={editingListViewKey}
        scrollToTopOnLoad
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
