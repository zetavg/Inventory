import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, TextInput } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import titleCase from '@app/utils/titleCase';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useAutoFocus from '@app/hooks/useAutoFocus';

import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

import { COLORS, ProfileColor } from '../slice';

function CreateOrUpdateProfileScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'CreateOrUpdateProfile'>) {
  const { uuid } = route.params;
  const profiles = useAppSelector(selectors.profiles.profiles);

  const dispatch = useAppDispatch();
  // const profilesState = useAppSelector(selectProfiles);

  const [name, setName] = useState(profiles[uuid || '']?.name || '');
  const nameErrorMessage = (() => {
    if (!name) {
      return '⚠ Please enter a name';
    }

    if (
      Object.entries(profiles)
        .filter(([k]) => k !== uuid)
        .map(([_, v]) => v.name)
        .includes(name)
    ) {
      return `⚠ "${name}" is already used`;
    }
  })();
  const isNameValid = !nameErrorMessage;

  const [color, setColor] = useState<ProfileColor>(
    profiles[uuid || '']?.color || 'blue',
  );

  const handleCreate = useCallback(() => {
    dispatch(actions.profiles.newProfile({ name, color }));
    navigation.goBack();
  }, [color, dispatch, name, navigation]);

  const handleUpdate = useCallback(() => {
    dispatch(actions.profiles.updateProfile({ uuid: uuid || '', name, color }));
    navigation.goBack();
  }, [color, dispatch, name, navigation, uuid]);

  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ModalContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);
  const nameInputRef = useRef<TextInput>(null);
  useAutoFocus(nameInputRef, { scrollViewRef, disable: !!uuid });

  return (
    <ModalContent
      navigation={navigation}
      title={uuid ? 'Edit Profile' : 'New Profile'}
      action1Label={uuid ? 'Save' : 'Create'}
      action1MaterialIconName="check"
      action1Variant="strong"
      onAction1Press={
        isNameValid ? (uuid ? handleUpdate : handleCreate) : undefined
      }
    >
      <ModalContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />
        <UIGroup footer={nameErrorMessage}>
          <UIGroup.ListTextInputItem
            label="Name"
            ref={nameInputRef}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholder="Profile"
            returnKeyType="done"
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

export default CreateOrUpdateProfileScreen;
