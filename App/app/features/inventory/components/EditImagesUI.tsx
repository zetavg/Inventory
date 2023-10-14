import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  LayoutAnimation,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import ImageView from 'react-native-image-viewing';
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { v4 as uuid } from 'uuid';

import { DEFAULT_LAYOUT_ANIMATION_CONFIG } from '@app/consts/animations';

import { selectors, useAppSelector } from '@app/redux';

import { DataTypeWithID, onlyValid, useData } from '@app/data';
import {
  getAttachAttachmentToDatum,
  getGetAttachmentFromDatum,
  getGetData,
  getGetDatum,
  getSaveDatum,
} from '@app/data/functions';
import useImageSelector, { ImageData } from '@app/data/images/useImageSelector';

import { useDB } from '@app/db';

import commonStyles from '@app/utils/commonStyles';

import useColors from '@app/hooks/useColors';
import useLogger from '@app/hooks/useLogger';

import UIGroup from '@app/components/UIGroup';

import { imageLoadingPlaceholder } from '@app/images';

export type SaveImagesFn = (p: { savedItemId: string }) => Promise<boolean>;

export type UnsavedImageData = ImageData & {
  __type: 'unsaved_image_data';
  __id: string;
};

type ItemImageDatum = UnsavedImageData | DataTypeWithID<'item_image'>;

const IMAGES_LIMIT = 5;

