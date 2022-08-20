import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import titleCase from '@app/utils/titleCase';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';

import { useAppSelector, useAppDispatch } from '@app/redux';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import cs from '@app/utils/commonStyles';

import ModalContent from '@app/components/ModalContent';
import InsetGroup from '@app/components/InsetGroup';

import { ProfileColor, createProfile } from '../slice';
import { selectProfiles } from '../selectors';

const COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'indigo',
  'purple',
  'pink',
] as const;

function normalizeName(name: string) {
  return name.toLowerCase().replace(' ', '_');
}

function NewProfileScreen({
  navigation,
}: StackScreenProps<RootStackParamList, 'NewProfile'>) {
  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: -80, animated: false });
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  const handleNameInputFocus = useCallback(() => {
    scrollViewRef.current?.scrollTo({ y: -80, animated: true });
    for (let i = 1; i < 120; i++) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: -80, animated: true });
      }, i * 10);
    }
  }, []);

  const dispatch = useAppDispatch();
  const profilesState = useAppSelector(selectProfiles);

  const [name, setName] = useState('');
  const nameErrorMessage = (() => {
    if (!name.match(/^[a-zA-Z0-9]+$/) && name !== '/dev/null') {
      return 'Invalid name';
    }

    if (Object.keys(profilesState.configs).includes(normalizeName(name))) {
      return `"${name}" is already used`;
    }
  })();
  const isNameValid = !nameErrorMessage;

  const [color, setColor] = useState<ProfileColor>('blue');

  const handleCreate = useCallback(() => {
    dispatch(createProfile({ name: normalizeName(name), color }));
    navigation.goBack();
  }, [color, dispatch, name, navigation]);

  return (
    <ModalContent
      navigation={navigation}
      title="New Profile"
      action1Label="Create"
      action1MaterialIconName="check"
      action1Variant="strong"
      onAction1Press={isNameValid ? handleCreate : undefined}
    >
      <ScrollView
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
                value={name}
                onChangeText={setName}
                placeholder="Profile"
                autoFocus
                onFocus={handleNameInputFocus}
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
            <InsetGroup.ItemSeperator key={`s-${c}`} />,
          ]).slice(0, -1)}
        </InsetGroup>
      </ScrollView>
    </ModalContent>
  );
}

export default NewProfileScreen;
