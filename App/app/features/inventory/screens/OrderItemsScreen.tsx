import React, { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { useData } from '@app/data';

import commonStyles from '@app/utils/commonStyles';
import moveItemInArray from '@app/utils/moveItemInArray';

import type { RootStackParamList } from '@app/navigation/Navigation';

import EditingListView from '@app/components/EditingListView';
import ModalContent, { ConfirmCloseFn } from '@app/components/ModalContent';

function OrderItemsScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'OrderItems'>) {
  const { title, orderedItems, onSaveFunctionRef } = route.params;

  // const [originalItems] = useState(orderedItems);
  const [items, setItems] = useState(orderedItems);

  const isClosing = useRef(false);

  const handleItemMove = useCallback(
    ({ from, to }: { from: number; to: number }) => {
      setItems(its => moveItemInArray(its, from, to));
    },
    [],
  );

  const handleCancel = useCallback(() => {
    if (items.every((item, i) => item.__id === orderedItems[i]?.__id)) {
      isClosing.current = true;
      navigation.goBack();
      return;
    }
    Alert.alert(
      'Unsaved Changes',
      'Are you sure you want to discard unsaved changes?',
      [
        {
          text: 'No, Continue Editing',
          style: 'cancel',
        },
        {
          text: 'Yes, Discard',
          style: 'destructive',
          onPress: async () => {
            isClosing.current = true;
            navigation.goBack();
          },
        },
      ],
    );
  }, [items, orderedItems, navigation]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    const onSave = onSaveFunctionRef.current;
    const result = await onSave(items);

    if (result && !isClosing.current) {
      isClosing.current = true;
      navigation.goBack();
    }

    return result;
  }, [items, navigation, onSaveFunctionRef]);

  const handleClose = useCallback<ConfirmCloseFn>(
    async confirm => {
      if (isClosing.current) {
        confirm();
        return;
      }

      const result = await handleSave();
      if (result) confirm();
    },
    [handleSave],
  );

  return (
    <ModalContent
      navigation={navigation}
      title={title || 'Reorder Items'}
      preventClose
      confirmCloseFn={handleClose}
      // TODO: Update Android Icon
      showBackButton={false}
      action1Label="Save"
      onAction1Press={handleSave}
      action1Variant="strong"
      action2Label="Cancel"
      onAction2Press={handleCancel}
    >
      <EditingListView canMove editing onItemMove={handleItemMove}>
        {items.map((item, i) => (
          <EditingListView.Item
            key={typeof item.__id === 'string' ? item.__id || i : i}
            label={item.name}
          />
        ))}
      </EditingListView>
    </ModalContent>
  );
}

export default OrderItemsScreen;