export function EditImagesUI({
  itemId,
  saveFnRef,
  hasChangesRef,
  loading,
}: {
  itemId: string | undefined;
  loading: boolean;
  saveFnRef: React.MutableRefObject<null | SaveImagesFn>;
  hasChangesRef: React.MutableRefObject<boolean>;
}) {
  const logger = useLogger('EditImagesUI');
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();

  const [loadingDelayed, setLoadingDelayed] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingDelayed(false);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const [itemImageData, setItemImageData] =
    useState<null | Array<ItemImageDatum>>(null);
  // IDs used for sorting
  const [itemImageDataIds, setItemImageDataIds] =
    useState<null | Array<string>>(null);
  const itemImageDataRef = useRef(itemImageData);
  itemImageDataRef.current = itemImageData;
  const itemImageDataIdsRef = useRef(itemImageDataIds);
  itemImageDataIdsRef.current = itemImageDataIds;
  useEffect(() => {
    if (!itemImageData) return;

    const currentIds = itemImageData
      .map(it => it.__id)
      .filter((id): id is NonNullable<typeof id> => !!id);
    if (
      !itemImageDataIds ||
      itemImageDataIds.length !== itemImageData.length ||
      currentIds.some(id => !itemImageDataIds.includes(id)) ||
      itemImageDataIds.some(id => !currentIds.includes(id))
    ) {
      setItemImageDataIds(oldIds => [
        ...(oldIds || []).filter(id => currentIds.includes(id)),
        ...(!oldIds
          ? currentIds
          : currentIds.filter(id => !oldIds.includes(id))),
      ]);
    }
  }, [itemImageData, itemImageDataIds]);

  const [loadedImageMap, setLoadedImageMap] = useState<{
    [id: string]: string;
  }>({});

  const { db } = useDB();
  const { data: loadedItemImageData, loading: itemImageLoading } = useData(
    'item_image',
    { item_id: itemId },
    { sort: [{ order: 'asc' }], disable: loadingDelayed || !itemId },
  );
  useEffect(() => {
    if (!loadedItemImageData) return;
    const validLoadedItemImageData = onlyValid(loadedItemImageData);
    LayoutAnimation.configureNext(DEFAULT_LAYOUT_ANIMATION_CONFIG);

    setItemImageData(d => [
      ...validLoadedItemImageData,
      ...(d || []).filter(dd => dd.__type !== 'item_image'),
    ]);

    let isCanceled = false;
    (async () => {
      if (!db) return;

      const getDatum = getGetDatum({ db });
      const getAttachmentFromDatum = getGetAttachmentFromDatum({ db });

      const loadedImageIds = Object.keys(loadedImageMap);
      const imageIdsToLoad = validLoadedItemImageData
        .map(ii => ii.image_id)
        .filter(id => !loadedImageIds.includes(id));

      for (const imageId of imageIdsToLoad) {
        if (isCanceled) return;
        try {
          await new Promise<void>(resolve => setTimeout(resolve, 200));
          const image = await getDatum('image', imageId);
          if (isCanceled) return;
          if (!image) continue;

          const image2048 = await getAttachmentFromDatum(image, 'image-2048');
          if (isCanceled) return;
          if (!image2048) continue;

          setLoadedImageMap(origMap => ({
            ...origMap,
            [imageId]: `data:${image2048.content_type};base64,${image2048.data}`,
          }));
        } catch (e) {
          logger.error(e);
        }
      }
    })();

    return () => {
      isCanceled = true;
    };
  }, [db, loadedImageMap, loadedItemImageData, logger]);

  const [isAddingImage, setIsAddingImage] = useState(false);
  const selectImage = useImageSelector();
  const handleAddImage = useCallback(async () => {
    try {
      const images = await selectImage({
        onUserSelectStart: () => setIsAddingImage(true),
        selectionLimit: IMAGES_LIMIT - (itemImageData?.length || 0),
      });
      if (!images) return;

      hasChangesRef.current = true;
      LayoutAnimation.configureNext(DEFAULT_LAYOUT_ANIMATION_CONFIG);
      setItemImageData(origData => [
        ...(origData || []),
        ...images.map(i => ({
          __type: 'unsaved_image_data' as const,
          __id: uuid(),
          ...i,
        })),
      ]);
    } catch (e) {
      Alert.alert(
        'An Error Occurred',
        e instanceof Error ? e.message : e?.toString(),
      );
    } finally {
      setIsAddingImage(false);
    }
  }, [hasChangesRef, itemImageData?.length, selectImage]);

  const imageUiWorking = loadingDelayed || itemImageLoading || isAddingImage;
  const imageUiWorkingRef = useRef(imageUiWorking);
  imageUiWorkingRef.current = imageUiWorking;

  const handleSaveImages = useCallback<SaveImagesFn>(
    async ({ savedItemId }) => {
      if (!db) return false;

      await new Promise<void>(resolve => {
        function check() {
          if (imageUiWorkingRef.current) {
            setTimeout(check, 100);
          } else {
            resolve();
          }
        }
        check();
      });

      try {
        const saveDatum = getSaveDatum({ db });
        const getData = getGetData({ db });
        const attachAttachmentToDatum = getAttachAttachmentToDatum({ db });

        const currentItemImageIds = (itemImageDataRef.current || [])
          .filter(d => d.__type === 'item_image')
          .map(d => d.__id);
        const oldItemImages = await getData('item_image', {
          item_id: savedItemId,
        });
        const oldItemImagesToDelete = oldItemImages.filter(
          ii => !currentItemImageIds.includes(ii.__id),
        );

        for (const oldItemImageToDelete of oldItemImagesToDelete) {
          await saveDatum(
            { ...oldItemImageToDelete, __deleted: true },
            { ignoreConflict: true },
          );
        }

        for (const itemImageDataItem of itemImageDataRef.current || []) {
          const order = itemImageDataIdsRef.current?.indexOf(
            itemImageDataItem.__id || '',
          );
          if (itemImageDataItem.__type === 'unsaved_image_data') {
            const imageToSave = {
              __id: itemImageDataItem.__id,
              __type: 'image',
              filename: itemImageDataItem.fileName,
            } as const;

            await attachAttachmentToDatum(
              imageToSave,
              'thumbnail-128',
              itemImageDataItem.thumbnail128.contentType,
              itemImageDataItem.thumbnail128.data,
            );
            await attachAttachmentToDatum(
              imageToSave,
              'thumbnail-1024',
              itemImageDataItem.thumbnail1024.contentType,
              itemImageDataItem.thumbnail1024.data,
            );
            await attachAttachmentToDatum(
              imageToSave,
              'image-2048',
              itemImageDataItem.image2048.contentType,
              itemImageDataItem.image2048.data,
            );

            const imageDatum = await saveDatum(imageToSave, {
              ignoreConflict: true,
            });

            await saveDatum(
              {
                __type: 'item_image',
                // Use a non-random ID to let the save be retry-able.
                __id: `${savedItemId}-${imageDatum.__id}`,
                item_id: savedItemId,
                image_id: imageDatum.__id,
                order,
              },
              { ignoreConflict: true },
            );
          } else if (itemImageDataItem.__type === 'item_image') {
            saveDatum(
              {
                ...itemImageDataItem,
                order,
              },
              { ignoreConflict: true },
            );
          }
        }

        return true;
      } catch (e) {
        Alert.alert(
          'Error Occurred While Saving Images',
          e instanceof Error ? e.message : 'Unknown error.',
        );
        return false;
      }
    },
    [db],
  );
  saveFnRef.current = handleSaveImages;

  const scrollPosition = useSharedValue(0);
  const handleScroll = useAnimatedScrollHandler(event => {
    scrollPosition.value = event.contentOffset.x;
  });

  const [imageViewVisible, setImageViewVisible] = useState(false);
  const [imageViewImageIndex, setImageViewImageIndex] = useState(0);
  const closeImageView = useCallback(() => {
    setImageViewVisible(false);
  }, []);

  const imageUiLoading = imageUiWorking || loading;

  const uiShowDetailedInstructions = useAppSelector(
    selectors.settings.uiShowDetailedInstructions,
  );

  return (
    <>
      <UIGroup
        loading={imageUiLoading}
        footer={
          uiShowDetailedInstructions
            ? [
                `Select at most ${IMAGES_LIMIT} images. Image resolution will be scaled down to at most 2048 pixels.`,
                (itemImageData || []).length > 1 &&
                  'Long press and drag an image to reorder.',
              ]
                .filter(n => !!n)
                .join(' ')
            : undefined
        }
      >
        {!!itemImageData && itemImageData.length > 0 && (
          <>
            <UIGroup.ListTextInputItem
              label="Images"
              inputElement={
                <View style={styles.itemImagesScrollViewContainer}>
                  <Animated.ScrollView
                    ref={scrollViewRef}
                    horizontal
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={[
                      styles.itemImagesScrollViewContentContainer,
                      {
                        width:
                          itemImageData.length * IMG_ITEM_SIZE +
                          (itemImageData.length - 1) * IMG_ITEM_GAP +
                          SCROLL_VIEW_PADDING_H * 2,
                      },
                    ]}
                    scrollIndicatorInsets={{
                      bottom: SCROLL_VIEW_OVERFLOW_V - 4,
                      left: SCROLL_VIEW_PADDING_H,
                      right: SCROLL_VIEW_PADDING_H,
                    }}
                  >
                    {itemImageData.map((imgD, i) => {
                      const order = itemImageDataIds?.indexOf(imgD.__id || '');
                      return (
                        <ItemImageItem
                          key={imgD.__id}
                          itemImageDatum={imgD}
                          order={typeof order === 'number' ? order : i}
                          scrollPosition={scrollPosition}
                          onRelativeMove={steps => {
                            const iId = imgD.__id;
                            if (!iId) return;

                            hasChangesRef.current = true;
                            setItemImageDataIds(origIds => {
                              if (!origIds) return origIds;
                              const itemIndex = origIds.indexOf(iId);

                              const newArr = origIds.filter(
                                id => id !== imgD.__id,
                              );

                              newArr.splice(itemIndex + steps, 0, iId);

                              return newArr;
                            });
                          }}
                          onRemove={() => {
                            LayoutAnimation.configureNext(
                              DEFAULT_LAYOUT_ANIMATION_CONFIG,
                            );
                            setItemImageData(
                              d => d && d.filter(it => it.__id !== imgD.__id),
                            );
                          }}
                          setLoadedImageMap={setLoadedImageMap}
                          onPress={() => {
                            setImageViewImageIndex(order || 0);
                            setImageViewVisible(true);
                          }}
                        />
                      );
                    })}
                  </Animated.ScrollView>
                </View>
              }
            />
            <UIGroup.ListItemSeparator />
          </>
        )}
        <UIGroup.ListItem
          label="Add Image..."
          button
          onPress={handleAddImage}
          disabled={
            imageUiWorking || (itemImageData || []).length >= IMAGES_LIMIT
          }
        />
      </UIGroup>
      <ImageView
        images={
          itemImageDataIds?.map(id => {
            const itemImageDatum = itemImageData?.find(d => d.__id === id);
            if (!itemImageDatum) {
              return null;
            }

            if (itemImageDatum.__type === 'unsaved_image_data') {
              return {
                uri: `data:${itemImageDatum.thumbnail1024.contentType};base64,${itemImageDatum.thumbnail1024.data}`,
              };
            }

            const imageId = itemImageDatum.image_id;

            const img = loadedImageMap[imageId];
            if (!img) return imageLoadingPlaceholder;

            return { uri: img };
          }) || []
        }
        imageIndex={imageViewImageIndex}
        visible={imageViewVisible}
        onRequestClose={closeImageView}
        keyExtractor={(_, index) => index.toString()}
      />
    </>
  );
}

