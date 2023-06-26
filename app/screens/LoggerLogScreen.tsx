import React, { useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import logger from '@app/logger';

import type { StackParamList } from '@app/navigation/MainStack';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

function LoggerLogScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'LoggerLog'>) {
  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  const [message, setMessage] = useState('The message.');
  const [argsStr, setArgsStr] = useState(
    JSON.stringify(
      {
        module: 'LoggerLogScreen (testing)',
        user: null,
        details: null,
        timestamp: null,
      },
      null,
      2,
    ),
  );
  let argsErrorMessage: string | undefined;
  const args = (() => {
    try {
      return JSON.parse(argsStr);
    } catch (e) {
      argsErrorMessage = '⚠ Invalid JSON';
      return {};
    }
  })();

  return (
    <ScreenContent navigation={navigation} route={route} title="Logger">
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        <UIGroup footer={argsErrorMessage}>
          <UIGroup.ListTextInputItem
            label="Message"
            multiline
            scrollEnabled={false}
            placeholder="Enter message..."
            value={message}
            onChangeText={setMessage}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Args"
            multiline
            monospaced
            small
            scrollEnabled={false}
            placeholder="{}"
            value={argsStr}
            onChangeText={setArgsStr}
          />
        </UIGroup>
        <UIGroup>
          <UIGroup.ListItem
            button
            label="logger.debug"
            onPress={() => {
              logger.debug(message, args);
            }}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            button
            label="logger.info"
            onPress={() => {
              logger.info(message, args);
            }}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            button
            label="logger.log"
            onPress={() => {
              logger.log(message, args);
            }}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            button
            label="logger.warn"
            onPress={() => {
              logger.warn(message, args);
            }}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            button
            label="logger.error"
            onPress={() => {
              logger.error(message, args);
            }}
          />
        </UIGroup>
        <UIGroup>
          <UIGroup.ListItem
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
        </UIGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default LoggerLogScreen;
