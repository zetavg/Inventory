import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  LayoutAnimation,
  StyleSheet,
  View,
} from 'react-native';
import { TouchableWithoutFeedback } from 'react-native';
import RNFS from 'react-native-fs';
import ImageView from 'react-native-image-viewing';
import Animated, {
  Extrapolate,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import Share from 'react-native-share';

import { DEFAULT_LAYOUT_ANIMATION_CONFIG } from '@app/consts/animations';

import { DataTypeWithID } from '@app/data';
import { getGetAttachmentFromDatum, getGetDatum } from '@app/data/functions';

import { useDB } from '@app/db';

import useLogger from '@app/hooks/useLogger';

import { imageLoadingPlaceholder } from '@app/images';

type Props = {
  imageIds: ReadonlyArray<string>;
  ratio?: number;
};

function ImagesSliderBox({ imageIds, ratio = 1 }: Props) {
  const logger = useLogger('ImagesSliderBox');
  const { db } = useDB();
  const [layoutSize, setLayoutSize] = useState(0);

  const progressValue = useSharedValue<number>(0);

  const handleLayout = useCallback<
    Exclude<React.ComponentProps<typeof View>['onLayout'], undefined>
  >(event => {
    const { width: w } = event.nativeEvent.layout;

    LayoutAnimation.configureNext(DEFAULT_LAYOUT_ANIMATION_CONFIG);
    setLayoutSize(w);
  }, []);

  const [thumbnails, setThumbnails] = useState<{ [id: string]: string }>({});
  const [images, setImages] = useState<{ [id: string]: string }>({});
  const [thumbnailsLoading, setThumbnailsLoading] = useState(true);

  const [imageMap, setImageMap] = useState(
    new Map<string, DataTypeWithID<'image'>>(),
  );

  const loadImages = useCallback(
    async ({ cancelled }: { cancelled: { value: boolean } }) => {
      try {
        if (!db) return;
        if (cancelled.value) return;

        const getDatum = getGetDatum({ db });
        const getAttachmentFromDatum = getGetAttachmentFromDatum({ db });

        let i = 0;
        for (const imageId of imageIds) {
          try {
            if (cancelled.value) return;
            const image = await getDatum('image', imageId);
            if (cancelled.value) return;
            if (!image) {
              throw new Error('Cannot get image thumbnail - cannot find image');
            }
            if (!image.__valid) {
              throw new Error(
                'Cannot get image thumbnail - image is not valid',
              );
            }
            imageMap.set(imageId, image);

            if (i === 0) {
              const thumbnail = await getAttachmentFromDatum(
                image,
                'thumbnail-128',
              );
              if (cancelled.value) return;
              if (!thumbnail) {
                throw new Error(
                  'Cannot get image thumbnail - missing thumbnail-1024',
                );
              }
              setThumbnails(ts => ({
                ...ts,
                [imageId]: `data:${thumbnail.content_type};base64,${thumbnail.data}`,
              }));
              await new Promise(r => setTimeout(r, 20));
              if (cancelled.value) return;
            }

            const thumbnail = await getAttachmentFromDatum(
              image,
              'thumbnail-1024',
            );
            if (cancelled.value) return;
            if (!thumbnail) {
              throw new Error(
                'Cannot get image thumbnail - missing thumbnail-1024',
              );
            }
            setThumbnails(ts => ({
              ...ts,
              [imageId]: `data:${thumbnail.content_type};base64,${thumbnail.data}`,
            }));
            await new Promise(r => setTimeout(r, 10));
          } catch (e) {
            logger.error(e, { details: JSON.stringify({ imageId }, null, 2) });
          } finally {
            i += 1;
          }
        }

        setThumbnailsLoading(false);

        for (const imageId of imageIds) {
          try {
            await new Promise(r => setTimeout(r, 100));
            if (cancelled.value) return;

            const image =
              imageMap.get(imageId) || (await getDatum('image', imageId));
            if (cancelled.value) return;

            if (!image) {
              throw new Error('Cannot get image - cannot find image');
            }
            if (!image.__valid) {
              throw new Error('Cannot get image - image is not valid');
            }

            const img = await getAttachmentFromDatum(image, 'image-2048');
            if (cancelled.value) return;
            if (!img) {
              throw new Error('Cannot get image - missing image-2048');
            }
            setImages(ts => ({
              ...ts,
              [imageId]: `data:${img.content_type};base64,${img.data}`,
            }));
          } catch (e) {
            logger.error(e, { details: JSON.stringify({ imageId }, null, 2) });
          } finally {
            i += 1;
          }
        }
      } catch (e) {
        logger.error(e, { details: JSON.stringify({ imageIds }, null, 2) });
      } finally {
        setThumbnailsLoading(false);
      }
    },
    [db, imageIds, imageMap, logger],
  );
  useEffect(() => {
    const cancelled = { value: false };
    loadImages({ cancelled });
    return () => {
      cancelled.value = true;
    };
  }, [loadImages]);

  const imageThumbnails = useMemo(
    () =>
      imageIds
        .map(imgId =>
          thumbnails[imgId] ? { __id: imgId, uri: thumbnails[imgId] } : null,
        )
        .filter((n): n is NonNullable<typeof n> => !!n),
    [imageIds, thumbnails],
  );

  const imageImages = useMemo(
    () =>
      imageThumbnails.map(it =>
        images[it.__id]
          ? { __id: it.__id, uri: images[it.__id] }
          : imageLoadingPlaceholder,
      ),
    [imageThumbnails, images],
  );

  const [imageViewVisible, setImageViewVisible] = useState(false);
  const [imageViewImageIndex, setImageViewImageIndex] = useState(0);
  const openImageView = useCallback(
    (imgId: string) => {
      const index = imageThumbnails.findIndex(ii => ii.__id === imgId);
      if (index < 0) return;
      setImageViewImageIndex(index);
      setImageViewVisible(true);
    },
    [imageThumbnails],
  );
  const closeImageView = useCallback(() => {
    setImageViewVisible(false);
  }, []);

  return (
    <View onLayout={handleLayout} style={{ height: layoutSize * ratio }}>
      {!!layoutSize && (
        <Carousel
          width={layoutSize}
          height={layoutSize * ratio}
          pagingEnabled
          snapEnabled
          loop={false}
          data={imageThumbnails}
          renderItem={({ item }) => (
            <Animated.View entering={FadeIn.duration(300)}>
              <TouchableWithoutFeedback
                onPress={() => openImageView(item.__id)}
              >
                <Image
                  source={item}
                  resizeMode={
                    item?.uri?.startsWith('data:image/png')
                      ? 'contain'
                      : 'cover'
                  }
                  style={{ height: layoutSize * ratio }}
                />
              </TouchableWithoutFeedback>
            </Animated.View>
          )}
          onProgressChange={(_, absoluteProgress) =>
            (progressValue.value = absoluteProgress)
          }
          panGestureHandlerProps={{
            activeOffsetX: [-10, 10],
          }}
        />
      )}
      {!!progressValue && imageThumbnails.length > 1 && (
        <View style={styles.paginationContainer}>
          {imageThumbnails.map((_, index) => {
            return (
              <PaginationItem
                key={index}
                index={index}
                progressValue={progressValue}
                length={imageThumbnails.length}
              />
            );
          })}
        </View>
      )}
      <ImageView
        images={imageImages}
        imageIndex={imageViewImageIndex}
        visible={imageViewVisible}
        onRequestClose={closeImageView}
        keyExtractor={(item, index) => (item as any).__id || index}
        onLongPress={async item => {
          const imageId = (item as any).__id;
          const imageUri = (item as any).uri;
          if (!imageId) return;
          if (!imageUri) return;

          const image = imageMap.get(imageId);
          const filename =
            image?.filename ||
            `image.${imageUri.startsWith('data:image/png') ? 'png' : 'jpg'}`;
          const tmpFilePath = `${RNFS.TemporaryDirectoryPath}/${filename}`;
          await RNFS.writeFile(tmpFilePath, imageUri.split(',')[1], 'base64');

          Share.open({
            url: tmpFilePath,
            failOnCancel: false,
          });
        }}
      />
      {thumbnailsLoading && (
        <View style={styles.loadingIndicatorContainer}>
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
}
const PaginationItem: React.FC<{
  index: number;
  length: number;
  progressValue: Animated.SharedValue<number>;
}> = props => {
  const { index, progressValue } = props;

  const animStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        Math.abs(progressValue.value - index),
        [0, 1],
        [1, 0.5],
        Extrapolate.CLAMP,
      ),
    };
  }, [progressValue, index]);

  return <Animated.View style={[styles.paginationItem, animStyle]} />;
};

const styles = StyleSheet.create({
  loadingIndicatorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    height: 32,
  },
  paginationItem: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: 'white',
  },
});

export default ImagesSliderBox;
