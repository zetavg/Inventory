import React from 'react';
import { action } from '@storybook/addon-actions';
import StorybookStoryContainer from '@app/components/StorybookStoryContainer';
import StorybookSection from '@app/components/StorybookSection';

import Text from './Text';
import { ScrollView, useWindowDimensions } from 'react-native';

export default {
  title: 'Text',
  component: Text,
  parameters: {
    notes: 'Text',
  },
  args: {
    children: 'Hello world',
    'style.fontSize': 18,
    variant: undefined,
  },
  argTypes: {
    variant: {
      options: [
        undefined,
        'displayLarge',
        'displayMedium',
        'displaySmall',
        'headlineLarge',
        'headlineMedium',
        'headlineSmall',
        'titleLarge',
        'titleMedium',
        'titleSmall',
        'labelLarge',
        'labelMedium',
        'labelSmall',
        'bodyLarge',
        'bodyMedium',
        'bodySmall',
      ],
      control: { type: 'select' },
    },
    'style.fontSize': {
      control: { type: 'number' },
    },
  },
};

function Demo({
  args,
  fontSize: rawFontSize,
}: {
  args: React.ComponentProps<typeof Text>;
  fontSize?: number | string;
}) {
  const { fontScale } = useWindowDimensions();
  let fontSize = rawFontSize;

  if (typeof fontSize !== 'number') {
    fontSize = parseFloat(fontSize || '');
  }

  if (isNaN(fontSize)) {
    fontSize = undefined;
  }

  return (
    <ScrollView>
      <StorybookStoryContainer>
        <StorybookSection title={`System font scale: ${fontScale}`}>
          <Text {...args} />
        </StorybookSection>
        <StorybookSection title={`Font size: ${fontSize} (× ${fontScale})`}>
          <Text {...args} style={{ fontSize: fontSize }} />
        </StorybookSection>
        <StorybookSection title="displayLarge">
          <Text {...args} variant="displayLarge" />
        </StorybookSection>
        <StorybookSection title="displayMedium">
          <Text {...args} variant="displayMedium" />
        </StorybookSection>
        <StorybookSection title="displaySmall">
          <Text {...args} variant="displaySmall" />
        </StorybookSection>

        <StorybookSection title="headlineLarge">
          <Text {...args} variant="headlineLarge" />
        </StorybookSection>
        <StorybookSection title="headlineMedium">
          <Text {...args} variant="headlineMedium" />
        </StorybookSection>
        <StorybookSection title="headlineSmall">
          <Text {...args} variant="headlineSmall" />
        </StorybookSection>

        <StorybookSection title="titleLarge">
          <Text {...args} variant="titleLarge" />
        </StorybookSection>
        <StorybookSection title="titleMedium">
          <Text {...args} variant="titleMedium" />
        </StorybookSection>
        <StorybookSection title="titleSmall">
          <Text {...args} variant="titleSmall" />
        </StorybookSection>

        <StorybookSection title="bodyLarge">
          <Text {...args} variant="bodyLarge" />
        </StorybookSection>
        <StorybookSection title="bodyMedium">
          <Text {...args} variant="bodyMedium" />
        </StorybookSection>
        <StorybookSection title="bodySmall">
          <Text {...args} variant="bodySmall" />
        </StorybookSection>

        <StorybookSection title="labelLarge">
          <Text {...args} variant="labelLarge" />
        </StorybookSection>
        <StorybookSection title="labelMedium">
          <Text {...args} variant="labelMedium" />
        </StorybookSection>
        <StorybookSection title="labelSmall">
          <Text {...args} variant="labelSmall" />
        </StorybookSection>
      </StorybookStoryContainer>
    </ScrollView>
  );
}

export const Basic = ({
  'style.fontSize': fontSize,
  ...args
}: React.ComponentProps<typeof Text> & {
  'style.fontSize': number | string;
}) => <Demo args={args} fontSize={fontSize} />;
