import React, { useCallback, useState } from 'react';
import { View, ScrollView, TouchableWithoutFeedback } from 'react-native';

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

import { useRelationalData } from '@app/db';

function CollectionScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'Collection'>) {
  const rootNavigation = useRootNavigation();
  const { id, initialTitle } = route.params;
  const { data, reloadData } = useRelationalData('collection', id);

  useFocusEffect(
    useCallback(() => {
      reloadData();
    }, [reloadData]),
  );

  const collection = data?.data;

  const [devModeCounter, setDevModeCounter] = useState(0);

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
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item vertical2 label="ID" detail={collection?.id} />
            </>
          )}
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            vertical2
            label="Reference Number"
            detail={collection?.collectionReferenceNumber}
          />
        </InsetGroup>
        <InsetGroup
          label="Items in this collection"
          labelVariant="large"
          loading={!collection}
        >
          {(data?.getRelated('items', { arrElementType: 'item' }) || [])
            .flatMap(item => [
              <InsetGroup.Item
                key={item.id}
                vertical
                arrow
                label={item.name}
                detail={item.id}
                onPress={() =>
                  navigation.push('RelationalPouchDBTypeDataDetail', {
                    type: 'item',
                    id: item.id || '',
                    initialTitle: item.name,
                  })
                }
              />,
              <InsetGroup.ItemSeperator key={`s-${item.id}`} />,
            ])
            .slice(0, -1)}
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            button
            label="Add New Item"
            onPress={() =>
              rootNavigation?.push('RelationalPouchDBSave', {
                type: 'item',
                initialData: {
                  collection: collection?.id,
                },
              })
            }
          />
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default CollectionScreen;
