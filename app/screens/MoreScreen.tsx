import React, { useState } from 'react';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import { useRootBottomSheets } from '@app/navigation/RootBottomSheetsContext';

import useColors from '@app/hooks/useColors';
import commonStyles from '@app/utils/commonStyles';
import ScreenContent from '@app/components/ScreenContent';
import TableView from '@app/components/TableView';

import { useAppSelector } from '@app/redux';
import { selectActiveProfileConfig } from '@app/features/profiles';

function MoreScreen({ navigation }: StackScreenProps<StackParamList, 'More'>) {
  const rootNavigation = useRootNavigation();
  const colors = useColors();

  const { color: profileColor } =
    useAppSelector(selectActiveProfileConfig) || {};

  const profileColorHex = (() => {
    switch (profileColor) {
      case 'red':
        return colors.red;
      case 'orange':
        return colors.orange;
      case 'yellow':
        return colors.yellow;
      case 'green':
        return colors.green;
      case 'teal':
        return colors.teal;
      case 'blue':
        return colors.blue;
      case 'indigo':
        return colors.indigo;
      case 'purple':
        return colors.purple;
      case 'pink':
        return colors.pink;
      default:
        return colors.blue;
    }
  })();

  const { rfidScanSheet } = useRootBottomSheets();

  const [switchValue, setSwitchValue] = useState(false);

  return (
    <ScreenContent
      navigation={navigation}
      title="Inventory"
      action1Label="Profile"
      action1SFSymbolName="person.circle.fill"
      action1MaterialIconName="account-circle"
      onAction1Press={() => rootNavigation?.push('SwitchProfile')}
      action1Color={profileColorHex}
    >
      <TableView style={commonStyles.flex1}>
        <TableView.Section>
          <TableView.Item
            arrow
            label="Settings"
            icon="cog"
            iosImage="ios-menu.settings.png"
            onPress={() => navigation.push('Settings')}
          />
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
        <TableView.Section label="RFID Tools">
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

        <TableView.Section label="Database">
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
            icon="hammer"
            iosImage="ios-menu.developer.png"
            onPress={() => navigation.push('DeveloperTools')}
          >
            Developer Tools
          </TableView.Item>
        </TableView.Section>
      </TableView>
    </ScreenContent>
  );
}
export default MoreScreen;
