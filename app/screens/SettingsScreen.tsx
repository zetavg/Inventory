import React, { useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import { useSetStorybookModeFunction } from '@app/StorybookUIRoot';

import useTabBarInsets from '@app/hooks/useTabBarInsets';
import useColors from '@app/hooks/useColors';
import { useRootBottomSheets } from '@app/navigation/RootBottomSheetsContext';
import Appbar from '@app/components/Appbar';
import TableView from '@app/components/TableView';
import commonStyles from '@app/utils/commonStyles';

function SettingsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'DemoHome'>) {
  const rootNavigation = useRootNavigation();
  const setStorybookMode = useSetStorybookModeFunction();

  const safeAreaInsets = useSafeAreaInsets();
  const tabBarInsets = useTabBarInsets();

  const { backgroundColor } = useColors();

  const { rfidScanSheet } = useRootBottomSheets();

  const [switchValue, setSwitchValue] = useState(false);
  const [switchValue2, setSwitchValue2] = useState(false);
  const [selectedValue, setSelectedValue] = useState(0);

  return (
    <>
      <Appbar title="Settings" navigation={navigation} />
      <TableView
        style={[commonStyles.flex1, { backgroundColor }]}
        contentInsets={{ bottom: tabBarInsets.scrollViewBottom }}
        scrollIndicatorInsets={{ bottom: tabBarInsets.scrollViewBottom }}
      >
        <TableView.Section>
          <TableView.Item
            icon="cog"
            label="Settings"
            arrow
            onPress={() => navigation.push('Settings')}
          />
          <TableView.Item
            icon="cog"
            label="Sync"
            arrow
            onPress={() => navigation.push('DBSyncConfig')}
          />
        </TableView.Section>

        <TableView.Section>
          <TableView.Item
            arrow
            icon="account-box"
            iosImage="ios-menu.person.png"
            onPress={() => rootNavigation?.navigate('SampleModal', {})}
          >
            Profile
          </TableView.Item>
          <TableView.Item
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
            onPress={() => navigation.push('Settings')}
          >
            Locations
          </TableView.Item>
          <TableView.Item
            arrow
            icon="tag"
            iosImage="ios-menu.tag.png"
            onPress={() => navigation.push('Settings')}
          >
            Tags
          </TableView.Item>
        </TableView.Section>
        <TableView.Section>
          <TableView.Item
            arrow
            icon="cellphone-wireless"
            iosImage="ios-menu.wireless-scan.png"
            onPress={() => rfidScanSheet.current?.present()}
          >
            Scan Tags
          </TableView.Item>
          <TableView.Item
            arrow
            icon="magnify-scan"
            iosImage="ios-menu.locate.png"
            onPress={() => rfidScanSheet.current?.present()}
          >
            Locate Tag
          </TableView.Item>
          <TableView.Item
            arrow
            icon="note-search"
            iosImage="ios-menu.wireless-read.png"
            onPress={() => rfidScanSheet.current?.present()}
          >
            Read Tag
          </TableView.Item>
          <TableView.Item
            arrow
            icon="square-edit-outline"
            iosImage="ios-menu.wireless-write.png"
            onPress={() => rfidScanSheet.current?.present()}
          >
            Write Tag
          </TableView.Item>
        </TableView.Section>

        <TableView.Section label="Developer Tools">
          <TableView.Item
            label="PouchDB"
            arrow
            onPress={() => navigation.push('PouchDB')}
          />
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
          <TableView.Item
            arrow
            icon="hammer"
            iosImage="ios-menu.developer.png"
            onPress={() => navigation.push('DeveloperTools')}
          >
            Developer Tools
          </TableView.Item>
        </TableView.Section>

        <TableView.Section
          label="Section 2"
          footerLabel="This is footer label."
        >
          <TableView.Item onPress={() => {}} arrow>
            Item with arrow
          </TableView.Item>
          <TableView.Item onPress={() => {}} selected>
            Item selected
          </TableView.Item>
          <TableView.Item onPress={() => {}} detail="Detail">
            Item with detail
          </TableView.Item>
          <TableView.Item onPress={() => {}} arrow detail="Detail">
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
      </TableView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SettingsScreen;
