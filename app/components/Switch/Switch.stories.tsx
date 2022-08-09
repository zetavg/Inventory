import React from 'react';
import { action } from '@storybook/addon-actions';
import StorybookStoryContainer from '@app/components/StorybookStoryContainer';
import StorybookSection from '@app/components/StorybookSection';

import Switch from './Switch';

export default {
  title: 'Switch',
  component: Switch,
  args: {
    disabled: false,
    value: false,
  },
  parameters: {
    notes: 'My notes',
  },
};

export const Basic = ({
  value,
  ...args
}: React.ComponentProps<typeof Switch>) => {
  return (
    <StorybookStoryContainer>
      <StorybookSection>
        <Switch
          {...args}
          value={value}
          onValueChange={action('onValueChange')}
        />
      </StorybookSection>
      <StorybookSection title="Interactable">
        <Interactable />
      </StorybookSection>
    </StorybookStoryContainer>
  );
};

function Interactable() {
  const [isSwitchOn, setIsSwitchOn] = React.useState(false);
  return (
    <Switch
      value={isSwitchOn}
      onValueChange={() => setIsSwitchOn(!isSwitchOn)}
    />
  );
}
