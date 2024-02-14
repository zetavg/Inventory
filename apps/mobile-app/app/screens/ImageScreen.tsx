import React from 'react';
import type { StackScreenProps } from '@react-navigation/stack';

import ImagesSliderBox from '@app/features/inventory/components/ImagesSliderBox';
import ItemListItem from '@app/features/inventory/components/ItemListItem';

import { onlyValid, useData } from '@app/data';

import commonStyles from '@app/utils/commonStyles';
import humanFileSize from '@app/utils/humanFileSize';

import type { StackParamList } from '@app/navigation/MainStack';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

function ImageScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'Image'>) {
  const { id } = route.params;

  const {
    data: image,
    loading: imageLoading,
    refresh: refreshImage,
    refreshing: imageRefreshing,
  } = useData('image', id);

  const {
    data: itemImage,
    loading: itemImageLoading,
    refresh: refreshItemImage,
    refreshing: itemImageRefreshing,
  } = useData(
    'item_image',
    { image_id: id },
    { sort: [{ __updated_at: 'desc' }] },
  );
  const {
    data: items,
    loading: itemsLoading,
    refresh: refreshItems,
    refreshing: itemsRefreshing,
  } = useData(
    'item',
    itemImage
      ?.map(ii => ii.item_id)
      .filter((s): s is string => typeof s === 'string') || [],
    { disable: !itemImage },
  );

  const validItems = onlyValid(items);

  const filename =
    typeof image?.filename === 'string' ? image?.filename : undefined;

  return (
    <ScreenContent navigation={navigation} title="Image" headerLargeTitle>
      <ScreenContent.ScrollView>
        <UIGroup.FirstGroupSpacing />

        <UIGroup loading={imageLoading}>
          <UIGroup.ListItem
            verticalArrangedLargeTextIOS
            label="Filename"
            detail={filename || '(undefined)'}
            detailTextStyle={filename ? undefined : commonStyles.opacity05}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            verticalArrangedLargeTextIOS
            label="Size"
            detail={
              typeof image?.size === 'number'
                ? humanFileSize(image?.size)
                : '(undefined)'
            }
            detailTextStyle={
              typeof image?.size === 'number'
                ? undefined
                : commonStyles.opacity05
            }
          />
        </UIGroup>

        <UIGroup>
          <ImagesSliderBox imageIds={[id]} />
        </UIGroup>

        {!!validItems && validItems.length > 0 && (
          <UIGroup header="Used By">
            {UIGroup.ListItemSeparator.insertBetween(
              validItems.map(item => (
                <ItemListItem
                  key={item.__id}
                  item={item}
                  onPress={() =>
                    navigation.push('Item', {
                      id: item.__id || '',
                      preloadedTitle: item.name,
                    })
                  }
                />
              )),
            )}
          </UIGroup>
        )}
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default ImageScreen;
