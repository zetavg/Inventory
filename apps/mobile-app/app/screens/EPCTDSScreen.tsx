import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import epcTds from 'epc-tds';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';

import InsetGroup from '@app/components/InsetGroup';
import ScreenContent from '@app/components/ScreenContent';

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
          <InsetGroup.ItemSeparator />
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
          <InsetGroup.ItemSeparator />
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
      </ScrollView>
    </ScreenContent>
  );
}

export default EPCTDSScreen;
