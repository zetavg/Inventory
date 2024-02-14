import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Image, StyleSheet } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { SortOption } from '@invt/data/types';

import {
  DataType,
  InvalidDataTypeWithID,
  useData,
  useDataCount,
  ValidDataTypeWithID,
} from '@app/data';
import { getGetAttachmentFromDatum } from '@app/data/functions';

import { useDB } from '@app/db';

import humanFileSize from '@app/utils/humanFileSize';

import type { StackParamList } from '@app/navigation/MainStack';

import useActionSheet from '@app/hooks/useActionSheet';
import useColors from '@app/hooks/useColors';

import Icon from '@app/components/Icon';
import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';
import UIGroupPaginator from '@app/components/UIGroupPaginator';

function ImagesScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Images'>) {
  const [perPage, setPerPage] = React.useState(20);
  const [page, setPage] = React.useState<number>(1);

  const offset = perPage * (page - 1);
  const limit = perPage;

  const [sort, setSort] = useState<SortOption<DataType<'image'>>>([
    { __updated_at: 'desc' } as const,
  ]);

  const {
    count: imagesCount,
    refresh: refreshImagesCount,
    refreshing: imagesCountRefreshing,
  } = useDataCount('image');
  const {
    data: images,
    loading: imagesLoading,
    refresh: refreshImages,
    refreshing: imagesRefreshing,
  } = useData('image', {}, { sort, skip: offset, limit });
  const refresh = useCallback(() => {
    refreshImagesCount();
    refreshImages();
  }, [refreshImages, refreshImagesCount]);
  const refreshing = imagesCountRefreshing || imagesRefreshing;

  const numberOfPages = Math.ceil((imagesCount || 0) / perPage);

  const renderListItem = useCallback(
    ({
      item,
      index,
    }: {
      item: ValidDataTypeWithID<'image'> | InvalidDataTypeWithID<'image'>;
      index: number;
    }) => (
      <UIGroup.ListItem.RenderItemContainer
        isFirst={index === 0}
        isLast={index === (images?.length || 0) - 1}
      >
        <ImageListItem
          image={item}
          loadingDelay={index * 10}
          onPress={() =>
            item.__id && navigation.push('Image', { id: item.__id })
          }
        />
      </UIGroup.ListItem.RenderItemContainer>
    ),
    [images?.length, navigation],
  );

  const scrollViewRef = useRef<FlatList>(null);
  const { showActionSheet } = useActionSheet();
  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(
      scrollViewRef as any,
    );

  return (
    <ScreenContent
      navigation={navigation}
      title="Images"
      headerLargeTitle
      action2Label="Sort"
      action2SFSymbolName="list.number"
      action2MaterialIconName="sort"
      onAction2Press={() =>
        showActionSheet([
          {
            name: 'Updated Date',
            onSelect: () => setSort([{ __updated_at: 'desc' }]),
          },
          {
            name: 'Size',
            onSelect: () => setSort([{ size: 'desc' }]),
          },
        ])
      }
    >
      <FlatList
        ref={scrollViewRef}
        onRefresh={refresh}
        refreshing={refreshing}
        data={images}
        initialNumToRender={32}
        keyExtractor={(image, index) => image.__id || `i-${index}`}
        renderItem={renderListItem}
        ItemSeparatorComponent={
          UIGroup.ListItem.ItemSeparatorComponent.ForItemWithIcon
        }
        ListFooterComponent={
          <>
            <UIGroup.SectionSeparatorComponent />
            <UIGroupPaginator
              perPage={perPage}
              page={page}
              numberOfPages={numberOfPages}
              setPerPage={setPerPage}
              setPage={setPage}
              footer={`Offset: ${offset}, limit: ${limit}.`}
              textInputProps={kiaTextInputProps}
            />
          </>
        }
        ListEmptyComponent={
          <UIGroup
            loading={imagesLoading}
            placeholder={imagesLoading ? undefined : 'No Images'}
          />
        }
        // removeClippedSubviews={true}
      />
    </ScreenContent>
  );
}

function ImageListItem({
  image,
  loadingDelay,
  onPress,
}: {
  image: ValidDataTypeWithID<'image'> | InvalidDataTypeWithID<'image'>;
  loadingDelay?: number;
  onPress: () => void;
}) {
  const [thumbnail, setThumbnail] = useState<{
    content_type: string;
    size: number;
    digest?: string;
    data: string | Blob | Buffer;
  } | null>(null);

  const { db } = useDB();
  const loadThumbnail = useCallback(async () => {
    if (!db) return;
    const getAttachmentFromDatum = getGetAttachmentFromDatum({ db });

    if (!image.__valid) return;

    const t = await getAttachmentFromDatum(image, 'thumbnail-128');
    setThumbnail(t);
  }, [db, image]);

  useEffect(() => {
    const timer = setTimeout(loadThumbnail, 10 + (loadingDelay || 0));
    return () => clearTimeout(timer);
    // loadingDelay is not necessary to be included in the dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadThumbnail]);

  const { iconBackgroundColor } = useColors();

  return (
    <UIGroup.ListItem
      // eslint-disable-next-line react/no-unstable-nested-components
      icon={({ iconProps }) =>
        thumbnail ? (
          <Image
            style={[
              styles.imageListItemImage,
              {
                width: iconProps.size,
                height: iconProps.size,
                backgroundColor: iconBackgroundColor,
                borderColor: iconBackgroundColor,
              },
            ]}
            source={{
              uri: `data:${thumbnail.content_type};base64,${thumbnail.data}`,
            }}
            resizeMode="contain"
          />
        ) : (
          <Icon {...iconProps} name="cube-outline" color="transparent" />
        )
      }
      label={
        typeof image.filename === 'string'
          ? image.filename || image.__id
          : image.__id
      }
      detail={
        typeof image.size === 'number' ? humanFileSize(image.size) : undefined
      }
      verticalArrangedIOS
      navigable
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  imageListItemImage: {
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: -1,
  },
});

export default ImagesScreen;
