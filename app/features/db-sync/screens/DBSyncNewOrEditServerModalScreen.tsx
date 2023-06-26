import React, { useCallback, useEffect, useRef } from 'react';
import { ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import type { RootStackParamList } from '@app/navigation/Navigation';

import ModalContent from '@app/components/ModalContent';
import ScreenContentScrollView from '@app/components/ScreenContentScrollView';
import UIGroup from '@app/components/UIGroup';

import useNewOrEditServerUI from '../hooks/useNewOrEditServerUI';

function DBSyncNewOrEditServerModalScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'DBSyncNewOrEditServerModal'>) {
  const { id } = route.params;
  const scrollViewRef = useRef<ScrollView>(null);
  const afterSave = useCallback(() => {
    navigation.goBack();
  }, [navigation]);
  const onNameInputFocus = useCallback(
    () => ScreenContentScrollView.st(scrollViewRef, -40),
    [],
  );
  const {
    newOrEditServerUIElement,
    hasUnsavedChanges,
    handleSave,
    handleLeave,
    nameInputRef,
  } = useNewOrEditServerUI({ id, afterSave, onNameInputFocus });

  useEffect(() => {
    if (!id) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [id, nameInputRef]);

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
      <ScreenContentScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />
        {newOrEditServerUIElement}
      </ScreenContentScrollView>
    </ModalContent>
  );
}

export default DBSyncNewOrEditServerModalScreen;
