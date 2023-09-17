import React, { useCallback } from 'react';
import { Alert, Linking, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import DeviceInfo from 'react-native-device-info';
import GitInfo from 'react-git-info/macro';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import ScreenContent from '@app/components/ScreenContent';
import TableView from '@app/components/TableView';

function AboutScreen({
  navigation,
}: StackScreenProps<StackParamList, 'About'>) {
  const gitInfo = GitInfo();
  const rootNavigation = useRootNavigation();

  let gitInfoStr = gitInfo.commit.shortHash;
  if (
    gitInfo.branch &&
    gitInfo.branch !== 'master' &&
    gitInfo.branch !== 'main'
  ) {
    gitInfoStr += ` (${gitInfo.branch})`;
  }

  let manufacturerInfoStr = DeviceInfo.getManufacturerSync();
  const deviceBrand = DeviceInfo.getBrand();
  if (manufacturerInfoStr !== deviceBrand) {
    manufacturerInfoStr += ` / ${deviceBrand}`;
  }

  const dispatch = useAppDispatch();
  const showDevTools = useAppSelector(selectors.devTools.showDevTools);
  const [pressToBecomeDeveloperCounter, setPressToBecomeDeveloperCounter] =
    React.useState(0);
  const pressToBecomeDeveloperThreshold = 12;
  const handleBecomeDeveloperPress = React.useCallback(() => {
    setPressToBecomeDeveloperCounter(n =>
      n >= pressToBecomeDeveloperThreshold
        ? pressToBecomeDeveloperThreshold
        : n + 1,
    );
  }, [pressToBecomeDeveloperThreshold]);
  let pressToBecomeDeveloperMessage;

  if (pressToBecomeDeveloperCounter >= pressToBecomeDeveloperThreshold) {
    pressToBecomeDeveloperMessage = 'You are now a developer.';
  } else if (
    pressToBecomeDeveloperCounter >
    pressToBecomeDeveloperThreshold / 2
  ) {
    pressToBecomeDeveloperMessage = `You are ${
      pressToBecomeDeveloperThreshold - pressToBecomeDeveloperCounter
    } steps away from becoming a developer.`;
  }

  React.useEffect(() => {
    if (pressToBecomeDeveloperCounter >= pressToBecomeDeveloperThreshold) {
      dispatch(actions.devTools.showDevTools());
    }
  }, [dispatch, pressToBecomeDeveloperCounter]);

  return (
    <ScreenContent
      navigation={navigation}
      title="About"
      headerLargeTitle={false}
    >
      <TableView style={commonStyles.flex1}>
        <TableView.Section
          label={DeviceInfo.getApplicationName()}
          footerLabel={pressToBecomeDeveloperMessage}
        >
          <TableView.Item
            onPress={showDevTools ? undefined : handleBecomeDeveloperPress}
            detail={`${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`}
            // detail={DeviceInfo.getVersion()}
          >
            App Version
          </TableView.Item>
          <TableView.Item detail={gitInfoStr}>Code Version</TableView.Item>
          <TableView.Item
            arrow
            detail="zetavg/Inventory"
            onPress={() =>
              Linking.openURL('https://github.com/zetavg/Inventory')
            }
          >
            GitHub
          </TableView.Item>
        </TableView.Section>
        <TableView.Section>
          <TableView.Item onPress={undefined} detail={DeviceInfo.getBundleId()}>
            Bundle ID
          </TableView.Item>
        </TableView.Section>

        <TableView.Section label="Device">
          <TableView.Item
            onPress={undefined}
            detail={DeviceInfo.getDeviceType()}
          >
            Type
          </TableView.Item>
          <TableView.Item onPress={undefined} detail={manufacturerInfoStr}>
            Manufacturer
          </TableView.Item>
          <TableView.Item onPress={undefined} detail={DeviceInfo.getModel()}>
            Model
          </TableView.Item>
          <TableView.Item
            onPress={undefined}
            detail={`${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}`}
          >
            OS
          </TableView.Item>
        </TableView.Section>

        <TableView.Section>
          <TableView.Item arrow onPress={() => navigation.push('Statistics')}>
            Statistics
          </TableView.Item>
        </TableView.Section>
      </TableView>
    </ScreenContent>
  );
}

export default AboutScreen;
