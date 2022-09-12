import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { action } from '@storybook/addon-actions';

import EditingListView from './EditingListView';
import useColors from '@app/hooks/useColors';
import commonStyles from '@app/utils/commonStyles';

export default {
  title: 'EditingListView',
  component: EditingListView,
  args: {
    editing: true,
    canMove: true,
    canDelete: true,
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
        onItemMove={action('onItemMove')}
        onItemDelete={action('onItemDelete')}
        style={commonStyles.flex1}
        contentInset={{ top: 8 }}
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

export const Defalut = (
  props: React.ComponentProps<typeof EditingListView>,
) => {
  return <DemoComponent {...props} />;
};
