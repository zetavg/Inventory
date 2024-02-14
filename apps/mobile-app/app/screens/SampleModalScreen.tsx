import React, { useRef, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import commonStyles from '@app/utils/commonStyles';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useDebouncedValue from '@app/hooks/useDebouncedValue';
import { defaultConfirmCloseFn } from '@app/hooks/useModalClosingHandler';

import ModalContent from '@app/components/ModalContent';
import Switch from '@app/components/Switch';
import UIGroup from '@app/components/UIGroup';

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
  const { kiaTextInputProps } =
    ModalContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

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
      <ModalContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />
        <UIGroup>
          <UIGroup.ListItem
            label="Show AppBar"
            detail={
              <UIGroup.ListItem.Switch
                value={showAppbar}
                onValueChange={() =>
                  navigation.push('SampleModal', {
                    showAppbar: !showAppbar,
                  })
                }
              />
            }
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Title"
            horizontalLabel
            placeholder="Title"
            returnKeyType="done"
            autoCapitalize="words"
            value={title}
            onChangeText={t => setTitle(t)}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Show Back Button"
            detail={
              <Switch
                value={showBackButton}
                onValueChange={() => setShowBackButton(v => !v)}
              />
            }
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Back Button Label"
            horizontalLabel
            placeholder="Back"
            returnKeyType="done"
            autoCapitalize="words"
            value={backButtonLabel}
            onChangeText={t => setBackButtonLabel(t)}
            {...kiaTextInputProps}
          />
        </UIGroup>

        <UIGroup>
          <UIGroup.ListItem
            label="Prevent Close"
            detail={
              <UIGroup.ListItem.Switch
                value={preventClose}
                onValueChange={() => setPreventClose(v => !v)}
              />
            }
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            button
            label="Close Modal"
            onPress={() => navigation.goBack()}
          />
        </UIGroup>

        <UIGroup header="Action 1">
          <UIGroup.ListTextInputItem
            label="Label"
            horizontalLabel
            placeholder="Label"
            returnKeyType="done"
            autoCapitalize="words"
            value={action1Label}
            onChangeText={t => setAction1Label(t)}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Material Icon"
            horizontalLabel
            placeholder="content-save"
            returnKeyType="done"
            autoCapitalize="none"
            value={action1MaterialIconName}
            onChangeText={t => setAction1MaterialIconName(t)}
            {...kiaTextInputProps}
          />
        </UIGroup>
        <UIGroup>
          <UIGroup.ListItem
            label="Variant: Normal"
            selected={action1Variant === 'normal'}
            onPress={() => setAction1Variant('normal')}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Variant: Strong"
            selected={action1Variant === 'strong'}
            onPress={() => setAction1Variant('strong')}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Variant: Destructive"
            selected={action1Variant === 'destructive'}
            onPress={() => setAction1Variant('destructive')}
          />
        </UIGroup>

        <UIGroup header="Action 2">
          <UIGroup.ListTextInputItem
            label="Label"
            horizontalLabel
            placeholder="Label"
            returnKeyType="done"
            autoCapitalize="words"
            value={action2Label}
            onChangeText={t => setAction2Label(t)}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Material Icon"
            horizontalLabel
            placeholder="delete"
            returnKeyType="done"
            autoCapitalize="none"
            value={action2MaterialIconName}
            onChangeText={t => setAction2MaterialIconName(t)}
            {...kiaTextInputProps}
          />
        </UIGroup>
        <UIGroup>
          <UIGroup.ListItem
            label="Variant: Normal"
            selected={action2Variant === 'normal'}
            onPress={() => setAction2Variant('normal')}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Variant: Strong"
            selected={action2Variant === 'strong'}
            onPress={() => setAction2Variant('strong')}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Variant: Destructive"
            selected={action2Variant === 'destructive'}
            onPress={() => setAction2Variant('destructive')}
          />
        </UIGroup>
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default SampleModalScreen;
