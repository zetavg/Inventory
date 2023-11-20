import React, { useCallback, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { DataType } from '@app/data';

import type { RootStackParamList } from '@app/navigation/Navigation';

import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

type IntegrationType = undefined | 'airtable';

function getFooterText(value: IntegrationType): string | undefined {
  switch (value) {
    case 'airtable':
      return 'Sync your data to and from an Airtable base.';
    case undefined:
      return undefined;
  }
}

function GetSecretsModalScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'GetSecrets'>) {
  const { secrets, callback } = route.params;
  const [value, setValue] = useState<{ [key: string]: string }>(
    Object.fromEntries(
      secrets.map(s => [s.key, s.defaultValue]).filter(([, v]) => !!v),
    ),
  );

  const scrollViewRef = useRef<ScrollView>(null);

  const isDone = useRef(false);

  const handleOk = useCallback(() => {
    isDone.current = true;
    navigation.goBack();
    callback(value);
  }, [callback, navigation, value]);

  const cancel = useCallback(() => {
    isDone.current = true;
    navigation.goBack();
    callback(null);
  }, [callback, navigation]);

  const canOk = secrets.every(secret => !!value[secret.key]);

  const handleLeave = useCallback((confirm: () => void) => {
    if (isDone.current) {
      confirm();
      return;
    }
  }, []);

  return (
    <ModalContent
      navigation={navigation}
      title="Enter Secrets"
      action2Label="Cancel"
      onAction2Press={cancel}
      action1Label="Ok"
      action1MaterialIconName="check"
      onAction1Press={canOk ? handleOk : undefined}
      action1Variant="strong"
      preventClose={true}
      confirmCloseFn={handleLeave}
    >
      <ModalContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />
        {secrets.map(secret => (
          <UIGroup
            key={secret.key}
            header={secret.name}
            footer={secret.description}
          >
            <UIGroup.ListTextInputItem
              placeholder="Enter Value"
              monospaced
              spellCheck={false}
              secureTextEntry
              autoCapitalize="none"
              value={value[secret.key]}
              onChangeText={text =>
                setValue({ ...value, [secret.key]: text.trim() })
              }
            />
          </UIGroup>
        ))}
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default GetSecretsModalScreen;
