import React, { useRef, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import ChangeAppIcon from '@app/modules/ChangeAppIcon';

import type { StackParamList } from '@app/navigation/MainStack';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import InsetGroup from '@app/components/InsetGroup';
import ScreenContent from '@app/components/ScreenContent';

function DevChangeIconScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'DevChangeIcon'>) {
  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  const [iconName, setIconName] = useState('');

  return (
    <ScreenContent
      navigation={navigation}
      route={route}
      title="Change Icon"
      headerLargeTitle={false}
    >
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <InsetGroup
          label="Icon"
          footerLabel={
            'Enter a icon name and press "Set" to change the icon. Leave the icon name blank and press "Set" to reset to default icon.'
          }
        >
          <InsetGroup.Item>
            <InsetGroup.TextInput
              placeholder="Enter icon name (e.g.: AppIcon-dark)"
              autoCapitalize="none"
              returnKeyType="done"
              onFocus={() => scrollViewRef?.current?.scrollTo({ y: -9999 })}
              value={iconName}
              onChangeText={setIconName}
              clearButtonMode="always"
            />
          </InsetGroup.Item>
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            button
            label="Set"
            onPress={async () => {
              try {
                const result = await ChangeAppIcon.set(iconName || null);
                // Alert.alert('Ok', result);
              } catch (e: any) {
                Alert.alert('Error', e.message);
              }
            }}
          />
        </InsetGroup>

        <InsetGroup footerLabel={'Press "Get" to get the current icon name.'}>
          <InsetGroup.Item
            button
            label="Get"
            onPress={async () => {
              try {
                const name = await ChangeAppIcon.get();
                setIconName(name);
              } catch (e: any) {
                Alert.alert('Error', e);
              }
            }}
          />
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default DevChangeIconScreen;
