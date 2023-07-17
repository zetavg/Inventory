import React, { useEffect } from 'react';

import {
  verifyIconColorWithDefault,
  verifyIconNameWithDefault,
} from '@app/consts/icons';

import { DataTypeWithAdditionalInfo, useDataCount } from '@app/data';

import UIGroup from '@app/components/UIGroup';

export default function ItemListItem({
  item,
  onPress,
  hideDetails,
  reloadCounter,
  ...props
}: {
  item: DataTypeWithAdditionalInfo<'item'>;
  onPress: () => void;
  hideDetails?: boolean;
  /** Can be used to reload the data in this component. Set this to a different value that isn't 0 to trigger an reload. */
  reloadCounter?: number;
} & React.ComponentProps<typeof UIGroup.ListItem>) {
  // const { count: itemsCount, refresh: refreshItemsCount } = useDataCount(
  //   'item',
  //   {
  //     item_id: item.__id,
  //   },
  // );

  useEffect(() => {
    reloadCounter;
    if (hideDetails) return;
    if (!reloadCounter) return;

    // refreshItemsCount();
  }, [hideDetails, reloadCounter]);

  return (
    <UIGroup.ListItem
      key={item.__id}
      verticalArrangedNormalLabelIOS={!hideDetails}
      label={item.name}
      icon={verifyIconNameWithDefault(item.icon_name)}
      iconColor={verifyIconColorWithDefault(item.icon_color)}
      onPress={onPress}
      navigable={!!onPress}
      detail={
        hideDetails
          ? undefined
          : [
              'This is an item',
              // item.item_reference_number,
              // itemsCount !== null && itemsCount === 1
              //   ? `${itemsCount} item`
              //   : `${itemsCount} items`,
            ]
              .filter(s => s)
              .join(' | ')
      }
      {...props}
    />
  );
}
