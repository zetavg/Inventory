import React, { useMemo } from 'react';
import type { StackScreenProps } from '@react-navigation/stack';

import useView from '@app/data/hooks/useView';

import humanFileSize from '@app/utils/humanFileSize';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

function DatabaseManagementScreen({
  navigation,
}: StackScreenProps<StackParamList, 'DatabaseManagement'>) {
  const rootNavigation = useRootNavigation();

  const { data: dbImagesSizeData } = useView('db_images_size');

  const dbImagesSize = useMemo(() => {
    if (!dbImagesSizeData) return null;
    if (typeof dbImagesSizeData !== 'object') return null;
    const rows = (dbImagesSizeData as any).rows;
    if (!Array.isArray(rows)) return null;
    if (!rows[0]) return null;
    if (typeof rows[0].value !== 'number') return null;
    return rows[0].value as number;
  }, [dbImagesSizeData]);

  return (
    <ScreenContent
      navigation={navigation}
      title="Database Management"
      headerLargeTitle={false}
    >
      <ScreenContent.ScrollView>
        <UIGroup.FirstGroupSpacing />
        <UIGroup>
          <UIGroup.ListItem
            label="Statics"
            navigable
            onPress={() => navigation.push('Statistics')}
          />
        </UIGroup>
        <UIGroup>
          <UIGroup.ListItem
            label="Images"
            navigable
            onPress={() => navigation.push('Images')}
            detail={
              typeof dbImagesSize === 'number'
                ? humanFileSize(dbImagesSize)
                : undefined
            }
          />
        </UIGroup>
        <UIGroup>
          <UIGroup.ListItem
            label="Fix Data Consistency"
            navigable
            onPress={() => rootNavigation?.push('FixDataConsistency')}
          />
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}
export default DatabaseManagementScreen;
