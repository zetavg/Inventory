import React, { memo, useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SFSymbol } from 'react-native-sfsymbols';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { v4 as uuidv4 } from 'uuid';

import {
  DEFAULT_COLLECTION_ICON_NAME,
  getDefaultItemIconName,
} from '@app/consts/default-icons';
import {
  verifyIconColorWithDefault,
  verifyIconNameWithDefault,
} from '@app/consts/icons';

import { DataTypeWithID, useData, useDataCount, useRelated } from '@app/data';
import { getGetAttachmentFromDatum } from '@app/data/functions';

import { useDB } from '@app/db';

import useColors from '@app/hooks/useColors';

import Icon from '@app/components/Icon';
import UIGroup from '@app/components/UIGroup';

import LPJQ from '@app/LPJQ';

import StockStatusIcon from './StockStatusIcon';

function ItemListItem({
  item,
  priority,
  onPress,
  onLongPress,
  hideDetails,
  reloadCounter,
  additionalDetails,
  hideCollectionDetails,
  hideContainerDetails,
  hideContentDetails,
  checkStatus,
  grayOut,
  ...props
}: {
  item: DataTypeWithID<'item'>;
  priority?: number;
  onPress: () => void;
  onLongPress?: () => void;
  hideDetails?: boolean;
  /** Can be used to reload the data in this component. Set this to a different value that isn't 0 to trigger an reload. */
  reloadCounter?: number;
  hideCollectionDetails?: boolean;
  hideContainerDetails?: boolean;
  hideContentDetails?: boolean;
  additionalDetails?: React.ComponentProps<typeof UIGroup.ListItem>['detail'];
  checkStatus?:
    | 'checked'
    | 'unchecked'
    | 'partially-checked'
    | 'manually-checked'
    | 'no-rfid-tag';
  grayOut?: boolean;
} & React.ComponentProps<typeof UIGroup.ListItem>) {
  const { data: itemImages, reload: reloadItemImages } = useData(
    'item_image',
    { item_id: item.__id, order: 0 },
    { limit: 1, disable: !item.use_first_image_as_icon },
  );
  const imageId = itemImages && itemImages[0]?.image_id;
  const { data: image } = useData(
    'image',
    typeof imageId === 'string' ? imageId : '',
    {
      disable: !imageId || typeof imageId !== 'string',
    },
  );
  const [thumbnail, setThumbnail] = useState<null | {
    content_type: string;
    data: string | Blob | Buffer;
  }>(null);
  const { db } = useDB();
  const loadThumbnail = useCallback(async () => {
    if (!db) return;
    if (!image?.__valid) return;

    const getAttachmentFromDatum = getGetAttachmentFromDatum({ db });

    const t = await getAttachmentFromDatum(image, 'thumbnail-128');
    setThumbnail(t);
  }, [db, image]);
  useEffect(() => {
    if (typeof priority === 'number' && priority < 12) {
      loadThumbnail();
      return;
    }
    return LPJQ.push(async () => {
      await loadThumbnail();
    });
  }, [loadThumbnail, priority]);

  const { count: itemsCount, reload: reloadItemsCount } = useDataCount(
    'item',
    {
      container_id: item.__id,
    },
    {
      disable: !item._can_contain_items || hideContentDetails,
    },
  );

  const { data: collection, refresh: refreshCollection } = useRelated(
    item,
    'collection',
    {
      lowPriority: true,
      disable: hideCollectionDetails,
    },
  );
  const validatedCollection = collection?.__valid ? collection : null;

  const { data: container, refresh: refreshContainer } = useRelated(
    item,
    'container',
    {
      lowPriority: true,
      disable: hideContainerDetails,
    },
  );
  const validatedContainer = container?.__valid ? container : null;

  useEffect(() => {
    reloadCounter;
    if (hideDetails) return;
    if (!reloadCounter) return;

    return LPJQ.push(async () => {
      await reloadItemImages();
      await reloadItemsCount();
      await refreshCollection();
      await refreshContainer();
    });
  }, [
    hideDetails,
    reloadItemsCount,
    reloadCounter,
    refreshCollection,
    refreshContainer,
    reloadItemImages,
  ]);

  const iconName = verifyIconNameWithDefault(
    item.icon_name || getDefaultItemIconName(item),
  );

  const stockQuantity =
    typeof item.consumable_stock_quantity === 'number'
      ? item.consumable_stock_quantity
      : 1;

  const { iconBackgroundColor } = useColors();

  const iconElem = useCallback(
    (iconProps: Partial<React.ComponentProps<typeof Icon>>) => {
      if (item.use_first_image_as_icon && thumbnail) {
        return (
          <Animated.Image
            entering={FadeIn.duration(200)}
            style={[
              styles.listItemImage,
              {
                width: iconProps.size,
                height: iconProps.size,
                borderColor: iconBackgroundColor,
                backgroundColor: iconBackgroundColor,
              },
            ]}
            source={{
              uri: `data:${thumbnail.content_type};base64,${thumbnail.data}`,
            }}
            resizeMode="contain"
          />
        );
      }

      return (
        <Animated.View exiting={FadeOut.duration(200)}>
          <Icon {...iconProps} name={iconName} />
        </Animated.View>
      );
    },
    [iconBackgroundColor, iconName, item.use_first_image_as_icon, thumbnail],
  );

  return (
    <UIGroup.ListItem
      key={item.__id}
      verticalArrangedNormalLabelIOS={!hideDetails}
      label={item.name}
      labelTextStyle={[grayOut && styles.itemItemLabelTextGrayOut]}
      detailTextStyle={[grayOut && styles.itemItemDetailTextGrayOut]}
      icon={
        checkStatus
          ? // eslint-disable-next-line react/no-unstable-nested-components
            ({ iconProps }) => (
              <View>
                {iconElem(iconProps)}
                <CheckStatusIcon status={checkStatus} />
              </View>
            )
          : item.item_type === 'consumable'
          ? // eslint-disable-next-line react/no-unstable-nested-components
            ({ iconProps }) => {
              return (
                <View>
                  {iconElem(iconProps)}
                  <StockStatusIcon item={item} />
                </View>
              );
            }
          : ({ iconProps }) => iconElem(iconProps)
      }
      iconColor={verifyIconColorWithDefault(item.icon_color)}
      onPress={onPress}
      onLongPress={onLongPress}
      navigable={!!onPress}
      detail={
        hideDetails
          ? undefined
          : // eslint-disable-next-line react/no-unstable-nested-components
            ({ textProps, iconProps }) => {
              const detailElements = [
                !!additionalDetails && (
                  <React.Fragment key="additionalDetails">
                    {typeof additionalDetails === 'function'
                      ? additionalDetails({ textProps, iconProps })
                      : additionalDetails}
                  </React.Fragment>
                ),
                item.item_type === 'consumable' && (
                  <React.Fragment key="containerInfo">
                    {stockQuantity <= 0
                      ? 'Stock empty'
                      : `Stock: ${stockQuantity}`}
                  </React.Fragment>
                ),
                !hideContentDetails &&
                  itemsCount !== null &&
                  // eslint-disable-next-line react/no-unstable-nested-components
                  (() => {
                    switch (item.item_type) {
                      case 'item_with_parts':
                        return (
                          <React.Fragment key="containerInfo">
                            {itemsCount === 1
                              ? `+${itemsCount} part`
                              : `+${itemsCount} parts`}
                          </React.Fragment>
                        );

                      case 'container':
                        return (
                          <React.Fragment key="containerInfo">
                            {itemsCount === 1
                              ? `${itemsCount} item`
                              : `${itemsCount} items`}
                          </React.Fragment>
                        );

                      default:
                        return null;
                    }
                  })(),
                !hideCollectionDetails && !!validatedCollection && (
                  <React.Fragment key="collection">
                    <Icon
                      // Do not let this icon to be animated with LayoutAnimation.
                      // key={uuidv4()}
                      name={verifyIconNameWithDefault(
                        validatedCollection.icon_name ||
                          DEFAULT_COLLECTION_ICON_NAME,
                      )}
                      {...iconProps}
                    />{' '}
                    {validatedCollection.name}
                  </React.Fragment>
                ),
                !hideContainerDetails && !!validatedContainer && (
                  <React.Fragment key="container">
                    <Icon
                      // Do not let this icon to be animated with LayoutAnimation.
                      // key={uuidv4()}
                      name={verifyIconNameWithDefault(
                        validatedContainer.icon_name ||
                          getDefaultItemIconName(item),
                      )}
                      {...iconProps}
                    />{' '}
                    {validatedContainer.name}
                  </React.Fragment>
                ),
                item.individual_asset_reference && (
                  <React.Fragment key="itemReference">
                    {item.rfid_tag_epc_memory_bank_contents &&
                      item.rfid_tag_epc_memory_bank_contents !==
                        item.actual_rfid_tag_epc_memory_bank_contents && (
                        <>
                          {item.actual_rfid_tag_epc_memory_bank_contents ? (
                            <Icon
                              name="app-info"
                              // Do not let this icon to be animated with LayoutAnimation.
                              key={uuidv4()}
                              {...iconProps}
                            />
                          ) : (
                            <Icon
                              name="app-exclamation"
                              // Do not let this icon to be animated with LayoutAnimation.
                              key={uuidv4()}
                              {...iconProps}
                            />
                          )}{' '}
                        </>
                      )}
                    {item.individual_asset_reference}
                  </React.Fragment>
                ),
              ].filter(n => n);
              return (
                <Text {...textProps} numberOfLines={1}>
                  {(detailElements.length
                    ? detailElements
                    : [
                        <Text key="N" {...textProps}>
                          {' '}
                          -{' '}
                        </Text>,
                      ]
                  )
                    .flatMap((node, i) => [
                      node,
                      <Text key={`s-${i}`} {...textProps}>
                        {' '}
                        |{' '}
                      </Text>,
                    ])
                    .slice(0, -1)}
                </Text>
              );
            }
        // hideDetails
        //   ? undefined
        //   : [
        //       'This is an item',
        //       // item.item_reference_number,
        //       // itemsCount !== null && itemsCount === 1
        //       //   ? `${itemsCount} item`
        //       //   : `${itemsCount} items`,
        //     ]
        //       .filter(s => s)
        //       .join(' | ')
      }
      {...props}
    />
  );
}

