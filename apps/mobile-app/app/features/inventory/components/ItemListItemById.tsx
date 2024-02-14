import React from 'react';

import { useData } from '@app/data';

import UIGroup from '@app/components/UIGroup';

import ItemListItem from './ItemListItem';

export default function ItemListItemById({
  id,
  onPress,
}: {
  id: string;
  onPress: () => void;
}) {
  const { data } = useData('item', id);

  if (!data) {
    return (
      <UIGroup.ListItem
        disabled
        label="Loading..."
        icon="cube-outline"
        iconColor="transparent"
      />
    );
  }

  if (!data.__valid) {
    return <UIGroup.ListItem disabled label={id} />;
  }

  return <ItemListItem item={data} onPress={onPress} hideContentDetails />;
}
