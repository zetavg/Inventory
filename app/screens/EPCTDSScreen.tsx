import React, { useState } from 'react';
import { ScrollView, Text, Switch } from 'react-native';
import epcTds from 'epc-tds';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';
import commonStyles from '@app/utils/commonStyles';
import useNumberInputChangeHandler from '@app/hooks/useNumberInputChangeHandler';
import EPCUtils from '@app/modules/EPCUtils';

const EXAMPLE_HEX = '3074257bf7194e4000001a85';
const EXAMPLE_EPC = 'urn:epc:tag:giai-96:0.0000000.1';

function EPCTDSScreen({
  navigation,
}: StackScreenProps<StackParamList, 'EPCTDS'>) {
  const [hexToDecode, setHexToDecode] = useState(EXAMPLE_HEX);
  let decoded: any = null;

  try {
    decoded = epcTds.valueOf(hexToDecode);
  } catch (e) {
    decoded = { error: e };
  }

  const [epcToEncode, setEpcToEncode] = useState(EXAMPLE_EPC);
  let encoded: any = null;

  try {
    encoded = epcTds.fromTagURI(epcToEncode);
  } catch (e) {
    encoded = { error: e };
  }

  const [encodeIARPrefix, setEncodeIARPrefix] = useState<number | null>(32);
  const handleEncodeIARPrefixChange =
    useNumberInputChangeHandler(setEncodeIARPrefix);
  const [encodeIARCollectionRef, setEncodeIARCollectionRef] = useState('0010');
  const [encodeIARItemRef, setEncodeIARItemRef] = useState('1234');
  const [encodeIARSerial, setEncodeIARSerial] = useState<number | null>(0);
  const handleEncodeIARSerialChange =
    useNumberInputChangeHandler(setEncodeIARSerial);
  const [encodeIARJoinBy, setEncodeIARJoinBy] = useState('.');
  const [encodeIARIncludePrefix, setEncodeIARIncludePrefix] = useState(true);
  const [encodeIARCompanyPrefix, setEncodeIARCompanyPrefix] =
    useState('0000000');
  let iar: any = null;
  let iarUri: any = null;
  let iarHex: any = null;

  try {
    iar = EPCUtils.encodeIndividualAssetReference(
      encodeIARPrefix || -1,
      encodeIARCollectionRef,
      encodeIARItemRef,
      encodeIARSerial || 0,
      { joinBy: encodeIARJoinBy, includePrefix: encodeIARIncludePrefix },
    );
  } catch (e) {
    iar = { error: e };
  }

  try {
    iarUri = EPCUtils.encodeGIAI('uri', {
      companyPrefix: encodeIARCompanyPrefix,
      assetReference: EPCUtils.encodeIndividualAssetReference(
        encodeIARPrefix || -1,
        encodeIARCollectionRef,
        encodeIARItemRef,
        encodeIARSerial || 0,
      ),
    });
  } catch (e) {
    iarUri = { error: e };
  }

  try {
    iarHex = EPCUtils.encodeGIAI('hex', {
      companyPrefix: encodeIARCompanyPrefix,
      assetReference: EPCUtils.encodeIndividualAssetReference(
        encodeIARPrefix || -1,
        encodeIARCollectionRef,
        encodeIARItemRef,
        encodeIARSerial || 0,
      ),
    });
  } catch (e) {
    iarHex = { error: e };
  }

  return (
    <ScreenContent navigation={navigation} title="EPC-TDS">
      <ScrollView
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <InsetGroup
          label="Decode Hex EPC"
          labelRight={
            <InsetGroup.GroupLabelRightButton
              label="Reset to Example"
              onPress={() => setHexToDecode(EXAMPLE_HEX)}
            />
          }
        >
          <InsetGroup.Item
            vertical2
            label="RFID Tag EPC Memory Bank Contents"
            detail={
              <InsetGroup.TextInput
                value={hexToDecode}
                onChangeText={setHexToDecode}
              />
            }
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            vertical2
            label="Decoded EPC Tag URI"
            detailAsText
            detail={
              decoded.error ? (
                <Text style={commonStyles.opacity05}>
                  {decoded.error.message}
                </Text>
              ) : (
                decoded.toTagURI()
              )
            }
          />
        </InsetGroup>

        <InsetGroup
          label="Encode Hex EPC"
          labelRight={
            <InsetGroup.GroupLabelRightButton
              label="Reset to Example"
              onPress={() => setEpcToEncode(EXAMPLE_EPC)}
            />
          }
        >
          <InsetGroup.Item
            vertical2
            label="EPC Tag URI"
            detail={
              <InsetGroup.TextInput
                value={epcToEncode}
                onChangeText={setEpcToEncode}
              />
            }
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            vertical2
            label="RFID Tag EPC Memory Bank Contents"
            detailAsText
            detail={
              encoded.error ? (
                <Text style={commonStyles.opacity05}>
                  {encoded.error.message}
                </Text>
              ) : (
                encoded.toHexString()
              )
            }
          />
        </InsetGroup>

        <InsetGroup label="Encode Individual Asset Reference">
          <InsetGroup.Item
            vertical2
            label="Prefix"
            detail={
              <InsetGroup.TextInput
                placeholder="32"
                value={encodeIARPrefix?.toString()}
                onChangeText={handleEncodeIARPrefixChange}
              />
            }
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            vertical2
            label="Collection Reference"
            detail={
              <InsetGroup.TextInput
                placeholder="0000"
                value={encodeIARCollectionRef}
                onChangeText={setEncodeIARCollectionRef}
              />
            }
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            vertical2
            label="Item Reference"
            detail={
              <InsetGroup.TextInput
                placeholder="1234"
                value={encodeIARItemRef}
                onChangeText={setEncodeIARItemRef}
              />
            }
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            vertical2
            label="Serial"
            detail={
              <InsetGroup.TextInput
                placeholder="0"
                value={encodeIARSerial?.toString()}
                onChangeText={handleEncodeIARSerialChange}
              />
            }
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            label="Join By"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="."
                value={encodeIARJoinBy}
                onChangeText={setEncodeIARJoinBy}
              />
            }
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            label="Include Prefix"
            detail={
              <Switch
                value={encodeIARIncludePrefix}
                onChange={() => setEncodeIARIncludePrefix(v => !v)}
              />
            }
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            vertical2
            label="Encoded Data"
            detailAsText
            detail={
              iar.error ? (
                <Text style={commonStyles.opacity05}>{iar.error.message}</Text>
              ) : (
                iar
              )
            }
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            vertical2
            label="Company Prefix"
            detail={
              <InsetGroup.TextInput
                placeholder="0000000"
                value={encodeIARCompanyPrefix}
                onChangeText={setEncodeIARCompanyPrefix}
              />
            }
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            vertical2
            label="EPC Tag URI"
            detailAsText
            detail={
              iarUri.error ? (
                <Text style={commonStyles.opacity05}>
                  {iarUri.error.message}
                </Text>
              ) : (
                iarUri
              )
            }
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            vertical2
            label="RFID Tag EPC Memory Bank Contents"
            detailAsText
            detail={
              iarHex.error ? (
                <Text style={commonStyles.opacity05}>
                  {iarHex.error.message}
                </Text>
              ) : (
                iarHex
              )
            }
          />
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default EPCTDSScreen;
