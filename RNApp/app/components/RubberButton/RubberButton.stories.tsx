import React from 'react';
import { action } from '@storybook/addon-actions';
import StorybookStoryContainer from '@app/components/StorybookStoryContainer';
import StorybookSection from '@app/components/StorybookSection';
import commonStyles from '@app/utils/commonStyles';

import RubberButton, { useBackgroundColor } from './RubberButton';

export default {
  title: 'RubberButton',
  component: RubberButton,
  parameters: {
    notes: 'Default RubberButton',
  },
  args: {
    title: 'Scan',
    color: 'yellow',
  },
  argTypes: {
    color: {
      options: ['yellow', 'red', 'blue'],
      control: { type: 'select' },
    },
  },
};

const BasicStory = (args: React.ComponentProps<typeof RubberButton>) => {
  const backgroundColor = useBackgroundColor(args.color);

  return (
    <StorybookStoryContainer
      style={{ backgroundColor, justifyContent: 'flex-end' }}
    >
      <StorybookSection
        style={[commonStyles.mt24, commonStyles.centerChildren]}
      >
        <RubberButton
          {...args}
          onPress={action('onPress')}
          onLongPress={action('onLongPress')}
        />
      </StorybookSection>
    </StorybookStoryContainer>
  );
};

export const Basic = (args: React.ComponentProps<typeof RubberButton>) => (
  <BasicStory {...args} />
);
