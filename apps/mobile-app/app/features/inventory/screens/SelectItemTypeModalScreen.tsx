import React, { useCallback, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { DataType } from '@app/data';

import type { RootStackParamList } from '@app/navigation/Navigation';

import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

function getFooterText(value: DataType<'item'>['item_type']): string {
  switch (value) {
    case 'container':
      return 'A storage container such as a toolbox or a case. It can contain other items that should be stored inside of it.';
    case 'generic_container':
      return ''; // TODO: explain
    case 'item_with_parts':
      return 'An item that can have nested items.';
    case 'consumable':
      return 'Consumable items, which you can track the stock.';
    case undefined:
      return 'A normal item.';
  }
}

function SelectItemTypeModalScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'SelectItemType'>) {
  const { callback, defaultValue } = route.params;
  const [value, setValue] = useState(defaultValue);

  const scrollViewRef = useRef<ScrollView>(null);

  const handleSelect = useCallback(() => {
    callback(value);
    navigation.goBack();
  }, [callback, value, navigation]);

  const isCancel = useRef(false);
  const handleLeave = useCallback(
    (confirm: () => void) => {
      if (isCancel.current) return confirm();

      callback(value);
      confirm();
    },
    [callback, value],
  );

  const cancel = useCallback(() => {
    isCancel.current = true;
    navigation.goBack();
  }, [navigation]);

  return (
    <ModalContent
      navigation={navigation}
      title="Select Item Type"
      preventClose={true}
      confirmCloseFn={handleLeave}
      action2Label="Cancel"
      onAction2Press={cancel}
      action1Label="Select"
      // action1MaterialIconName="check"
      onAction1Press={handleSelect}
      action1Variant="strong"
    >
      <ModalContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />
        <UIGroup footer={getFooterText(value)}>
          <UIGroup.ListItem
            label="Item"
            onPress={() => setValue(undefined)}
            selected={value === undefined}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Container"
            onPress={() => setValue('container')}
            selected={value === 'container'}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Item with Parts"
            onPress={() => setValue('item_with_parts')}
            selected={value === 'item_with_parts'}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Consumable"
            onPress={() => setValue('consumable')}
            selected={value === 'consumable'}
          />
        </UIGroup>
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default SelectItemTypeModalScreen;
