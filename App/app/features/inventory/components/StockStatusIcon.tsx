import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { DataTypeWithAdditionalInfo } from '@app/data';
import { InvalidDataTypeWithAdditionalInfo } from '@app/data/types';

import useColors from '@app/hooks/useColors';

export default function StockStatusIcon({
  item,
  sizeMultiplier = 1,
  moreMargin = false,
}: {
  item:
    | DataTypeWithAdditionalInfo<'item'>
    | InvalidDataTypeWithAdditionalInfo<'item'>;
  sizeMultiplier?: number;
  moreMargin?: boolean;
}): JSX.Element | null {
  const { gray, orange } = useColors();

  const stockQuantity =
    typeof item.consumable_stock_quantity === 'number'
      ? item.consumable_stock_quantity
      : 1;

  const status = (() => {
    if (stockQuantity <= 0) {
      if (item.consumable_will_not_restock) {
        return 'empty-will-not-restock';
      }

      return 'empty';
    }
    return null;
  })();

  if (Platform.OS === 'ios') {
    switch (status) {
      case 'empty':
        return (
          <View
            style={
              moreMargin
                ? styles.stockStatusIconContainer_moreMargin
                : styles.stockStatusIconContainer
            }
          >
            <SFSymbol
              name="circle.slash"
              color={orange}
              size={14 * sizeMultiplier}
              weight="bold"
            />
          </View>
        );

      case 'empty-will-not-restock':
        return (
          <View
            style={
              moreMargin
                ? styles.stockStatusIconContainer_moreMargin
                : styles.stockStatusIconContainer
            }
          >
            <SFSymbol
              name="circle.slash"
              color={gray}
              size={14 * sizeMultiplier}
              weight="bold"
            />
          </View>
        );

      case null:
        return (
          <View
            style={
              moreMargin
                ? styles.stockStatusIconContainer_moreMargin
                : styles.stockStatusIconContainer
            }
          >
            <SFSymbol
              name="square.stack.3d.down.forward.fill"
              color={gray}
              size={14 * sizeMultiplier}
              weight="bold"
              style={styles.normalIcon}
            />
          </View>
        );
    }
  }

  switch (status) {
    case 'empty':
      return (
        <View
          style={
            moreMargin
              ? styles.stockStatusIconContainer_moreMargin
              : styles.stockStatusIconContainer
          }
        >
          <MaterialCommunityIcon
            name="slash-forward-box"
            color={orange}
            size={16 * sizeMultiplier}
          />
        </View>
      );

    case 'empty-will-not-restock':
      return (
        <View
          style={
            moreMargin
              ? styles.stockStatusIconContainer_moreMargin
              : styles.stockStatusIconContainer
          }
        >
          <MaterialCommunityIcon
            name="slash-forward-box"
            color={gray}
            size={16 * sizeMultiplier}
          />
        </View>
      );

    case null:
      return (
        <View
          style={
            moreMargin
              ? styles.stockStatusIconContainer_moreMargin
              : styles.stockStatusIconContainer
          }
        >
          <MaterialCommunityIcon
            name={
              stockQuantity <= 9
                ? `numeric-${stockQuantity}-box-multiple`
                : 'numeric-9-plus-box-multiple'
            }
            color={gray}
            size={16 * sizeMultiplier}
            style={styles.normalIcon}
          />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  normalIcon: {
    opacity: 0.7,
  },
  stockStatusIconContainer:
    Platform.OS === 'ios'
      ? {
          position: 'absolute',
          right: 2,
          bottom: 5,
        }
      : {
          position: 'absolute',
          right: -6,
          bottom: -4,
        },
  stockStatusIconContainer_moreMargin:
    Platform.OS === 'ios'
      ? {
          position: 'absolute',
          right: 4,
          bottom: 7,
        }
      : {
          position: 'absolute',
          right: -6,
          bottom: -4,
        },
});
