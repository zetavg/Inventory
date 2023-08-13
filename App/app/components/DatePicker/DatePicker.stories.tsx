import React from 'react';
import { Alert } from 'react-native';

import StorybookSection from '@app/components/StorybookSection';
import StorybookStoryContainer from '@app/components/StorybookStoryContainer';

import DatePicker from './DatePicker';

export default {
  title: '[B] DatePicker',
  component: DatePicker,
};

export const Basic = () => (
  <StorybookStoryContainer>
    <StorybookSection>
      <DatePicker
        value={{ y: 2023, m: 1, d: 1 }}
        onChangeValue={dateObj =>
          Alert.alert('Date Picked', JSON.stringify(dateObj))
        }
      />
    </StorybookSection>
  </StorybookStoryContainer>
);
