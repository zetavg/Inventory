import React from 'react';
import { Button } from 'react-native';
import { action } from '@storybook/addon-actions';

export default {
  title: 'React Native Button',
  component: Button,
  args: {
    title: 'Hello world',
  },
  parameters: {
    notes: 'My notes',
  },
};

export const Basic = (args: React.ComponentProps<typeof Button>) => (
  <Button {...args} onPress={action('onPress')} />
);
