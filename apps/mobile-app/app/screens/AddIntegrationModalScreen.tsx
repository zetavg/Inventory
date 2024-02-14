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

function AddIntegrationModalScreen({
  navigation,
}: StackScreenProps<RootStackParamList, 'AddIntegration'>) {
  const [value, setValue] = useState<IntegrationType>(undefined);

  const scrollViewRef = useRef<ScrollView>(null);

  const handleSelect = useCallback(() => {
    navigation.goBack();
    switch (value) {
      case 'airtable':
        navigation.push('NewOrEditAirtableIntegration', {});
        break;
    }
  }, [navigation, value]);

  const isCancel = useRef(false);

  const cancel = useCallback(() => {
    isCancel.current = true;
    navigation.goBack();
  }, [navigation]);

  return (
    <ModalContent
      navigation={navigation}
      title="Add Integration"
      action2Label="Cancel"
      onAction2Press={cancel}
      action1Label="Next"
      action1MaterialIconName="check"
      onAction1Press={value ? handleSelect : undefined}
      action1Variant="strong"
    >
      <ModalContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />
        <UIGroup header="Select Integration Type" footer={getFooterText(value)}>
          <UIGroup.ListItem
            label="Airtable"
            onPress={() => setValue('airtable')}
            selected={value === 'airtable'}
          />
        </UIGroup>
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default AddIntegrationModalScreen;
