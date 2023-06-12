import React, { useCallback } from 'react';
import { Alert, ScrollView } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import GitInfo from 'react-git-info/macro';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import commonStyles from '@app/utils/commonStyles';
import ScreenContent from '@app/components/ScreenContent';
import TableView from '@app/components/TableView';

function AboutScreen({
  navigation,
}: StackScreenProps<StackParamList, 'About'>) {
  const gitInfo = GitInfo();
  const rootNavigation = useRootNavigation();

  let gitInfoStr = gitInfo.commit.shortHash;
  if (gitInfo.branch !== 'master' && gitInfo.branch !== 'main') {
    gitInfoStr += ` (${gitInfo.branch})`;
  }

  return (
    <ScreenContent
      navigation={navigation}
      title="About"
      headerLargeTitle={false}
    >
      <TableView style={commonStyles.flex1}>
        <TableView.Section>
          <TableView.Item
            onPress={undefined}
            // detail={`${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`}
            detail={DeviceInfo.getVersion()}
          >
            App Version
          </TableView.Item>
          <TableView.Item onPress={undefined} detail={gitInfoStr}>
            Code Version
          </TableView.Item>
        </TableView.Section>
      </TableView>
    </ScreenContent>
  );
}

export default AboutScreen;