function ItemImageItem({
  itemImageDatum,
  order,
  scrollPosition,
  onRelativeMove,
  onRemove,
  setLoadedImageMap,
  onPress,
}: {
  itemImageDatum: ItemImageDatum;
  order: number;
  scrollPosition: SharedValue<number>;
  onRelativeMove: (moveSteps: number) => void;
  onRemove: () => void;
  onPress: () => void;
  setLoadedImageMap?: React.Dispatch<
    React.SetStateAction<{ [id: string]: string }>
  >;
}) {
  const positionLeft = useDerivedValue(() => {
    return SCROLL_VIEW_PADDING_H + order * (IMG_ITEM_SIZE + IMG_ITEM_GAP);
  }, [order]);

  const isMoving = useSharedValue(false);
  const startPosition = useSharedValue(0);
  const moveOffset = useSharedValue(0);
  const lastMoveSteps = useSharedValue(0);
  const fixedPositionLeft = useSharedValue<number | null>(null);
  // const startPosition = useSharedValue(0);

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .maxDistance(10000)
    .shouldCancelWhenOutside(false)
    .onStart(event => {
      fixedPositionLeft.value = positionLeft.value;
      isMoving.value = true;
      runOnJS(ReactNativeHapticFeedback.trigger)('impactMedium');
    })
    .onFinalize(() => {
      isMoving.value = false;
      fixedPositionLeft.value = null;
    });

  const panGesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((event, stateManager) => {
      if (isMoving.value) {
        moveOffset.value = 0;
        stateManager.activate();
      } else {
        fixedPositionLeft.value = null;
        stateManager.fail();
      }
    })
    .onStart(e => {
      startPosition.value = e.translationX;
    })
    .onUpdate(e => {
      moveOffset.value = e.translationX - startPosition.value;
      const absOffset = Math.abs(moveOffset.value);
      const moveSteps =
        Math.floor(
          (absOffset + IMG_ITEM_SIZE / 2) / (IMG_ITEM_SIZE + IMG_ITEM_GAP),
        ) * (moveOffset.value < 0 ? -1 : 1);
      if (lastMoveSteps.value !== moveSteps) {
        const moveS = moveSteps - lastMoveSteps.value;
        runOnJS(ReactNativeHapticFeedback.trigger)('effectTick');
        runOnJS(onRelativeMove)(moveS);
        lastMoveSteps.value = moveSteps;
      }
    })
    .onEnd(() => {
      startPosition.value = 0;
      moveOffset.value = 0;
      lastMoveSteps.value = 0;
    })
    .onFinalize(() => {
      isMoving.value = false;
      fixedPositionLeft.value = null;
    });
  const gesture = Gesture.Simultaneous(longPressGesture, panGesture);

  const { backgroundColor, contentBackgroundColor, red } = useColors();

  const animatedStyle = useAnimatedStyle<
    Animated.AnimateStyle<ViewStyle>
  >(() => {
    return {
      transform: [
        {
          translateX: isMoving.value
            ? moveOffset.value
            : withSpring(isMoving.value ? moveOffset.value : 0, {
                mass: 0.1,
                stiffness: 100,
              }),
        },
        { scale: withSpring(isMoving.value ? 1.2 : 1) },
      ] as any,
      zIndex: isMoving.value
        ? 1
        : withDelay(500, withTiming(isMoving.value ? 1 : 0)),
      backgroundColor: contentBackgroundColor,
      shadowOpacity: withSpring(isMoving.value ? 0.2 : 0),
      shadowColor: 'black',
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 2 },
      position: 'absolute',
      bottom: SCROLL_VIEW_PADDING_V,
      left: withSpring(
        isMoving.value && typeof fixedPositionLeft.value === 'number'
          ? fixedPositionLeft.value
          : positionLeft.value,
        { mass: 0.1, stiffness: 100 },
      ),
      opacity: isMoving.value ? 0.8 : 1,
    };
  }, [order, contentBackgroundColor]);
  const removeButtonOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(isMoving.value ? 0 : 1),
    };
  });

  const [isGoingToRemove, setIsGoingToRemove] = useState(false);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPress={onPress}
          style={isGoingToRemove ? commonStyles.opacity04 : null}
        >
          {(() => {
            if (itemImageDatum.__type === 'unsaved_image_data') {
              return (
                <Image
                  source={{
                    uri: `data:${itemImageDatum.thumbnail1024.contentType};base64,${itemImageDatum.thumbnail1024.data}`,
                  }}
                  resizeMode="contain"
                  style={[
                    styles.itemImageImage,
                    {
                      borderColor: backgroundColor,
                      backgroundColor: contentBackgroundColor,
                    },
                  ]}
                />
              );
            }

            return (
              <ItemImageImage
                itemImage={itemImageDatum}
                setLoadedImageMap={setLoadedImageMap}
              />
            );
          })()}
        </TouchableOpacity>
        <View style={styles.removeBtnContainer}>
          <Animated.View style={removeButtonOpacityStyle}>
            <TouchableOpacity
              onPress={() => {
                setIsGoingToRemove(true);
                Alert.alert('Confirm', 'Are you sure to remove this image?', [
                  {
                    text: 'No',
                    style: 'cancel',
                    isPreferred: false,
                    onPress: () => {
                      setIsGoingToRemove(false);
                    },
                  },
                  {
                    text: 'Yes',
                    style: 'destructive',
                    isPreferred: true,
                    onPress: onRemove,
                  },
                ]);
              }}
              style={[styles.removeBtn, { backgroundColor: red }]}
            >
              {/*<Text style={{ color: 'white' }}>{order}</Text>*/}
              {/*<Text style={{ color: 'white' }}>{itemImageDatum.order}</Text>*/}
              <View style={styles.removeBtnContent} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

