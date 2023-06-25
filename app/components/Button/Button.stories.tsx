import React from 'react';
import { action } from '@storybook/addon-actions';
import StorybookStoryContainer from '@app/components/StorybookStoryContainer';
import StorybookSection from '@app/components/StorybookSection';

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
  <StorybookStoryContainer>
    <StorybookSection>
      <Button
        {...args}
        onPress={action('onPress')}
        onLongPress={action('onLongPress')}
      />
    </StorybookSection>

    <StorybookSection title="Text">
      <Button
        {...args}
        mode="text"
        onPress={action('onPress')}
        onLongPress={action('onLongPress')}
      />
    </StorybookSection>

    <StorybookSection title="Outlined">
      <Button
        {...args}
        mode="outlined"
        onPress={action('onPress')}
        onLongPress={action('onLongPress')}
      />
    </StorybookSection>

    <StorybookSection title="Contained">
      <Button
        {...args}
        mode="contained"
        onPress={action('onPress')}
        onLongPress={action('onLongPress')}
      />
    </StorybookSection>

    <StorybookSection title="Elevated">
      <Button
        {...args}
        mode="elevated"
        onPress={action('onPress')}
        onLongPress={action('onLongPress')}
      />
    </StorybookSection>

    <StorybookSection title="Contained-tonal">
      <Button
        {...args}
        mode="contained-tonal"
        onPress={action('onPress')}
        onLongPress={action('onLongPress')}
      />
    </StorybookSection>
  </StorybookStoryContainer>
);
