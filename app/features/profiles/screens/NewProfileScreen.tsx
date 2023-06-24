import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import cs from '@app/utils/commonStyles';
import titleCase from '@app/utils/titleCase';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import InsetGroup from '@app/components/InsetGroup';
import ModalContent from '@app/components/ModalContent';

import { COLORS, ProfileColor } from '../slice';

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
            <InsetGroup.ItemSeparator key={`s-${c}`} />,
          ]).slice(0, -1)}
        </InsetGroup>
      </ScrollView>
    </ModalContent>
  );
}

export default NewProfileScreen;
