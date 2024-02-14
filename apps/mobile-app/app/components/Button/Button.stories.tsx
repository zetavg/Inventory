import React from 'react';
import { Alert, ScrollView, Text } from 'react-native';

import Icon from '@app/components/Icon';
import StorybookSection from '@app/components/StorybookSection';
import StorybookStoryContainer from '@app/components/StorybookStoryContainer';

import Button from './Button';

export default {
  title: '[B] Button',
  component: Button,
  parameters: {
    notes: 'Default Button',
  },
  args: {
    title: 'Hello world',
    compact: false,
    loading: false,
    icon: '',
    disabled: false,
    uppercase: false,
    mode: 'text',
  },
  argTypes: {
    mode: {
      options: ['text', 'outlined', 'contained', 'elevated', 'contained-tonal'],
      control: { type: 'select' },
    },
    icon: {
      options: ['', 'camera', 'access-point', 'delete'],
      control: { type: 'select' },
    },
  },
};

export const Basic = (args: React.ComponentProps<typeof Button>) => (
  <ScrollView>
    <StorybookStoryContainer>
      <StorybookSection>
        <Button
          {...args}
          onPress={() => Alert.alert('Action', 'onPress')}
          onLongPress={() => Alert.alert('Action', 'onLongPress')}
        />
      </StorybookSection>

      <StorybookSection title="Text">
        <Button
          {...args}
          mode="text"
          onPress={() => Alert.alert('Action', 'onPress')}
          onLongPress={() => Alert.alert('Action', 'onLongPress')}
        />
      </StorybookSection>

      <StorybookSection title="Outlined">
        <Button
          {...args}
          mode="outlined"
          onPress={() => Alert.alert('Action', 'onPress')}
          onLongPress={() => Alert.alert('Action', 'onLongPress')}
        />
      </StorybookSection>

      <StorybookSection title="Contained">
        <Button
          {...args}
          mode="contained"
          onPress={() => Alert.alert('Action', 'onPress')}
          onLongPress={() => Alert.alert('Action', 'onLongPress')}
        />
      </StorybookSection>

      <StorybookSection title="Elevated">
        <Button
          {...args}
          mode="elevated"
          onPress={() => Alert.alert('Action', 'onPress')}
          onLongPress={() => Alert.alert('Action', 'onLongPress')}
        />
      </StorybookSection>

      <StorybookSection title="Contained-tonal">
        <Button
          {...args}
          mode="contained-tonal"
          onPress={() => Alert.alert('Action', 'onPress')}
          onLongPress={() => Alert.alert('Action', 'onLongPress')}
        />
      </StorybookSection>

      <StorybookSection title="Text, with icon">
        <Button
          mode="text"
          onPress={() => Alert.alert('Action', 'onPress')}
          onLongPress={() => Alert.alert('Action', 'onLongPress')}
        >
          {({ textProps, iconProps }) => (
            <>
              <Icon {...iconProps} name="checklist" />
              <Text {...textProps}>{args.title}</Text>
            </>
          )}
        </Button>
      </StorybookSection>

      <StorybookSection title="Outlined, with icon">
        <Button
          mode="outlined"
          onPress={() => Alert.alert('Action', 'onPress')}
          onLongPress={() => Alert.alert('Action', 'onLongPress')}
        >
          {({ textProps, iconProps }) => (
            <>
              <Icon {...iconProps} name="checklist" />
              <Text {...textProps}>{args.title}</Text>
            </>
          )}
        </Button>
      </StorybookSection>

      <StorybookSection title="Contained, with icon">
        <Button
          mode="contained"
          onPress={() => Alert.alert('Action', 'onPress')}
          onLongPress={() => Alert.alert('Action', 'onLongPress')}
        >
          {({ textProps, iconProps }) => (
            <>
              <Icon {...iconProps} name="checklist" />
              <Text {...textProps}>{args.title}</Text>
            </>
          )}
        </Button>
      </StorybookSection>

      <StorybookSection title="Elevated, with icon">
        <Button
          mode="elevated"
          onPress={() => Alert.alert('Action', 'onPress')}
          onLongPress={() => Alert.alert('Action', 'onLongPress')}
        >
          {({ textProps, iconProps }) => (
            <>
              <Icon {...iconProps} name="checklist" />
              <Text {...textProps}>{args.title}</Text>
            </>
          )}
        </Button>
      </StorybookSection>

      <StorybookSection title="Contained-tonal, with icon">
        <Button
          mode="contained-tonal"
          onPress={() => Alert.alert('Action', 'onPress')}
          onLongPress={() => Alert.alert('Action', 'onLongPress')}
        >
          {({ textProps, iconProps }) => (
            <>
              <Icon {...iconProps} name="checklist" />
              <Text {...textProps}>{args.title}</Text>
            </>
          )}
        </Button>
      </StorybookSection>
    </StorybookStoryContainer>
  </ScrollView>
);
