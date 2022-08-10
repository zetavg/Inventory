import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import { useSetStorybookModeFunction } from '@app/StorybookUIRoot';

import useTabBarInsets from '@app/hooks/useTabBarInsets';
import useColors from '@app/hooks/useColors';
import { useRootBottomSheets } from '@app/navigation/RootBottomSheetsContext';
import TableView from '@app/components/TableView';
import commonStyles from '@app/utils/commonStyles';

function SettingsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'DemoHome'>) {
  const rootNavigation = useRootNavigation();
  const setStorybookMode = useSetStorybookModeFunction();

  const tabBarInsets = useTabBarInsets();

  const { backgroundColor } = useColors();

  const { rfidScanSheet } = useRootBottomSheets();

  const [switchValue, setSwitchValue] = useState(false);
  const [switchValue2, setSwitchValue2] = useState(false);

  return (
    <TableView
      style={[commonStyles.flex1, { backgroundColor }]}
      contentInsets={{ bottom: tabBarInsets.scrollViewBottom }}
      scrollIndicatorInsets={{ bottom: tabBarInsets.scrollViewBottom }}
    >
      <TableView.Section>
        <TableView.Item
          label="Settings"
          arrow
          onPress={() => navigation.push('Settings')}
        />
      </TableView.Section>

      <TableView.Section>
        <TableView.Item
          arrow
          iosImage="ios-menu.person.png"
          onPress={() => rootNavigation?.navigate('DemoModal')}
        >
          Profile
        </TableView.Item>
        <TableView.Item
          iosImage="ios-menu.travel.png"
          switch
          switchValue={switchValue}
          onSwitchChangeValue={v => setSwitchValue(v)}
        >
          Travel Mode
        </TableView.Item>
        <TableView.Item
          arrow
          iosImage="ios-menu.site.png"
          onPress={() => navigation.push('Settings')}
        >
          Sites
        </TableView.Item>
        <TableView.Item
          arrow
          iosImage="ios-menu.tag.png"
          onPress={() => navigation.push('Settings')}
        >
          Tags
        </TableView.Item>
      </TableView.Section>
      <TableView.Section>
        <TableView.Item
          arrow
          iosImage="ios-menu.wireless-scan.png"
          onPress={() => rfidScanSheet.current?.present()}
        >
          Scan Tags
        </TableView.Item>
        <TableView.Item
          arrow
          iosImage="ios-menu.locate.png"
          onPress={() => rfidScanSheet.current?.present()}
        >
          Locate Tag
        </TableView.Item>
        <TableView.Item
          arrow
          iosImage="ios-menu.wireless-read.png"
          onPress={() => rfidScanSheet.current?.present()}
        >
          Read Tag
        </TableView.Item>
        <TableView.Item
          arrow
          iosImage="ios-menu.wireless-write.png"
          onPress={() => rfidScanSheet.current?.present()}
        >
          Write Tag
        </TableView.Item>
      </TableView.Section>

      <TableView.Section label="Developer Tools">
        <TableView.Item
          label="Storybook"
          arrow
          onPress={() => navigation.push('Storybook')}
        />
        <TableView.Item
          label="Enter Storybook mode"
          onPress={() => setStorybookMode && setStorybookMode(true)}
        />
        <TableView.Item
          label="React Native New App Screen"
          arrow
          onPress={() => navigation.push('NewAppScreen')}
        />
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

      <TableView.Section label="Section 2" footerLabel="This is footer label.">
        <TableView.Item arrow>Item with arrow</TableView.Item>
        <TableView.Item selected>Item selected</TableView.Item>
        <TableView.Item detail="Detail">Item with detail</TableView.Item>
        <TableView.Item arrow detail="Detail">
          Item with detail and arrow
        </TableView.Item>
        <TableView.Item
          switch
          switchValue={switchValue}
          onPress={() => setSwitchValue(v => !v)}
          onSwitchChangeValue={v => setSwitchValue(v)}
        >
          Item with switch
        </TableView.Item>
        <TableView.Item
          switch
          switchValue={switchValue2}
          onPress={() => setSwitchValue2(v => !v)}
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
          Item with switch
        </TableView.Item>
      </TableView.Section>
    </TableView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SettingsScreen;