function CheckStatusIcon({
  status,
}: {
  status:
    | 'checked'
    | 'unchecked'
    | 'partially-checked'
    | 'manually-checked'
    | 'no-rfid-tag';
}) {
  const { green, gray, yellow } = useColors();

  if (Platform.OS === 'ios') {
    switch (status) {
      case 'checked':
      case 'manually-checked':
        return (
          <View style={styles.checkStatusIconContainer}>
            <SFSymbol
              name="checkmark.circle.fill"
              color={status === 'checked' ? green : gray}
              size={16}
              weight="regular"
            />
          </View>
        );
      case 'partially-checked':
        return (
          <View style={styles.checkStatusIconContainer}>
            <SFSymbol
              name="ellipsis.circle.fill"
              color={yellow}
              size={16}
              weight="regular"
            />
          </View>
        );

      case 'unchecked':
        return (
          <View style={styles.checkStatusIconContainer}>
            {/*<SFSymbol
              style={styles.checkStatusIconIosLayer1}
              name="questionmark.app.dashed"
              color={contentBackgroundColor}
              size={16}
              weight="heavy"
            />*/}
            <SFSymbol
              // style={styles.checkStatusIconIosLayer2}
              name="questionmark.app.dashed"
              color={gray}
              size={16}
              weight="regular"
            />
          </View>
        );

      case 'no-rfid-tag':
        return (
          <View style={styles.checkStatusIconContainer}>
            {/*<SFSymbol
              style={styles.checkStatusIconIosLayer2}
              name="antenna.radiowaves.left.and.right.slash"
              color={contentBackgroundColor}
              size={16}
              weight="heavy"
            />*/}
            <SFSymbol
              // style={styles.checkStatusIconIosLayer2}
              name="antenna.radiowaves.left.and.right.slash"
              color={gray}
              size={16}
              weight="regular"
            />
          </View>
        );
    }
  }

  switch (status) {
    case 'checked':
    case 'manually-checked':
      return (
        <View style={styles.checkStatusIconContainer}>
          <MaterialCommunityIcon
            name="check-circle"
            color={status === 'checked' ? green : gray}
            size={16}
          />
        </View>
      );
    case 'partially-checked':
      return (
        <View style={styles.checkStatusIconContainer}>
          <MaterialCommunityIcon
            name="dots-horizontal-circle"
            color={yellow}
            size={16}
          />
        </View>
      );

    case 'unchecked':
      return (
        <View style={styles.checkStatusIconContainer}>
          <MaterialCommunityIcon
            name="progress-question"
            color={gray}
            size={16}
          />
        </View>
      );

    case 'no-rfid-tag':
      return (
        <View style={styles.checkStatusIconContainer}>
          <MaterialCommunityIcon
            name="access-point-off"
            color={gray}
            size={16}
          />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  itemItemIcon: { marginRight: -2 },
  itemItemIconUnchecked: {
    opacity: 0.3,
  },
  itemItemLabelText: { fontSize: 16 },
  itemItemDetailText: { fontSize: 12 },
  itemItemLabelTextGrayOut: {
    opacity: 0.5,
  },
  itemItemDetailTextGrayOut: {
    opacity: 0.5,
  },
  itemDetailCollectionIcon: {
    opacity: 0.7,
    marginBottom: -1.5,
  },
  checkStatusIconContainer:
    Platform.OS === 'ios'
      ? {
          position: 'absolute',
          right: 2,
          bottom: 5,
        }
      : {
          position: 'absolute',
          right: -4,
          bottom: -3,
        },
  checkStatusIconIosLayer1: {
    position: 'absolute',
  },
  checkStatusIconIosLayer2: {
    position: 'absolute',
  },
  listItemImage: {
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: -1,
  },
});

export default memo(ItemListItem);
