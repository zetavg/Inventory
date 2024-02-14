import React from 'react';

import StorybookSection from '@app/components/StorybookSection';
import StorybookStoryContainer from '@app/components/StorybookStoryContainer';
import Text from '@app/components/Text';

import TimeAgo from './TimeAgo';

export default {
  title: '[B] TimeAgo',
  component: TimeAgo,
  parameters: {
    notes: 'TimeAgo is a component for displaying relative time.',
  },
  args: {
    date: new Date().getTime(),
  },
  argTypes: {
    date: {
      control: {
        type: 'number',
        min: 0,
        max: new Date().getTime() * 2,
        step: 1,
      },
    },
  },
};

export const Basic = (args: React.ComponentProps<typeof TimeAgo>) => {
  if (typeof args.date === 'string') {
    args.date = parseInt(args.date, 10);
  }

  return (
    <StorybookStoryContainer>
      <StorybookSection>
        <Text>
          <TimeAgo {...args} />
        </Text>
      </StorybookSection>

      <StorybookSection title={'style="round"'}>
        <Text>
          <TimeAgo {...args} style="round" />
        </Text>
      </StorybookSection>

      <StorybookSection title={'style="round-minute"'}>
        <Text>
          <TimeAgo {...args} style="round-minute" />
        </Text>
      </StorybookSection>
    </StorybookStoryContainer>
  );
};
