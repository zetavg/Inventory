import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import commonStyles from '@app/utils/commonStyles';
import useColors from '@app/hooks/useColors';
import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';
import Button from '@app/components/Button';
import Text from '@app/components/Text';
import Icon from '@app/components/Icon';

import useDB from '@app/hooks/useDB';
import { useRelationalData } from '@app/db';

import useActionSheet from '@app/hooks/useActionSheet';
import useOrderedData from '@app/hooks/useOrderedData';
import { getDataFromDocs } from '@app/db/hooks';
import { DataTypeWithID, del, save } from '@app/db/relationalUtils';

import ItemItem from '../components/ItemItem';
import useCheckItems from '../hooks/useCheckItems';

function ChecklistScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'Checklist'>) {
  const { db } = useDB();
  const { showActionSheetWithOptions } = useActionSheet();
  const rootNavigation = useRootNavigation();
  const { id, initialTitle } = route.params;
  const { data, reloadData } = useRelationalData('checklist', id);

  const checklist = data?.data;
  const checklistItems = data?.getRelated('checklistItems', {
    arrElementType: 'checklistItem',
  });
  const [items, setItems] = useState<
    null | (DataTypeWithID<'item'> & { checklistItemId: string })[]
  >(null);
  const loadItems = useCallback(async () => {
    if (!checklistItems) return;

    const promises = checklistItems.map(async checklistItem => {
      try {
        const doc = await db.get(`item-2-${checklistItem.item}`);
        if (doc.type !== 'item') return null;
        const [d] = getDataFromDocs('item', [doc]);
        if (!d) return null;

        return { ...d, checklistItemId: checklistItem.id };
      } catch (e) {
        // Handle non-404 errors
        return null;
      }
    });
    const its = (await Promise.all(promises)).filter(
      (i): i is DataTypeWithID<'item'> & { checklistItemId: string } => !!i,
    );
    setItems(its);
  }, [checklistItems, db]);
  useEffect(() => {
    loadItems();
  }, [loadItems]);
  const { orderedData: orderedItems, updateOrder: updateItemsOrder } =
    useOrderedData({
      data: items,
      settingName: `checklist-${checklist?.id}-items`,
      settingPriority: '12',
    });
  const updateItemsOrderFunctionRef = useRef(updateItemsOrder);
  updateItemsOrderFunctionRef.current = updateItemsOrder;

  const handleAddItem = useCallback(
    () =>
      rootNavigation?.push('SelectItems', {
        callback: async itemIds => {
          try {
            const existingItemIdsSet = new Set(
              checklistItems?.map(it => it.item) || [],
            );
            const itemIdsToAdd = itemIds.filter(
              itemId => !existingItemIdsSet.has(itemId),
            );
            await Promise.all(
              itemIdsToAdd.map(itemId =>
                save(db, 'checklistItem', { checklist: id, item: itemId }),
              ),
            );
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      }),
    [rootNavigation, checklistItems, db, id],
  );

  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      if (!checklistItems) return false;
      setIsDeletingItem(true);

      try {
        const checklistItemsToDelete = checklistItems.filter(
          it => it.item === itemId,
        );

        await Promise.all(
          checklistItemsToDelete.map(
            it => it.id && del(db, 'checklistItem', it.id),
          ),
        );

        return true;
      } catch (e: any) {
        Alert.alert('Error', e.message);
        return false;
      } finally {
        reloadData();
        setIsDeletingItem(false);
      }
    },
    [checklistItems, db, reloadData],
  );
  const itemDeleteFunctionRef = useRef(handleDeleteItem);
  itemDeleteFunctionRef.current = handleDeleteItem;

  const handleItemLongPress = useCallback(
    (item: DataTypeWithID<'item'> & { checklistItemId: string }) => {
      const options = {
        remove: 'Remove From List',
        cancel: 'Cancel',
      } as const;
      const optionKeys: ReadonlyArray<keyof typeof options> = Object.keys(
        options,
      ) as any;
      const cancelButtonIndex = optionKeys.length - 1;
      const destructiveButtonIndex = optionKeys.length - 2;
      showActionSheetWithOptions(
        {
          options: Object.values(options),
          cancelButtonIndex,
          destructiveButtonIndex,
        },
        buttonIndex => {
          if (typeof buttonIndex !== 'number') return;
          if (buttonIndex === cancelButtonIndex) {
            return;
          }

          const optionKey = optionKeys[buttonIndex];
          switch (optionKey) {
            case 'remove': {
              item.id && handleDeleteItem(item.id);
              break;
            }
          }
        },
      );
    },
    [showActionSheetWithOptions, handleDeleteItem],
  );

  const [handleCheckItems] = useCheckItems({
    scanName: `container-${id}-scan`,
    items: items || [],
    navigation,
  });

  const [reloadCounter, setReloadCounter] = useState(0);
  useFocusEffect(
    useCallback(() => {
      reloadData();
      setReloadCounter(v => v + 1);
    }, [reloadData]),
  );

  const { textOnDarkBackgroundColor, iosTintColor } = useColors();

  return (
    <ScreenContent
      navigation={navigation}
      title={data?.data ? data?.data.name : initialTitle || 'Checklist'}
      action1Label="Edit"
      action1SFSymbolName={(data && 'square.and.pencil') || undefined}
      action1MaterialIconName={(data && 'pencil') || undefined}
      onAction1Press={
        checklist
          ? () =>
              rootNavigation?.navigate('SaveChecklist', {
                initialData: checklist,
              })
          : undefined
      }
      // action2Label={(data && 'Delete') || undefined}
      // action2SFSymbolName={(data && 'trash') || undefined}
      // action2MaterialIconName={(data && 'delete') || undefined}
      // onAction2Press={handleDelete}
    >
      <ScrollView keyboardDismissMode="interactive">
        <View style={commonStyles.mt2} />
        {/*<InsetGroup loading={!checklist}>
          <TouchableWithoutFeedback
            onPress={() => {
              setDevModeCounter(v => v + 1);
            }}
          >
            <View style={[commonStyles.row, commonStyles.centerChildren]}>
              <InsetGroup.Item
                vertical2
                label="Checklist Name"
                detail={checklist?.name}
                containerStyle={[commonStyles.flex1]}
              />
              <Icon
                showBackground
                name={checklist?.iconName as IconName}
                color={checklist?.iconColor as IconColor}
                size={40}
                style={{ marginRight: InsetGroup.MARGIN_HORIZONTAL }}
              />
            </View>
          </TouchableWithoutFeedback>
          {devModeCounter > 10 && (
            <>
              <InsetGroup.ItemSeparator />
              <InsetGroup.Item
                vertical2
                label="ID"
                detailTextStyle={commonStyles.monospaced}
                detail={checklist?.id}
              />
            </>
          )}
        </InsetGroup>*/}
        {!!checklist?.description && (
          <InsetGroup backgroundTransparent style={commonStyles.mb16}>
            <Text style={commonStyles.fs16}>{checklist.description}</Text>
          </InsetGroup>
        )}
        <View style={commonStyles.mt16} />
        {items && items.length > 0 && (
          <InsetGroup backgroundTransparent>
            <Button mode="text" onPress={handleCheckItems}>
              <Icon
                name="checklist"
                sfSymbolWeight="bold"
                color={iosTintColor}
              />{' '}
              Check Items
            </Button>
          </InsetGroup>
        )}
        <InsetGroup
          label="Items"
          labelVariant="large"
          loading={!checklist || isDeletingItem}
          labelRight={
            <>
              {orderedItems && orderedItems.length > 0 && (
                <InsetGroup.LabelButton
                  onPress={() =>
                    rootNavigation?.push('OrderItems', {
                      orderedItems,
                      updateOrderFunctionRef: updateItemsOrderFunctionRef,
                      itemDeleteFunctionRef,
                      title: 'Edit Items',
                    })
                  }
                  contentAsText={false}
                  style={commonStyles.mr8}
                >
                  <Icon
                    name="app-reorder"
                    sfSymbolWeight="bold"
                    color={iosTintColor}
                  />
                </InsetGroup.LabelButton>
              )}
              <InsetGroup.LabelButton primary onPress={handleAddItem}>
                <Icon
                  name="add"
                  sfSymbolWeight="bold"
                  color={textOnDarkBackgroundColor}
                />{' '}
                Add Items
              </InsetGroup.LabelButton>
            </>
          }
        >
          {(() => {
            if (!orderedItems)
              return <InsetGroup.Item label="Loading..." disabled />;
            if (orderedItems.length <= 0)
              return <InsetGroup.Item label="No Items" disabled />;
            return orderedItems
              .flatMap(item => [
                <ItemItem
                  key={item.id}
                  item={item}
                  reloadCounter={reloadCounter}
                  onPress={() =>
                    navigation.push('Item', {
                      id: item.id || '',
                      initialTitle: item.name,
                    })
                  }
                  onLongPress={() => handleItemLongPress(item)}
                />,
                <InsetGroup.ItemSeparator
                  key={`s-${item.id}`}
                  leftInset={60}
                />,
              ])
              .slice(0, -1);
          })()}
          {/*<InsetGroup.ItemSeparator />
          <InsetGroup.Item
            button
            label="Add New Item"
            onPress={handleAddItem}
          />*/}
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default ChecklistScreen;
