import React, { useRef, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import commonStyles from '@app/utils/commonStyles';

import ChangeAppIcon from '@app/modules/ChangeAppIcon';

import type { StackParamList } from '@app/navigation/MainStack';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import InsetGroup from '@app/components/InsetGroup';
import ScreenContent from '@app/components/ScreenContent';

function ConsoleLogScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'ConsoleLog'>) {
  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  const [message, setMessage] = useState('The message.');

  return (
    <ScreenContent navigation={navigation} route={route} title="console.log">
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <InsetGroup style={commonStyles.mt4}>
          <InsetGroup.Item
            vertical2
            label="Message"
            detail={
              <InsetGroup.TextInput
                multiline
                scrollEnabled={false}
                placeholder="Enter message..."
                value={message}
                onChangeText={setMessage}
              />
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            button
            label="console.log"
            onPress={() => {
              console.log(message);
            }}
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            button
            label="console.info"
            onPress={() => {
              console.info(message);
            }}
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            button
            label="console.warn"
            onPress={() => {
              console.warn(message);
            }}
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            button
            label="console.error"
            onPress={() => {
              console.error(message);
            }}
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            button
            label="console.debug"
            onPress={() => {
              console.debug(message);
            }}
          />
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            button
            label="Bump Message"
            onPress={() => {
              setMessage(msg => {
                const regex = /([0-9]+)(\.?)$/m;
                const match = msg.match(regex);
                if (match) {
                  return msg.replace(
                    regex,
                    `${parseInt(match[1], 10) + 1}${match[2]}`,
                  );
                }

                const regex2 = /(\.?)$/m;
                const match2 = msg.match(regex2);
                if (match2) {
                  return msg.replace(regex2, ` 0${match2[1]}`);
                }

                return msg;
              });
            }}
          />
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default ConsoleLogScreen;
