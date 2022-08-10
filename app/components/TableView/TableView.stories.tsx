import React, { useState } from 'react';
import { View } from 'react-native';
import { action } from '@storybook/addon-actions';

import TableView from './TableView';
import useColors from '@app/hooks/useColors';
import commonStyles from '@app/utils/commonStyles';

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
          <TableView.Item arrow>Item with arrow</TableView.Item>
          <TableView.Item selected>Item selected</TableView.Item>
          <TableView.Item detail="Detail">Item with detail</TableView.Item>
          <TableView.Item arrow detail="Detail">
            Item with detail and arrow
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

        <TableView.Section label="Item with image">
          <TableView.Item arrow iosImage="ios-menu.person.png">
            Profile
          </TableView.Item>
          <TableView.Item arrow iosImage="ios-menu.travel.png">
            Travel Mode
          </TableView.Item>
          <TableView.Item arrow iosImage="ios-menu.site.png">
            Sites
          </TableView.Item>
          <TableView.Item arrow iosImage="ios-menu.tag.png">
            Tags
          </TableView.Item>
        </TableView.Section>
        <TableView.Section>
          <TableView.Item arrow iosImage="ios-menu.wireless-scan.png">
            Scan Tags
          </TableView.Item>
          <TableView.Item arrow iosImage="ios-menu.locate.png">
            Locate Tag
          </TableView.Item>
          <TableView.Item arrow iosImage="ios-menu.wireless-read.png">
            Read Tag
          </TableView.Item>
          <TableView.Item arrow iosImage="ios-menu.wireless-write.png">
            Write Tag
          </TableView.Item>
        </TableView.Section>
        <TableView.Section>
          <TableView.Item arrow iosImage="ios-menu.import.png">
            Import
          </TableView.Item>
          <TableView.Item arrow iosImage="ios-menu.export.png">
            Export
          </TableView.Item>
        </TableView.Section>
        <TableView.Section>
          <TableView.Item arrow iosImage="ios-menu.tools.png">
            Tools
          </TableView.Item>
          <TableView.Item arrow iosImage="ios-menu.developer.png">
            Developer Tools
          </TableView.Item>
        </TableView.Section>
      </TableView>
    </View>
  );
}

export const Defalut = ({}: React.ComponentProps<typeof TableView>) => {
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
