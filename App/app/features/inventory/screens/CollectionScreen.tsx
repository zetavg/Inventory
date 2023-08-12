import React, { useCallback, useRef, useState } from 'react';
import { RefreshControl, Text, TouchableWithoutFeedback } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import {
  verifyIconColorWithDefault,
  verifyIconNameWithDefault,
} from '@app/consts/icons';

import {
  DataTypeWithAdditionalInfo,
  onlyValid,
  useData,
  useRelated,
  useSave,
} from '@app/data';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useOrdered from '@app/hooks/useOrdered';

import Icon from '@app/components/Icon';
import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

import ItemListItem from '../components/ItemListItem';

function CollectionScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'Collection'>) {
  const rootNavigation = useRootNavigation();
  const { id, preloadedTitle } = route.params;
  const {
    data,
    loading: dataLoading,
    reload: reloadData,
    refresh: refreshData,
    refreshing: dataRefreshing,
  } = useData('collection', id);
  const {
    data: items,
    loading: itemsLoading,
    refresh: refreshItems,
    refreshing: itemsRefreshing,
  } = useRelated(data, 'items', { sort: [{ __created_at: 'asc' }] });
  // const {
  //   data: items,
  //   loading: itemsLoading,
  //   refresh: refreshItems,
  //   refreshing: itemsRefreshing,
  // } = useData(
  //   'item',
  //   { collection_id: id },
  //   { sort: [{ __created_at: 'asc' }] },
  // );

  const refreshing = dataRefreshing || itemsRefreshing;
  const [reloadCounter, setReloadCounter] = useState(0);
  const refresh = useCallback(() => {
    refreshData();
    refreshItems();
    setReloadCounter(n => n + 1);
  }, [refreshData, refreshItems]);

  const [orderedItems] = useOrdered(
    items && onlyValid(items),
    data?.__valid ? data.items_order || [] : [],
  );

  const handleAddNewItem = useCallback(
    () =>
      rootNavigation?.push('SaveItem', {
        initialData: {
          collection_id: id,
          icon_name:
            typeof data?.item_default_icon_name === 'string'
              ? data.item_default_icon_name
              : undefined,
        },
        afterSave: item => {
          if (
            item.__id &&
            (item.rfid_tag_epc_memory_bank_contents ||
              item.collection_id !== id)
          ) {
            navigation.push('Item', { id: item.__id });
          }
          refreshItems();
        },
      }),
    [
      data?.item_default_icon_name,
      id,
      navigation,
      refreshItems,
      rootNavigation,
    ],
  );

  const { save } = useSave();
  const handleUpdateItemsOrder = useCallback<
    (
      items: ReadonlyArray<DataTypeWithAdditionalInfo<'item'>>,
    ) => Promise<boolean>
  >(
    async its => {
      if (!data || !data.__valid) return false;

      try {
        await save({
          ...data,
          items_order: its.map(it => it.__id).filter((s): s is string => !!s),
        });
        reloadData();
        return true;
      } catch (e) {
        return false;
      }
    },
    [data, reloadData, save],
  );
  const handleUpdateItemsOrderFnRef = useRef(handleUpdateItemsOrder);
  handleUpdateItemsOrderFnRef.current = handleUpdateItemsOrder;

  const [devModeCounter, setDevModeCounter] = useState(0);

  return (
    <ScreenContent
      navigation={navigation}
      title={
        typeof data?.name === 'string'
          ? data.name
          : preloadedTitle || 'Collection'
      }
      action1Label="Edit"
      action1SFSymbolName={(data && 'square.and.pencil') || undefined}
      action1MaterialIconName={(data && 'pencil') || undefined}
      onAction1Press={
        data && data.__valid
          ? () =>
              rootNavigation?.navigate('SaveCollection', {
                initialData: data,
              })
          : undefined
      }
      // action2Label={(data && 'Delete') || undefined}
      // action2SFSymbolName={(data && 'trash') || undefined}
      // action2MaterialIconName={(data && 'delete') || undefined}
      // onAction2Press={handleDelete}
    >
      <ScreenContent.ScrollView
        refreshControl={
          <RefreshControl onRefresh={refresh} refreshing={refreshing} />
        }
      >
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        <UIGroup loading={dataLoading}>
          {(() => {
            const collection = data && onlyValid(data);
            if (!collection) return null;

            return (
              <>
                <TouchableWithoutFeedback
                  onPress={() => {
                    setDevModeCounter(v => v + 1);
                  }}
                >
                  <UIGroup.ListItem
                    verticalArrangedLargeTextIOS
                    label="Collection Name"
                    detail={collection.name}
                    // eslint-disable-next-line react/no-unstable-nested-components
                    rightElement={({ iconProps }) => (
                      <Icon
                        name={verifyIconNameWithDefault(collection.icon_name)}
                        color={verifyIconColorWithDefault(
                          collection.icon_color,
                        )}
                        {...iconProps}
                      />
                    )}
                  />
                </TouchableWithoutFeedback>
                {devModeCounter > 10 && (
                  <>
                    <UIGroup.ListItemSeparator />
                    <UIGroup.ListItem
                      verticalArrangedLargeTextIOS
                      label="ID"
                      monospaceDetail
                      detail={collection.__id}
                    />
                  </>
                )}
                <UIGroup.ListItemSeparator />
                <UIGroup.ListItem
                  verticalArrangedLargeTextIOS
                  label="Reference Number"
                  monospaceDetail
                  detail={collection.collection_reference_number}
                />
              </>
            );
          })()}
        </UIGroup>

        <UIGroup
          header="Items"
          largeTitle
          loading={itemsLoading}
          placeholder={itemsLoading ? undefined : 'No Items'}
          headerRight={
            <>
              {!!orderedItems && (
                <UIGroup.TitleButton
                  onPress={() =>
                    rootNavigation?.push('OrderItems', {
                      orderedItems,
                      onSaveFunctionRef: handleUpdateItemsOrderFnRef,
                    })
                  }
                >
                  {({ iconProps }) => (
                    <Icon {...iconProps} name="app-reorder" />
                  )}
                </UIGroup.TitleButton>
              )}
              <UIGroup.TitleButton primary onPress={handleAddNewItem}>
                {({ iconProps, textProps }) => (
                  <>
                    <Icon {...iconProps} name="add" />
                    <Text {...textProps}>New Item</Text>
                  </>
                )}
              </UIGroup.TitleButton>
            </>
          }
        >
          {orderedItems &&
            orderedItems.length > 0 &&
            UIGroup.ListItemSeparator.insertBetween(
              orderedItems.map(item => (
                <ItemListItem
                  key={item.__id}
                  item={item}
                  reloadCounter={reloadCounter}
                  onPress={() =>
                    navigation.push('Item', {
                      id: item.__id || '',
                    })
                  }
                />
              )),
              { forItemWithIcon: true },
            )}
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default CollectionScreen;
