import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';

import useColors from '@app/hooks/useColors';
import commonStyles from '@app/utils/commonStyles';
import InsetGroup from '@app/components/InsetGroup';
import Icon, { IconName } from '@app/components/Icon';

import useDB from '@app/hooks/useDB';
import { DataType } from '@app/db/old_schema';
import { DataTypeWithID } from '@app/db/old_relationalUtils';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SFSymbol } from 'react-native-sfsymbols';

export default function ItemItem({
  item,
  onPress,
  onLongPress,
  additionalDetails,
  hideDetails,
  hideCollectionDetails,
  hideDedicatedContainerDetails,
  reloadCounter,
  checkStatus,
  grayOut,
  ...props
}: {
  item: DataTypeWithID<'item'>;
  onPress?: () => void;
  additionalDetails?: string | number | JSX.Element;
  hideDetails?: boolean;
  hideCollectionDetails?: boolean;
  hideDedicatedContainerDetails?: boolean;
  reloadCounter?: number;
  checkStatus?:
    | 'checked'
    | 'unchecked'
    | 'partially-checked'
    | 'manually-checked'
    | 'no-rfid-tag';
  grayOut?: boolean;
} & React.ComponentProps<typeof InsetGroup.Item>) {
  const { contentSecondaryTextColor } = useColors();
  const { db } = useDB();

  const [collectionData, setCollectionData] =
    useState<DataType<'collection'> | null>(null);
  const loadCollectionData = useCallback(async () => {
    if (!item.collection) return;

    const results: any = await db.get(`collection-2-${item.collection}`);
    item._collectionData = results.data;
    setCollectionData(results.data);
  }, [db, item]);

  const [dedicatedItemsCount, setDedicatedItemsCount] = useState<number | null>(
    null,
  );
  const loadDedicatedItemsCount = useCallback(async () => {
    if (!item.isContainer) {
      setDedicatedItemsCount(null);
      return;
    }

    const results = await db.query(
      'relational_data_index/item_by_dedicatedContainer',
      {
        startkey: item.id,
        endkey: item.id,
        include_docs: false,
      },
    );
    setDedicatedItemsCount(results.rows.length);
  }, [item.isContainer, item.id, db]);

  const [dedicatedContainerData, setDedicatedContainerData] =
    useState<DataType<'collection'> | null>(null);
  const loadDedicatedContainerData = useCallback(async () => {
    if (!item.dedicatedContainer) {
      item._dedicatedContainerData = null;
      setDedicatedContainerData(null);
      return;
    }
    const results: any = await db.get(`item-2-${item.dedicatedContainer}`);
    item._dedicatedContainerData = results.data;
    setDedicatedContainerData(results.data);
  }, [db, item]);

  useEffect(() => {
    reloadCounter;

    if (hideDetails) return;

    if (!hideCollectionDetails) loadCollectionData();
    if (!hideDedicatedContainerDetails) loadDedicatedContainerData();
    loadDedicatedItemsCount();
  }, [
    hideCollectionDetails,
    hideDedicatedContainerDetails,
    hideDetails,
    loadCollectionData,
    loadDedicatedContainerData,
    loadDedicatedItemsCount,
    reloadCounter,
  ]);

  const detailElements = useMemo(() => {
    return hideDetails
      ? undefined
      : [
          additionalDetails,
          dedicatedItemsCount !== null &&
            (() => {
              switch (item.isContainerType) {
                case 'generic-container':
                  return dedicatedItemsCount ? (
                    <Text key="containerInfo">{`+${dedicatedItemsCount} parts`}</Text>
                  ) : undefined;
                case 'item-with-parts':
                  return (
                    <Text key="containerInfo">{`+${dedicatedItemsCount} parts`}</Text>
                  );

                default:
                  return (
                    <Text key="containerInfo">{`${dedicatedItemsCount} items`}</Text>
                  );
              }
            })(),
          !hideCollectionDetails && collectionData && (
            <Text key="collectionData">
              <Icon
                name={collectionData.iconName as IconName}
                color={contentSecondaryTextColor}
                size={11}
                style={styles.itemDetailCollectionIcon}
              />{' '}
              {collectionData.name}
            </Text>
          ),
          !hideDedicatedContainerDetails && dedicatedContainerData && (
            <Text key="dedicatedContainerData">
              <Icon
                name={dedicatedContainerData.iconName as IconName}
                color={contentSecondaryTextColor}
                size={11}
                style={styles.itemDetailCollectionIcon}
              />{' '}
              {dedicatedContainerData.name}
            </Text>
          ),
          item.individualAssetReference && (
            <React.Fragment key="individualAssetReference">
              {item.computedRfidTagEpcMemoryBankContents &&
                item.computedRfidTagEpcMemoryBankContents !==
                  item.actualRfidTagEpcMemoryBankContents && (
                  <>
                    <Icon name="app-exclamation" size={11} />{' '}
                  </>
                )}
              {item.individualAssetReference}
            </React.Fragment>
          ),
          // itemsCount !== null && `${itemsCount} items`,
        ]
          .filter(s => s)
          .flatMap(element => [element, ' | '])
          .slice(0, -1);
  }, [
    additionalDetails,
    collectionData,
    contentSecondaryTextColor,
    dedicatedContainerData,
    dedicatedItemsCount,
    hideCollectionDetails,
    hideDedicatedContainerDetails,
    hideDetails,
    item.actualRfidTagEpcMemoryBankContents,
    item.computedRfidTagEpcMemoryBankContents,
    item.individualAssetReference,
    item.isContainerType,
  ]);

  return (
    <InsetGroup.Item
      key={item.id}
      arrow
      vertical={!hideDetails}
      label={item.name || '(null)'}
      leftElement={
        <View>
          <Icon
            name={item.iconName as IconName}
            color={item.iconColor}
            style={[
              styles.itemItemIcon,
              checkStatus === 'unchecked' && styles.itemItemIconUnchecked,
            ]}
            // size={20}
            size={30}
            showBackground
            backgroundPadding={4}
          />
          {!!checkStatus && <CheckStatusIcon status={checkStatus} />}
        </View>
      }
      labelTextStyle={[
        styles.itemItemLabelText,
        grayOut && styles.itemItemLabelTextGrayOut,
      ]}
      detailTextStyle={[
        styles.itemItemDetailText,
        grayOut && styles.itemItemDetailTextGrayOut,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      detailAsText
      detail={
        hideDetails
          ? undefined
          : (detailElements?.length || 0) > 0
          ? detailElements
          : '-'
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
  const { contentBackgroundColor, green, gray, yellow } = useColors();

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
});
