import React from 'react';
import { Switch } from 'react-native';
import { action } from '@storybook/addon-actions';

export default {
  title: 'React Native Switch',
  component: Switch,
  args: {
    disabled: false,
    value: false,
  },
  parameters: {
    notes: 'My notes',
  },
};

export const Basic = (args: React.ComponentProps<typeof Switch>) => (
  <Switch
    {...args}
    onChange={action('onChange')}
    onValueChange={action('onValueChange')}
  />
);
