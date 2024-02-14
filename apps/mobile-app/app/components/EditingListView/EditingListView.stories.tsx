import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { action } from '@storybook/addon-actions';

import commonStyles from '@app/utils/commonStyles';

import useColors from '@app/hooks/useColors';

import EditingListView from './EditingListView';

export default {
  title: 'EditingListView',
  component: EditingListView,
  args: {
    editing: true,
    // canMove: true,
    // canDelete: true,
  },
  argTypes: {
    // iosStyle: {
    //   options: ['', 'plain', 'grouped', 'inset-grouped'],
    //   control: { type: 'select' },
    // },
  },
};

function DemoComponent(props: React.ComponentProps<typeof EditingListView>) {
  const { backgroundColor } = useColors();

  return (
    <View style={[commonStyles.flex1, { backgroundColor }]}>
      <EditingListView
        {...props}
        onItemMove={({ from, to }) =>
          Alert.alert('Item Move', `From ${from} to ${to}.`)
        }
        onItemDelete={index => Alert.alert('Item Delete', `${index}.`)}
      >
        <EditingListView.Item label="Item A" />
        <EditingListView.Item label="Item B" />
        <EditingListView.Item label="Item C" />
        <EditingListView.Item label="Item D" />
        <EditingListView.Item label="Item E" />
        <EditingListView.Item label="Item F" />
        <EditingListView.Item label="Item G" />
      </EditingListView>
    </View>
  );
}

export const CanMove = (
  props: React.ComponentProps<typeof EditingListView>,
) => {
  return <DemoComponent {...props} canMove />;
};

export const CanDelete = (
  props: React.ComponentProps<typeof EditingListView>,
) => {
  return <DemoComponent {...props} canDelete />;
};

export const CanMoveAndDelete = (
  props: React.ComponentProps<typeof EditingListView>,
) => {
  return <DemoComponent {...props} canMove canDelete />;
};