function ItemImageImage({
  itemImage,
  setLoadedImageMap,
}: {
  itemImage: DataTypeWithID<'item_image'>;
  setLoadedImageMap?: React.Dispatch<
    React.SetStateAction<{ [id: string]: string }>
  >;
}) {
  const logger = useLogger('EditImagesUI');
  const { db } = useDB();
  const [loading, setLoading] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const getData = useCallback(async () => {
    if (!db) return;

    setLoading(true);

    try {
      const getDatum = getGetDatum({ db });
      const getAttachmentFromDatum = getGetAttachmentFromDatum({ db });
      const image = await getDatum('image', itemImage.image_id);
      if (!image) {
        throw new Error('Cannot get image thumbnail - cannot find image');
      }
      if (!image.__valid) {
        throw new Error('Cannot get image thumbnail - image is not valid');
      }
      const thumbnail = await getAttachmentFromDatum(image, 'thumbnail-1024');
      if (!thumbnail) {
        throw new Error('Cannot get image thumbnail - missing thumbnail-1024');
      }
      setImageBase64(`data:${thumbnail.content_type};base64,${thumbnail.data}`);
    } catch (e: any) {
      logger.error(e, {
        details: JSON.stringify({ image_id: itemImage.image_id }, null, 2),
      });
    } finally {
      setLoading(false);
    }
  }, [db, itemImage.image_id, logger]);
  useEffect(() => {
    getData();
  }, [getData]);

  const { backgroundColor, contentBackgroundColor, contentSecondaryTextColor } =
    useColors();

  if (!imageBase64) {
    return (
      <View
        style={[
          styles.itemImageImage,
          {
            borderColor: backgroundColor,
            backgroundColor: contentBackgroundColor,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text
            style={[
              { color: contentSecondaryTextColor },
              commonStyles.tac,
              commonStyles.fs12,
              commonStyles.mh4,
              commonStyles.mv4,
            ]}
          >
            Cannot load image
          </Text>
        )}
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageBase64 }}
      resizeMode="contain"
      style={[
        styles.itemImageImage,
        {
          borderColor: backgroundColor,
          backgroundColor: contentBackgroundColor,
        },
      ]}
    />
  );
}

