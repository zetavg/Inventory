/* eslint-disable react-native/no-inline-styles */
import React, { useMemo } from 'react';
import { Alert, Button, Platform, Text } from 'react-native';

import StorybookSection from '@app/components/StorybookSection';
import StorybookStoryContainer from '@app/components/StorybookStoryContainer';

import MenuView from './MenuView';

export default function SampleComponent() {
  return (
    <StorybookStoryContainer>
      <StorybookSection title="MenuView" style={{ gap: 8 }}>
        <MenuView
          title="Menu Title"
          actions={useMemo(
            () => [
              {
                title: 'Add',
                sfSymbolName: 'plus',
                children: [
                  {
                    title: 'Take Picture from Camera',
                    sfSymbolName: 'camera',
                    onPress: () =>
                      Alert.alert('"Take Picture from Camera" pressed'),
                  },
                  {
                    title: 'Select from Photo Library',
                    sfSymbolName: 'photo.on.rectangle',
                    onPress: () =>
                      Alert.alert('"Select from Photo Library" pressed'),
                  },
                  {
                    title: 'Select from Files',
                    sfSymbolName: 'folder',
                    onPress: () => Alert.alert('"Select from Files" pressed'),
                  },
                ],
              },
              {
                title: 'Options',
                sfSymbolName: 'slider.horizontal.3',
                children: [
                  {
                    title: 'On State',
                    state: 'on',
                    onPress: () => Alert.alert('"On State" pressed'),
                  },
                  {
                    title: 'Off State',
                    state: 'off',
                    onPress: () => Alert.alert('"Off State" pressed'),
                  },
                  {
                    title: 'Mixed State',
                    state: 'mixed',
                    onPress: () => Alert.alert('"Mixed State" pressed'),
                  },
                  {
                    title: 'Destructive Action',
                    destructive: true,
                    onPress: () => Alert.alert('"Destructive Action" pressed'),
                  },
                ],
              },
              {
                title: 'Share',
                sfSymbolName: 'square.and.arrow.up',
                onPress: () => Alert.alert('"Share" pressed'),
              },
              // {
              //   title: 'Disabled',
              //   attributes: {
              //     disabled: true,
              //   },
              //   onPress: () => Alert.alert('"Disabled" pressed'),
              // },
              {
                title: 'Destructive',
                destructive: true,
                sfSymbolName: 'trash',
                onPress: () => Alert.alert('"Destructive" pressed'),
              },
            ],
            [],
          )}
        >
          <Button title="Show Menu" />
        </MenuView>
      </StorybookSection>
      <StorybookSection title="MenuView with sections" style={{ gap: 8 }}>
        <MenuView
          actions={useMemo(
            () => [
              {
                type: 'section',
                children: [
                  {
                    title: 'Sort by Name',
                    state: 'on',
                    onPress: () => Alert.alert('"Sort by Name" pressed'),
                  },
                  {
                    title: 'Sort by Date',
                    state: 'off',
                    onPress: () => Alert.alert('"Sort by Date" pressed'),
                  },
                ],
              },
              {
                type: 'section',
                children: [
                  {
                    title: 'Ascending',
                    state: 'on',
                    onPress: () => Alert.alert('"Ascending" pressed'),
                  },
                  {
                    title: 'Descending',
                    state: 'off',
                    onPress: () => Alert.alert('"Descending" pressed'),
                  },
                ],
              },
              {
                type: 'section',
                children: [
                  {
                    title: 'More Options',
                    sfSymbolName: 'slider.horizontal.3',
                    children: [
                      {
                        title: 'On State',
                        state: 'on',
                        onPress: () => Alert.alert('"On State" pressed'),
                      },
                      {
                        title: 'Off State',
                        state: 'off',
                        onPress: () => Alert.alert('"Off State" pressed'),
                      },
                      {
                        title: 'Mixed State',
                        state: 'mixed',
                        onPress: () => Alert.alert('"Mixed State" pressed'),
                      },
                      {
                        title: 'Destructive Action',
                        destructive: true,
                        onPress: () =>
                          Alert.alert('"Destructive Action" pressed'),
                      },
                    ],
                  },
                ],
              },
            ],
            [],
          )}
        >
          <Button title="Show Menu" />
        </MenuView>
      </StorybookSection>
      <StorybookSection title="MenuView disabled" style={{ gap: 8 }}>
        <MenuView
          disabled
          actions={useMemo(
            () => [
              {
                title: 'Action',
                onPress: () => Alert.alert('"Action" pressed'),
              },
            ],
            [],
          )}
        >
          <Button title="Show Menu" disabled />
        </MenuView>
      </StorybookSection>
    </StorybookStoryContainer>
  );
}
