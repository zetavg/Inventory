import React, { useCallback, useRef } from 'react';
import { ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useAutoFocus from '@app/hooks/useAutoFocus';

import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

import useNewOrEditServerUI from '../hooks/useNewOrEditServerUI';

function DBSyncNewOrEditServerModalScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'DBSyncNewOrEditServerModal'>) {
  const { id } = route.params;
  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ModalContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);
  const afterSave = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const {
    newOrEditServerUIElement,
    hasUnsavedChanges,
    handleSave,
    handleLeave,
    nameInputRef,
  } = useNewOrEditServerUI({
    id,
    afterSave,
    inputProps: kiaTextInputProps,
  });

  useAutoFocus(nameInputRef, { scrollViewRef, disable: !!id });

  return (
    <ModalContent
      navigation={navigation}
      preventClose={hasUnsavedChanges}
      confirmCloseFn={handleLeave}
      title={id ? 'Edit Server' : 'Add Server'}
      action1Label="Save"
      action1MaterialIconName="check"
      action1Variant="strong"
      onAction1Press={handleSave}
      backButtonLabel="Cancel"
    >
      <ModalContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />
        {newOrEditServerUIElement}
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default DBSyncNewOrEditServerModalScreen;
