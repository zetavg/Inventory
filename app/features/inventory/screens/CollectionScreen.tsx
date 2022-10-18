import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import { useFocusEffect } from '@react-navigation/native';

import Color from 'color';
import commonStyles from '@app/utils/commonStyles';
import useColors from '@app/hooks/useColors';
import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';
import Icon, { IconName, IconColor } from '@app/components/Icon';

import useDB from '@app/hooks/useDB';
import { useRelationalData } from '@app/db';

import ItemItem from '../components/ItemItem';
import useOrderedData from '@app/hooks/useOrderedData';
import { getDataFromDocs } from '@app/db/hooks';
import { DataTypeWithID } from '@app/db/relationalUtils';

function CollectionScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'Collection'>) {
  const { db } = useDB();
  const rootNavigation = useRootNavigation();
  const { id, initialTitle } = route.params;
  const { data, reloadData } = useRelationalData('collection', id);

  const collection = data?.data;
  const [items, setItems] = useState<null | DataTypeWithID<'item'>[]>(null);
  const loadItems = useCallback(async () => {
    const { docs } = await db.find({
      selector: {
        $and: [
          { type: 'item' },
          { 'data.collection': id },
          { 'data.computedShowInCollection': true },
        ],
      },
      use_index: 'index-item-collection-computedShowInCollection',
    });
    setItems(getDataFromDocs('item', docs));
  }, [db, id]);
  useEffect(() => {
    loadItems();
  }, [loadItems]);
  const { orderedData: orderedItems, updateOrder: updateItemsOrder } =
    useOrderedData({
      data: items,
      settingName: `collection-${collection?.id}-items`,
      settingPriority: '10',
    });
  const updateItemsOrderFunctionRef = useRef(updateItemsOrder);
  updateItemsOrderFunctionRef.current = updateItemsOrder;

  const handleAddNewItem = useCallback(
    () =>
      rootNavigation?.push('SaveItem', {
        initialData: {
          collection: collection?.id,
          iconName: collection?.itemDefaultIconName,
        },
        afterSave: item => {
          item.id &&
            item.itemReferenceNumber &&
            navigation.push('Item', { id: item.id });
        },
      }),
    [collection, navigation, rootNavigation],
  );

  const [reloadCounter, setReloadCounter] = useState(0);
  useFocusEffect(
    useCallback(() => {
      reloadData();
      loadItems();
      setReloadCounter(v => v + 1);
    }, [loadItems, reloadData]),
  );

  const [devModeCounter, setDevModeCounter] = useState(0);

  const { textOnDarkBackgroundColor, iosTintColor } = useColors();

  return (
    <ScreenContent
      navigation={navigation}
      title={data?.data ? data?.data.name : initialTitle || 'Collection'}
      action1Label="Edit"
      action1SFSymbolName={(data && 'square.and.pencil') || undefined}
      action1MaterialIconName={(data && 'pencil') || undefined}
      onAction1Press={
        collection
          ? () =>
              rootNavigation?.navigate('SaveCollection', {
                initialData: collection,
              })
          : undefined
      }
      // action2Label={(data && 'Delete') || undefined}
      // action2SFSymbolName={(data && 'trash') || undefined}
      // action2MaterialIconName={(data && 'delete') || undefined}
      // onAction2Press={handleDelete}
    >
      <ScrollView keyboardDismissMode="interactive">
        <InsetGroup style={commonStyles.mt2} loading={!collection}>
          <TouchableWithoutFeedback
            onPress={() => {
              setDevModeCounter(v => v + 1);
            }}
          >
            <View style={[commonStyles.row, commonStyles.centerChildren]}>
              <InsetGroup.Item
                vertical2
                label="Collection Name"
                detail={collection?.name}
                containerStyle={[commonStyles.flex1]}
              />
              <Icon
                showBackground
                name={collection?.iconName as IconName}
                color={collection?.iconColor as IconColor}
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
                detail={collection?.id}
              />
            </>
          )}
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            vertical2
            label="Reference Number"
            detailTextStyle={commonStyles.monospaced}
            detail={collection?.collectionReferenceNumber}
          />
        </InsetGroup>
        <InsetGroup
          label="Items"
          labelVariant="large"
          loading={!collection}
          labelRight={
            <>
              {orderedItems && orderedItems.length > 0 && (
                <InsetGroup.LabelButton
                  onPress={() =>
                    rootNavigation?.push('OrderItems', {
                      orderedItems,
                      updateOrderFunctionRef: updateItemsOrderFunctionRef,
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
              <InsetGroup.LabelButton primary onPress={handleAddNewItem}>
                <Icon
                  name="add"
                  sfSymbolWeight="bold"
                  color={textOnDarkBackgroundColor}
                />{' '}
                New Item
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
                  hideCollectionDetails
                  reloadCounter={reloadCounter}
                  onPress={() =>
                    navigation.push('Item', {
                      id: item.id || '',
                      initialTitle: item.name,
                    })
                  }
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
            onPress={handleAddNewItem}
          />*/}
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default CollectionScreen;
