import React, { useRef, useState } from 'react';
import { Linking } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import DeviceInfo from 'react-native-device-info';

import { useAppSelector } from '@app/redux';
import useOverallDBSyncStatus from '@app/features/db-sync/hooks/useOverallDBSyncStatus';
import { selectActiveProfileConfig } from '@app/features/profiles';
import { OnScannedItemPressFn } from '@app/features/rfid/RFIDSheet';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootBottomSheets } from '@app/navigation/RootBottomSheetsContext';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useColors from '@app/hooks/useColors';

import ScreenContent from '@app/components/ScreenContent';
import TableView from '@app/components/TableView';

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

  const { openRfidSheet, showRfidSheet, rfidSheet } = useRootBottomSheets();

  const [switchValue, setSwitchValue] = useState(false);
  const [overallDBSyncStatus] = useOverallDBSyncStatus();

  const onScannedItemPressRef = useRef<OnScannedItemPressFn | null>(null);
  const rfidSheetScanOptions = {
    functionality: 'scan' as const,
    onScannedItemPressRef,
    autoScroll: true,
    power: 12,
  };
  onScannedItemPressRef.current = (data, itemType, itemId) => {
    if (itemType === 'item' && itemId) {
      navigation.push('Item', {
        id: itemId,
        ...({ beforeRemove: () => openRfidSheet(rfidSheetScanOptions) } as any),
      });
      rfidSheet.current?.close();
    } else {
      navigation.push('GenericTextDetails', {
        details: JSON.stringify(data, null, 2),
        ...({ beforeRemove: () => openRfidSheet(rfidSheetScanOptions) } as any),
      });
      rfidSheet.current?.close();
    }
  };

  return (
    <ScreenContent
      navigation={navigation}
      title={DeviceInfo.getApplicationName()}
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
            label="Data Sync"
            detail={overallDBSyncStatus}
            icon="sync"
            iosImage="ios-menu.sync.png"
            onPress={() => navigation.push('PouchDBSync')}
          />
          <TableView.Item
            label="Travel Mode"
            icon="briefcase"
            iosImage="ios-menu.travel.png"
            switch
            switchValue={switchValue}
            onSwitchChangeValue={v => setSwitchValue(v)}
          />
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
            icon="bookmark-box-multiple"
            iosImage="ios-menu.collections.png"
            onPress={() => navigation.push('Collections')}
          >
            Collections
          </TableView.Item>
          <TableView.Item
            arrow
            icon="tag"
            iosImage="ios-menu.tag.png"
            onPress={() => navigation.push('Checklists')}
          >
            Tags
          </TableView.Item>
          <TableView.Item
            arrow
            icon="format-list-checks"
            iosImage="ios-menu.checklists.png"
            onPress={() => navigation.push('Checklists')}
          >
            Checklists
          </TableView.Item>
        </TableView.Section>
        <TableView.Section label="RFID Tools">
          <TableView.Item
            arrow
            icon="cellphone-wireless"
            iosImage="ios-menu.wireless-scan.png"
            onPress={() => openRfidSheet(rfidSheetScanOptions)}
          >
            Scan Tags
          </TableView.Item>
          <TableView.Item
            arrow
            icon="magnify-scan"
            iosImage="ios-menu.locate.png"
            onPress={() => openRfidSheet({ functionality: 'locate' })}
          >
            Locate Tag
          </TableView.Item>
          <TableView.Item
            arrow
            icon="note-search"
            iosImage="ios-menu.wireless-read.png"
            onPress={() => openRfidSheet({ functionality: 'read' })}
          >
            Read Tag
          </TableView.Item>
          <TableView.Item
            arrow
            icon="square-edit-outline"
            iosImage="ios-menu.wireless-write.png"
            onPress={() => openRfidSheet({ functionality: 'write' })}
          >
            Write Tag
          </TableView.Item>
        </TableView.Section>

        <TableView.Section label="Database">
          <TableView.Item
            arrow
            icon="database-import"
            iosImage="ios-menu.import.png"
            onPress={() => rootNavigation?.push('ImportItemsFromCsv')}
          >
            Import from CSV
          </TableView.Item>
          <TableView.Item
            arrow
            icon="database-export"
            iosImage="ios-menu.export.png"
            onPress={() => rootNavigation?.push('ExportItemsToCsv')}
          >
            Export to CSV
          </TableView.Item>
        </TableView.Section>
        <TableView.Section>
          <TableView.Item
            arrow
            icon="help-circle"
            iosImage="ios-menu.questionmark.png"
            onPress={() =>
              Linking.openURL('https://hackmd.io/@Inventory/resource-center')
            }
          >
            Resource Center
          </TableView.Item>
          <TableView.Item
            arrow
            icon="information"
            iosImage="ios-menu.info.png"
            onPress={() => navigation.push('About')}
          >
            {`About ${DeviceInfo.getApplicationName()} v${DeviceInfo.getVersion()}`}
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
