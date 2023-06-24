import React, { useRef } from 'react';
import { ScrollView, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import cs from '@app/utils/commonStyles';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import InsetGroup from '@app/components/InsetGroup';
import ModalContent from '@app/components/ModalContent';

import ProfileSwitcher from '../components/ProfileSwitcher';

function SwitchProfileScreen({
  navigation,
}: StackScreenProps<RootStackParamList, 'SwitchProfile'>) {
  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  return (
    <ModalContent navigation={navigation} title="Profiles">
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={cs.mt16} />
        <ProfileSwitcher />
        <InsetGroup>
          <InsetGroup.Item
            button
            label="New Profile..."
            onPress={() => navigation.push('CreateOrUpdateProfile', {})}
          />
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            button
            label="Edit Profile..."
            onPress={() => navigation.push('SelectProfileToEdit')}
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            button
            label="Delete Profile..."
            onPress={() => navigation.push('DeleteProfile')}
          />
        </InsetGroup>
      </ScrollView>
    </ModalContent>
  );
}

export default SwitchProfileScreen;
