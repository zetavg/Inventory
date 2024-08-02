import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, TextInput } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import cs from '@app/utils/commonStyles';
import titleCase from '@app/utils/titleCase';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useAutoFocus from '@app/hooks/useAutoFocus';
import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

import { COLORS, ProfileColor } from '../slice';

function OLD_NewProfileScreen({
  navigation,
}: StackScreenProps<RootStackParamList, 'NewProfile'>) {
  const dispatch = useAppDispatch();
  // const profilesState = useAppSelector(selectProfiles);

  const [name, setName] = useState('');
  const nameErrorMessage = (() => {
    if (!name) {
      return 'Please enter a name';
    }
    // if (!name.match(/^[a-zA-Z0-9]+$/) && name !== '/dev/null') {
    //   return 'Invalid name';
    // }

    // if (Object.keys(profilesState.configs).includes(normalizeName(name))) {
    //   return `"${name}" is already used`;
    // }
  })();
  const isNameValid = !nameErrorMessage;

  const [color, setColor] = useState<ProfileColor>('blue');

  const handleCreate = useCallback(() => {
    dispatch(actions.profiles.newProfile({ name, color }));
    navigation.goBack();
  }, [color, dispatch, name, navigation]);

  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ModalContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);
  const nameInputRef = useRef<TextInput>(null);
  useAutoFocus(nameInputRef, { scrollViewRef });

  return (
    <ModalContent
      navigation={navigation}
      title="New Profile 22"
      action1Label="Create"
      action1MaterialIconName="check"
      action1Variant="strong"
      onAction1Press={isNameValid ? handleCreate : undefined}
    >
      <ModalContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />
        <UIGroup footer={nameErrorMessage}>
          <UIGroup.ListTextInputItem
            label="Name"
            horizontalLabel
            value={name}
            onChangeText={setName}
            placeholder="Profile"
            {...kiaTextInputProps}
          />
        </UIGroup>

        <UIGroup header="Color">
          {COLORS.flatMap(c => [
            <UIGroup.ListItem
              key={c}
              label={titleCase(c)}
              selected={color === c}
              onPress={() => setColor(c)}
            />,
            <UIGroup.ListItemSeparator key={`s-${c}`} />,
          ]).slice(0, -1)}
        </UIGroup>
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default OLD_NewProfileScreen;
