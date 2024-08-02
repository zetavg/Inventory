import React from 'react';
// import { action } from '@storybook/addon-actions';
import StorybookStoryContainer from '@app/components/StorybookStoryContainer';
import StorybookSection from '@app/components/StorybookSection';

import TextInput from './TextInput';

export default {
  title: 'TextInput',
  component: TextInput,
  // args: {
  //   disabled: false,
  //   value: false,
  // },
  // parameters: {
  //   notes: 'My notes',
  // },
};

export const Basic = ({}: React.ComponentProps<typeof TextInput>) => {
  return (
    <StorybookStoryContainer>
      <StorybookSection>
        <TextInput
          mode="outlined"
          label="Outlined input"
          placeholder="Type something"
          right={<TextInput.Affix text="/100" />}
        />
      </StorybookSection>
    </StorybookStoryContainer>
  );
};
