import React, { useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import EPCUtils from '@deps/epc-utils';

import { configSchema } from '@app/data/schema';

import type { StackParamList } from '@app/navigation/MainStack';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

const companyPrefixSchema = configSchema.shape.rfid_tag_company_prefix;
const iarPrefixSchema =
  configSchema.shape.rfid_tag_individual_asset_reference_prefix;

function EPCUtilsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'EPCUtils'>) {
  const scrollViewRef = useRef<ScrollView>(null);

  const [companyPrefix, setCompanyPrefix] = useState('0000000');
  const [iarPrefix, setIarPrefix] = useState('100');
  const [collectionRefNumber, setCollectionRefNumber] = useState('0000');
  const [itemRefNumber, setItemRefNumber] = useState('123456');
  const [serial, setSerial] = useState(0);

  const companyPrefixParseResult = companyPrefixSchema.safeParse(companyPrefix);
  const iarPrefixParseResult = iarPrefixSchema.safeParse(iarPrefix);

  const prefixesErrorMessage = (() => {
    if (!companyPrefixParseResult.success) {
      return '⚠ Company Prefix is invalid.';
    }

    if (!iarPrefixParseResult.success) {
      return '⚠ IAR Prefix is invalid.';
    }

    return undefined;
  })();

  const collectionReferenceDigits = EPCUtils.getCollectionReferenceDigits({
    iarPrefix,
    companyPrefix,
  });
  const itemReferenceDigits = EPCUtils.getItemReferenceDigits({
    iarPrefix,
    companyPrefix,
  });
  const epcFilterLength = EPCUtils.getEpcFilterLength({
    iarPrefix,
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
      iarPrefix,
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
      companyPrefix,
      iarPrefix,
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
    epcFilter = EPCUtils.getEpcFilter({ iarPrefix, companyPrefix });
  } catch (error) {
    if (error instanceof Error) {
      epcFilter = `Error: ${error.message}`;
    } else {
      epcFilter = 'Unknown error.';
    }
  }

  const [toGiaiHex, setToGiaiHex] = useState('341400000000000000000000');
  const [toHexGiai, setToHexGiai] = useState('urn:epc:tag:giai-96:0.0000000.0');

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
            label="IAR Prefix"
            horizontalLabel
            monospaced
            keyboardType="number-pad"
            placeholder="000"
            unit={`(max: ${EPCUtils.getMaxIarPrefix({ companyPrefix })})`}
            value={iarPrefix}
            onChangeText={setIarPrefix}
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

        <UIGroup header="GIAI URI / Hex Conversion" largeTitle>
          <UIGroup.ListTextInputItem
            label="GIAI URI"
            monospaced
            keyboardType="url"
            placeholder="urn:epc:tag:giai-96:0.0000000.0"
            multiline
            value={toHexGiai}
            onChangeText={t => {
              if (t.startsWith('Error: ')) return;

              setToHexGiai(t);
              try {
                setToGiaiHex(EPCUtils.encodeEpcHexFromGiai(t));
              } catch (e) {
                setToGiaiHex(
                  `Error: ${e instanceof Error ? e.message : 'unknown error'}`,
                );
              }
            }}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="EPC Hex"
            monospaced
            keyboardType="url"
            placeholder="341400000000000000000000"
            multiline
            value={toGiaiHex}
            onChangeText={t => {
              if (t.startsWith('Error: ')) return;

              const v = t.toUpperCase();
              setToGiaiHex(v);
              try {
                setToHexGiai(EPCUtils.getGiaiUriFromEpcHex(v));
              } catch (e) {
                setToHexGiai(
                  `Error: ${e instanceof Error ? e.message : 'unknown error'}`,
                );
              }
            }}
            {...kiaTextInputProps}
          />
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default EPCUtilsScreen;
