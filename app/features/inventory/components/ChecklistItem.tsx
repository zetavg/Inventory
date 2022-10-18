import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import InsetGroup from '@app/components/InsetGroup';
import Icon, { IconName } from '@app/components/Icon';

import useDB from '@app/hooks/useDB';
import { DataTypeWithID } from '@app/db/relationalUtils';

export default function ChecklistItem({
  checklist,
  onPress,
  hideDetails,
  reloadCounter,
  ...props
}: {
  checklist: DataTypeWithID<'checklist'>;
  onPress: () => void;
  hideDetails?: boolean;
  reloadCounter: number;
} & React.ComponentProps<typeof InsetGroup.Item>) {
  const { db } = useDB();
  const [itemsCount, setItemsCount] = useState<number | null>(null);
  const loadItemsCount = useCallback(async () => {
    const results = await db.query(
      'relational_data_index/checklistItem_by_checklist',
      {
        startkey: checklist.id,
        endkey: checklist.id,
        include_docs: false,
      },
    );
    setItemsCount(results.rows.length);
  }, [checklist.id, db]);

  useEffect(() => {
    reloadCounter;
    if (hideDetails) return;

    loadItemsCount();
  }, [hideDetails, loadItemsCount, reloadCounter]);

  return (
    <InsetGroup.Item
      key={checklist.id}
      arrow
      vertical={!hideDetails}
      label={checklist.name}
      leftElement={
        <Icon
          name={checklist.iconName as IconName}
          color={checklist.iconColor}
          style={styles.checklistItemIcon}
          // size={20}
          size={30}
          showBackground
          backgroundPadding={4}
        />
      }
      labelTextStyle={styles.checklistItemLabelText}
      detailTextStyle={styles.checklistItemDetailText}
      onPress={onPress}
      detail={
        hideDetails
          ? undefined
          : [
              // checklist.checklistReferenceNumber,
              itemsCount !== null && `${itemsCount} items`,
            ]
              .filter(s => s)
              .join(' | ')
      }
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  checklistItemIcon: { marginRight: -2 },
  checklistItemLabelText: { fontSize: 16 },
  checklistItemDetailText: { fontSize: 12 },
});
