import React from 'react';
import { ScrollView, View } from 'react-native';

import Button from '@app/components/Button';
import Text from '@app/components/Text';

import {
  Basic as BasicComponent,
  WithListItems as WithListItemsComponent,
} from './examples';

export default {
  title: '[A] UIGroup',
  component: View,
};

export const Basic = () => <BasicComponent />;
export const WithListItems = () => <WithListItemsComponent />;
