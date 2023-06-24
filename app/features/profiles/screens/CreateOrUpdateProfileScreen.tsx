import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, TextInput } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import cs from '@app/utils/commonStyles';
import titleCase from '@app/utils/titleCase';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import InsetGroup from '@app/components/InsetGroup';
import ModalContent from '@app/components/ModalContent';
import ScreenContentScrollView from '@app/components/ScreenContentScrollView';

import { COLORS, ProfileColor } from '../slice';

function CreateOrUpdateProfileScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'CreateOrUpdateProfile'>) {
  const scrollViewRef = useRef<ScrollView>(null);
  const { uuid } = route.params;
  const profiles = useAppSelector(selectors.profiles.profiles);

  useScrollViewContentInsetFix(scrollViewRef);

  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: -80, animated: false });
    }, 10);

    return () => clearTimeout(timer);
  }, []);

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

  const nameInputRef = useRef<TextInput>(null);

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
      <ScreenContentScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <InsetGroup style={cs.mt16} footerLabel={nameErrorMessage}>
          <InsetGroup.Item
            vertical2
            label="Name"
            detail={
              <InsetGroup.TextInput
                ref={nameInputRef}
                value={name}
                onChangeText={setName}
                placeholder="Profile"
                autoFocus={!uuid}
                onFocus={ScreenContentScrollView.strf(
                  scrollViewRef,
                  nameInputRef,
                )}
              />
            }
          />
        </InsetGroup>

        <InsetGroup label="Color">
          {COLORS.flatMap(c => [
            <InsetGroup.Item
              key={c}
              label={titleCase(c)}
              selected={color === c}
              onPress={() => setColor(c)}
            />,
            <InsetGroup.ItemSeparator key={`s-${c}`} />,
          ]).slice(0, -1)}
        </InsetGroup>
      </ScreenContentScrollView>
    </ModalContent>
  );
}

export default CreateOrUpdateProfileScreen;