const SCROLL_VIEW_OVERFLOW_H = 16;
const SCROLL_VIEW_OVERFLOW_V = 32;
const SCROLL_VIEW_PADDING_H = SCROLL_VIEW_OVERFLOW_H;
const SCROLL_VIEW_PADDING_V = 6 + SCROLL_VIEW_OVERFLOW_V;
const IMG_ITEM_SIZE = 80;
const IMG_ITEM_GAP = 8;

const styles = StyleSheet.create({
  itemImagesScrollViewContainer: {
    flex: 1,
    marginVertical: -SCROLL_VIEW_OVERFLOW_V,
    marginHorizontal: -SCROLL_VIEW_OVERFLOW_H,
  },
  itemImagesScrollViewContentContainer: {
    paddingHorizontal: SCROLL_VIEW_PADDING_H,
    paddingVertical: SCROLL_VIEW_PADDING_V,
    height: IMG_ITEM_SIZE + SCROLL_VIEW_PADDING_V * 2,
    flexDirection: 'row',
    gap: IMG_ITEM_GAP,
  },
  itemImageImage: {
    width: IMG_ITEM_SIZE,
    height: IMG_ITEM_SIZE,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnContent: {
    backgroundColor: 'white',
    width: 14,
    height: 2,
  },
});

export default EditImagesUI;
