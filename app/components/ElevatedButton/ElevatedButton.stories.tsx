import React, { useCallback, useEffect, useState } from 'react';
import { action } from '@storybook/addon-actions';
import StorybookStoryContainer from '@app/components/StorybookStoryContainer';
import StorybookSection from '@app/components/StorybookSection';

import ElevatedButton from './ElevatedButton';
import useColors from '@app/hooks/useColors';

export default {
  title: 'ElevatedButton',
  component: ElevatedButton,
  parameters: {
    notes: 'Default ElevatedButton',
  },
  args: {
    title: 'Scan',
    // color: 'yellow',
  },
  argTypes: {
    // color: {
    //   options: ['yellow', 'red', 'blue'],
    //   control: { type: 'select' },
    // },
  },
};

const BasicStory = (args: React.ComponentProps<typeof ElevatedButton>) => {
  const { sheetBackgroundColor, yellow2, red2, blue2 } = useColors();

  return (
    <StorybookStoryContainer style={{ backgroundColor: sheetBackgroundColor }}>
      <StorybookSection>
        <ElevatedButton
          {...args}
          onPress={action('onPress')}
          onLongPress={action('onLongPress')}
        />
      </StorybookSection>
      <StorybookSection title="Yellow">
        <ElevatedButton
          {...args}
          color={yellow2}
          onPress={action('onPress')}
          onLongPress={action('onLongPress')}
        />
      </StorybookSection>
      <StorybookSection title="Red">
        <ElevatedButton
          {...args}
          color={red2}
          onPress={action('onPress')}
          onLongPress={action('onLongPress')}
        />
      </StorybookSection>
      <StorybookSection title="Blue">
        <ElevatedButton
          {...args}
          color={blue2}
          onPress={action('onPress')}
          onLongPress={action('onLongPress')}
        />
      </StorybookSection>
    </StorybookStoryContainer>
  );
};

export const Basic = (args: React.ComponentProps<typeof ElevatedButton>) => (
  <BasicStory {...args} />
);

const DelayedReleaseStory = (
  args: React.ComponentProps<typeof ElevatedButton>,
) => {
  const { sheetBackgroundColor, yellow2, red2, blue2 } = useColors();
  const [down, setDown] = useState(false);
  useEffect(() => {
    if (!down) return;

    const timer = setTimeout(() => {
      setDown(false);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [down]);
  const handlePress = useCallback(() => {
    setDown(true);
  }, []);

  return (
    <StorybookStoryContainer style={{ backgroundColor: sheetBackgroundColor }}>
      <StorybookSection>
        <ElevatedButton
          {...args}
          color={red2}
          title="Write"
          down={down}
          loading={down}
          onPressIn={handlePress}
        />
      </StorybookSection>
    </StorybookStoryContainer>
  );
};

export const DelayedRelease = (
  args: React.ComponentProps<typeof ElevatedButton>,
) => <DelayedReleaseStory {...args} />;
