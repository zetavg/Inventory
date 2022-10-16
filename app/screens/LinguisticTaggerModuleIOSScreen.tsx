import React, { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView } from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';

import LinguisticTaggerModuleIOS from '@app/modules/LinguisticTaggerModuleIOS';

function GenericTextDetailsScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'LinguisticTaggerModuleIOS'>) {
  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  const [textToCut, setTextToCut] = useState('');

  const handleCut = useCallback(() => {
    const tokens = LinguisticTaggerModuleIOS.cut(textToCut);
    Alert.alert('Results', JSON.stringify(tokens));
  }, [textToCut]);

  return (
    <ScreenContent
      navigation={navigation}
      route={route}
      title="LinguisticTaggerModuleIOS"
      headerLargeTitle={false}
    >
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <InsetGroup label="Cut">
          <InsetGroup.Item>
            <InsetGroup.TextInput
              // alignRight
              placeholder="Text to cut"
              autoCapitalize="sentences"
              returnKeyType="done"
              onFocus={() => scrollViewRef?.current?.scrollTo({ y: -9999 })}
              value={textToCut}
              onChangeText={setTextToCut}
            />
          </InsetGroup.Item>
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item button label="Cut" onPress={handleCut} />
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default GenericTextDetailsScreen;
