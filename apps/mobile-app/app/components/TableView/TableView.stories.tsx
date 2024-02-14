import React, { useState } from 'react';
import { View } from 'react-native';

import { action } from '@storybook/addon-actions';

import commonStyles from '@app/utils/commonStyles';

import useColors from '@app/hooks/useColors';

import TableView from './TableView';

export default {
  title: 'TableView',
  component: TableView,
  args: {
    // iosStyle: 'inset-grouped',
  },
  argTypes: {
    // iosStyle: {
    //   options: ['', 'plain', 'grouped', 'inset-grouped'],
    //   control: { type: 'select' },
    // },
  },
};

function DemoComponent({
  iosStyle,
}: Pick<React.ComponentProps<typeof TableView>, 'iosStyle'>) {
  const { backgroundColor } = useColors();
  const [switchValue, setSwitchValue] = useState(false);
  const [switchValue2, setSwitchValue2] = useState(true);
  const [selectedValue, setSelectedValue] = useState(0);

  return (
    <View style={[commonStyles.flex1, { backgroundColor }]}>
      <TableView style={commonStyles.flex1} iosStyle={iosStyle}>
        <TableView.Section label="Section">
          <TableView.Item onPress={action('Item onPress')}>
            Item 1
          </TableView.Item>
          <TableView.Item onPress={action('Item onPress')}>
            Item 2
          </TableView.Item>
          <TableView.Item onPress={action('Item onPress')}>
            Item 3
          </TableView.Item>
          <TableView.Item onPress={action('Item onPress')}>
            Item 4
          </TableView.Item>
        </TableView.Section>

        <TableView.Section
          label="Section 2"
          footerLabel="This is footer label."
        >
          <TableView.Item onPress={action('Item onPress')} arrow>
            Item with arrow
          </TableView.Item>
          <TableView.Item onPress={action('Item onPress')} selected>
            Item selected
          </TableView.Item>
          <TableView.Item onPress={action('Item onPress')} detail="Detail">
            Item with detail
          </TableView.Item>
          <TableView.Item
            onPress={action('Item onPress')}
            arrow
            detail="Detail"
          >
            Item with detail and arrow
          </TableView.Item>
          <TableView.Item arrow>Item without OnPress</TableView.Item>
          <TableView.Item arrow detail="Detail">
            Item without OnPress with Detail
          </TableView.Item>
          <TableView.Item
            switch
            switchValue={switchValue}
            onSwitchChangeValue={v => setSwitchValue(v)}
          >
            Item with switch
          </TableView.Item>
          <TableView.Item
            switch
            switchValue={switchValue2}
            onSwitchChangeValue={v => setSwitchValue2(v)}
          >
            Item with switch 2
          </TableView.Item>
          <TableView.Item
            switch
            switchValue={switchValue}
            onPress={() => setSwitchValue(v => !v)}
            onSwitchChangeValue={v => setSwitchValue(v)}
          >
            Item with switch with onPress
          </TableView.Item>
          <TableView.Item
            switch
            switchValue={switchValue2}
            onPress={() => setSwitchValue2(v => !v)}
            onSwitchChangeValue={v => setSwitchValue2(v)}
          >
            Item with switch 2
          </TableView.Item>
        </TableView.Section>

        <TableView.Section label="Select">
          <TableView.Item
            onPress={() => setSelectedValue(0)}
            selected={selectedValue === 0}
          >
            Option 1
          </TableView.Item>
          <TableView.Item
            onPress={() => setSelectedValue(1)}
            selected={selectedValue === 1}
          >
            Option 2
          </TableView.Item>
          <TableView.Item
            onPress={() => setSelectedValue(2)}
            selected={selectedValue === 2}
          >
            Option 3
          </TableView.Item>
          <TableView.Item
            onPress={() => setSelectedValue(3)}
            selected={selectedValue === 3}
          >
            Option 4
          </TableView.Item>
        </TableView.Section>

        <TableView.Section label="Item with image or icon">
          <TableView.Item
            arrow
            icon="account-box"
            iosImage="ios-menu.person.png"
            onPress={action('Item onPress')}
          >
            Profile
          </TableView.Item>
          <TableView.Item
            arrow
            icon="briefcase"
            iosImage="ios-menu.travel.png"
            switch
            switchValue={switchValue}
            onSwitchChangeValue={v => setSwitchValue(v)}
          >
            Travel Mode
          </TableView.Item>
          <TableView.Item
            arrow
            icon="domain"
            iosImage="ios-menu.site.png"
            onPress={action('Item onPress')}
          >
            Locations
          </TableView.Item>
          <TableView.Item
            arrow
            icon="tag"
            iosImage="ios-menu.tag.png"
            onPress={action('Item onPress')}
          >
            Tags
          </TableView.Item>
        </TableView.Section>
        <TableView.Section>
          <TableView.Item
            arrow
            icon="cellphone-wireless"
            iosImage="ios-menu.wireless-scan.png"
            onPress={action('Item onPress')}
          >
            Scan Tags
          </TableView.Item>
          <TableView.Item
            arrow
            icon="magnify-scan"
            iosImage="ios-menu.locate.png"
            onPress={action('Item onPress')}
          >
            Locate Tag
          </TableView.Item>
          <TableView.Item
            arrow
            icon="note-search"
            iosImage="ios-menu.wireless-read.png"
            onPress={action('Item onPress')}
          >
            Read Tag
          </TableView.Item>
          <TableView.Item
            arrow
            icon="square-edit-outline"
            iosImage="ios-menu.wireless-write.png"
            onPress={action('Item onPress')}
          >
            Write Tag
          </TableView.Item>
        </TableView.Section>
        <TableView.Section>
          <TableView.Item
            arrow
            icon="database-import"
            iosImage="ios-menu.import.png"
          >
            Import
          </TableView.Item>
          <TableView.Item
            arrow
            icon="database-export"
            iosImage="ios-menu.export.png"
          >
            Export
          </TableView.Item>
        </TableView.Section>
        <TableView.Section>
          <TableView.Item
            arrow
            icon="hammer-screwdriver"
            iosImage="ios-menu.tools.png"
          >
            Tools
          </TableView.Item>
          <TableView.Item arrow icon="hammer" iosImage="ios-menu.developer.png">
            Developer Tools
          </TableView.Item>
        </TableView.Section>
      </TableView>
    </View>
  );
}

export const Default = ({}: React.ComponentProps<typeof TableView>) => {
  return <DemoComponent />;
};

export const PlainIOS = ({}: React.ComponentProps<typeof TableView>) => {
  return <DemoComponent iosStyle="plain" />;
};

export const GroupedIOS = ({}: React.ComponentProps<typeof TableView>) => {
  return <DemoComponent iosStyle="grouped" />;
};

export const InsetGroupedIOS = ({}: React.ComponentProps<typeof TableView>) => {
  return <DemoComponent iosStyle="inset-grouped" />;
};
