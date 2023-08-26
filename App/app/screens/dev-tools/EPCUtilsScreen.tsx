import React, { useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { configSchema } from '@app/data/schema';

import EPCUtils from '@app/modules/EPCUtils';

import type { StackParamList } from '@app/navigation/MainStack';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

const companyPrefixSchema = configSchema.shape.rfid_tag_company_prefix;
const tagPrefixSchema = configSchema.shape.rfid_tag_prefix;

function EPCUtilsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'EPCUtils'>) {
  const scrollViewRef = useRef<ScrollView>(null);

  const [companyPrefix, setCompanyPrefix] = useState('0000000');
  const [tagPrefix, setTagPrefix] = useState('100');
  const [collectionRefNumber, setCollectionRefNumber] = useState('0000');
  const [itemRefNumber, setItemRefNumber] = useState('123456');
  const [serial, setSerial] = useState(0);

  const companyPrefixParseResult = companyPrefixSchema.safeParse(companyPrefix);
  const tagPrefixParseResult = tagPrefixSchema.safeParse(tagPrefix);

  const prefixesErrorMessage = (() => {
    if (!companyPrefixParseResult.success) {
      return '⚠ Company Prefix is invalid.';
    }

    if (!tagPrefixParseResult.success) {
      return '⚠ Tag Prefix is invalid.';
    }

    return undefined;
  })();

  const companyPrefixDigits = companyPrefix.length;
  const tagPrefixDigits = tagPrefix.length;
  const collectionReferenceDigits = EPCUtils.getCollectionReferenceDigits({
    tagPrefixDigits,
    companyPrefixDigits,
  });
  const itemReferenceDigits = EPCUtils.getItemReferenceDigits({
    tagPrefixDigits,
    companyPrefixDigits,
  });
  const epcFilterLength = EPCUtils.getEpcFilterLength({
    tagPrefix,
    companyPrefix,
  });

  const prefixesFooterMessage = (() => {
    if (prefixesErrorMessage) {
      return prefixesErrorMessage;
    }

    return `Collection Reference digits: ${collectionReferenceDigits}.\nItem Reference digits: ${itemReferenceDigits}.\nEPC filter length: ${epcFilterLength}.`;
  })();

  let individualAssetReference = '';
  try {
    individualAssetReference = EPCUtils.encodeIndividualAssetReference({
      tagPrefix,
      collectionReference: collectionRefNumber,
      itemReference: itemRefNumber,
      serial,
      companyPrefix,
    });
  } catch (error) {
    if (error instanceof Error) {
      individualAssetReference = `Error: ${error.message}`;
    } else {
      individualAssetReference = 'Unknown error.';
    }
  }

  let giai = '';
  try {
    giai = EPCUtils.encodeGiaiFromIndividualAssetReference({
      companyPrefix: companyPrefix,
      individualAssetReference,
    });
  } catch (error) {
    if (error instanceof Error) {
      giai = `Error: ${error.message}`;
    } else {
      giai = 'Unknown error.';
    }
  }

  let epcHex = '';
  try {
    epcHex = EPCUtils.encodeEpcHexFromGiai(giai);
  } catch (error) {
    if (error instanceof Error) {
      epcHex = `Error: ${error.message}`;
    } else {
      epcHex = 'Unknown error.';
    }
  }

  let epcFilter = '';
  try {
    epcFilter = EPCUtils.getEpcFilter({ tagPrefix, companyPrefix });
  } catch (error) {
    if (error instanceof Error) {
      epcFilter = `Error: ${error.message}`;
    } else {
      epcFilter = 'Unknown error.';
    }
  }

  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  return (
    <ScreenContent navigation={navigation} title="EPC Utils">
      <ScreenContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        <UIGroup footer={prefixesFooterMessage}>
          <UIGroup.ListTextInputItem
            label="Company Prefix"
            horizontalLabel
            monospaced
            keyboardType="number-pad"
            placeholder="0000000"
            value={companyPrefix}
            onChangeText={setCompanyPrefix}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Tag Prefix"
            horizontalLabel
            monospaced
            keyboardType="number-pad"
            placeholder="000"
            value={tagPrefix}
            onChangeText={setTagPrefix}
            {...kiaTextInputProps}
          />
        </UIGroup>

        <UIGroup>
          <UIGroup.ListTextInputItem
            label="Collection Ref."
            horizontalLabel
            monospaced
            keyboardType="number-pad"
            placeholder={'0'.repeat(collectionReferenceDigits)}
            value={collectionRefNumber}
            onChangeText={setCollectionRefNumber}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Item Ref."
            horizontalLabel
            monospaced
            keyboardType="number-pad"
            placeholder={'0'.repeat(itemReferenceDigits)}
            value={itemRefNumber}
            onChangeText={setItemRefNumber}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Serial"
            horizontalLabel
            monospaced
            keyboardType="number-pad"
            placeholder={'0'.repeat(4)}
            value={serial.toString()}
            onChangeText={t => {
              const n = parseInt(t, 10);
              if (!Number.isNaN(n)) {
                setSerial(n);
              }
            }}
            {...kiaTextInputProps}
          />
        </UIGroup>

        <UIGroup
          header="Calculated Results"
          footer={(() => {
            if (!epcHex.startsWith(epcFilter)) {
              return '⚠ EPC does not starts with EPC filter.';
            }

            return undefined;
          })()}
        >
          <UIGroup.ListItem
            verticalArrangedLargeTextIOS
            label="Individual Asset Reference"
            monospaceDetail
            detail={individualAssetReference}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            verticalArrangedLargeTextIOS
            label="EPC Tag URI"
            monospaceDetail
            detail={giai}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            verticalArrangedLargeTextIOS
            label="RFID Tag EPC Memory Bank Contents (hex)"
            monospaceDetail
            detail={epcHex}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            verticalArrangedLargeTextIOS
            label="EPC Filter"
            monospaceDetail
            detail={epcFilter}
          />
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default EPCUtilsScreen;
