/* eslint-disable react-native/no-inline-styles */
import React, { useCallback } from 'react';
import { Alert, Button, View } from 'react-native';

import useActionSheet from '@app/hooks/useActionSheet';

import StorybookSection from '@app/components/StorybookSection';
import StorybookStoryContainer from '@app/components/StorybookStoryContainer';

export default function SampleComponent() {
  const { showActionSheetWithOptions, showActionSheet } = useActionSheet();

  const handleShowActionSheetWithOptions = useCallback(() => {
    const options = ['Save', 'Delete', 'Cancel'];
    const destructiveButtonIndex = options.indexOf('Delete');
    const cancelButtonIndex = options.indexOf('Cancel');

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
      },
      selectedIndex => {
        switch (selectedIndex) {
          case destructiveButtonIndex:
            // Delete
            Alert.alert('Delete selected');
            break;

          case cancelButtonIndex:
            // Canceled
            break;

          default:
            // Save
            Alert.alert('Save selected');
            break;
        }
      },
    );
  }, [showActionSheetWithOptions]);

  const handleShowActionSheet = useCallback(() => {
    showActionSheet([
      {
        name: 'Save',
        onSelect: () => {
          Alert.alert('Save selected');
        },
      },
      {
        name: 'Delete',
        destructive: true,
        onSelect: () => {
          Alert.alert('Delete selected');
        },
      },
    ]);
  }, [showActionSheet]);

  const handleShowActionSheetWithoutCancel = useCallback(() => {
    showActionSheet(
      [
        {
          name: 'Save',
          onSelect: () => {
            Alert.alert('Save selected');
          },
        },
        {
          name: 'Delete',
          destructive: true,
          onSelect: () => {
            Alert.alert('Delete selected');
          },
        },
      ],
      { showCancel: false },
    );
  }, [showActionSheet]);

  const handleShowActionSheetWithCustomCancel = useCallback(() => {
    showActionSheet(
      [
        {
          name: 'Save',
          onSelect: () => {
            Alert.alert('Save selected');
          },
        },
        {
          name: 'Delete',
          destructive: true,
          onSelect: () => {
            Alert.alert('Delete selected');
          },
        },
      ],
      {
        cancelText: 'Custom Cancel Text',
        onCancel: () => {
          Alert.alert('Custom cancel handler');
        },
      },
    );
  }, [showActionSheet]);

  return (
    <StorybookStoryContainer>
      <StorybookSection title="showActionSheetWithOptions" style={{ gap: 8 }}>
        <Button
          title="Show Action Sheet"
          onPress={handleShowActionSheetWithOptions}
        />
      </StorybookSection>
      <StorybookSection title="showActionSheet" style={{ gap: 8 }}>
        <Button title="Show Action Sheet" onPress={handleShowActionSheet} />
        <Button
          title="Show Action Sheet Without Cancel"
          onPress={handleShowActionSheetWithoutCancel}
        />
        <Button
          title="Show Action Sheet With Custom Cancel"
          onPress={handleShowActionSheetWithCustomCancel}
        />
      </StorybookSection>
    </StorybookStoryContainer>
  );
}
