import React, { useRef, useState } from 'react';
import { ScrollView, Alert } from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';

import { defaultConfirmCloseFn } from '@app/hooks/useModalClosingHandler';
import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import ModalContent from '@app/components/ModalContent';
import InsetGroup from '@app/components/InsetGroup';
import Switch from '@app/components/Switch';
import commonStyles from '@app/utils/commonStyles';
import useDebouncedValue from '@app/hooks/useDebouncedValue';

function SampleModalScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'SampleModal'>) {
  const showAppbar =
    typeof route.params?.showAppbar === 'boolean'
      ? route.params?.showAppbar
      : true;

  const [showBackButton, setShowBackButton] = useState(true);
  const [backButtonLabel, setBackButtonLabel] = useState('Back');

  const [title, setTitle] = useState('Sample Modal');
  const [preventClose, setPreventClose] = useState(false);

  const [action1Label, setAction1Label] = useState('Action 1');
  const [action1MaterialIconName, setAction1MaterialIconName] =
    useState('content-save');
  const debouncedAction1MaterialIconName = useDebouncedValue(
    action1MaterialIconName,
    1000,
  );
  const [action1Variant, setAction1Variant] = useState<
    'normal' | 'strong' | 'destructive'
  >('strong');

  const [action2Label, setAction2Label] = useState('');
  const [action2MaterialIconName, setAction2MaterialIconName] = useState('');
  const debouncedAction2MaterialIconName = useDebouncedValue(
    action2MaterialIconName,
    1000,
  );
  const [action2Variant, setAction2Variant] = useState<
    'normal' | 'strong' | 'destructive'
  >('normal');

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  return (
    <ModalContent
      navigation={navigation}
      preventClose={preventClose}
      confirmCloseFn={defaultConfirmCloseFn}
      showAppBar={showAppbar}
      showBackButton={showBackButton}
      backButtonLabel={backButtonLabel || 'Back'}
      title={title || 'Title'}
      action1Label={action1Label}
      action1MaterialIconName={debouncedAction1MaterialIconName}
      action1Variant={action1Variant}
      onAction1Press={() => Alert.alert('Action 1 Pressed')}
      action2Label={action2Label}
      action2MaterialIconName={debouncedAction2MaterialIconName}
      action2Variant={action2Variant}
      onAction2Press={() => Alert.alert('Action 2 Pressed')}
    >
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <InsetGroup style={commonStyles.mt16}>
          <InsetGroup.Item
            label="Show AppBar"
            detail={
              <Switch
                value={showAppbar}
                onValueChange={() =>
                  navigation.push('SampleModal', {
                    showAppbar: !showAppbar,
                  })
                }
              />
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Title"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="Title"
                returnKeyType="done"
                autoCapitalize="words"
                value={title}
                onChangeText={t => setTitle(t)}
              />
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Show Back Button"
            detail={
              <Switch
                value={showBackButton}
                onValueChange={() => setShowBackButton(v => !v)}
              />
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Back Button Label"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="Back"
                returnKeyType="done"
                autoCapitalize="words"
                value={backButtonLabel}
                onChangeText={t => setBackButtonLabel(t)}
              />
            }
          />
        </InsetGroup>

        <InsetGroup>
          <InsetGroup.Item
            label="Prevent Close"
            detail={
              <Switch
                value={preventClose}
                onValueChange={() => setPreventClose(v => !v)}
              />
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Close Modal"
            button
            onPress={() => navigation.goBack()}
          />
        </InsetGroup>

        <InsetGroup label="Action 1">
          <InsetGroup.Item
            label="Label"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="Label"
                returnKeyType="done"
                autoCapitalize="words"
                value={action1Label}
                onChangeText={t => setAction1Label(t)}
              />
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Material Icon"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="content-save"
                returnKeyType="done"
                autoCapitalize="none"
                value={action1MaterialIconName}
                onChangeText={t => setAction1MaterialIconName(t)}
              />
            }
          />
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            label="Variant: Normal"
            selected={action1Variant === 'normal'}
            onPress={() => setAction1Variant('normal')}
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Variant: Strong"
            selected={action1Variant === 'strong'}
            onPress={() => setAction1Variant('strong')}
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Variant: Destructive"
            selected={action1Variant === 'destructive'}
            onPress={() => setAction1Variant('destructive')}
          />
        </InsetGroup>

        <InsetGroup label="Action 2">
          <InsetGroup.Item
            label="Label"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="Label"
                returnKeyType="done"
                autoCapitalize="words"
                value={action2Label}
                onChangeText={t => setAction2Label(t)}
              />
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Material Icon"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="delete"
                returnKeyType="done"
                autoCapitalize="none"
                value={action2MaterialIconName}
                onChangeText={t => setAction2MaterialIconName(t)}
              />
            }
          />
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            label="Variant: Normal"
            selected={action2Variant === 'normal'}
            onPress={() => setAction2Variant('normal')}
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Variant: Strong"
            selected={action2Variant === 'strong'}
            onPress={() => setAction2Variant('strong')}
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Variant: Destructive"
            selected={action2Variant === 'destructive'}
            onPress={() => setAction2Variant('destructive')}
          />
        </InsetGroup>
      </ScrollView>
    </ModalContent>
  );
}

export default SampleModalScreen;
