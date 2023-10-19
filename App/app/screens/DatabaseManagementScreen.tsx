import React, { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import RNFS from 'react-native-fs';
import { QuickSQLite } from 'react-native-quick-sqlite';

import { VIEWS_PREFIX } from '@deps/data-storage-couchdb/views';

import { selectors, useAppSelector } from '@app/redux';

import useView from '@app/data/hooks/useView';

import { useDB } from '@app/db';
import { getCurrentAppDB } from '@app/db/app_db';

import humanFileSize from '@app/utils/humanFileSize';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useLogger from '@app/hooks/useLogger';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

function DatabaseManagementScreen({
  navigation,
}: StackScreenProps<StackParamList, 'DatabaseManagement'>) {
  const rootNavigation = useRootNavigation();

  const logger = useLogger('DatabaseManagementScreen');
  const { db } = useDB();
  const dbName = useAppSelector(selectors.profiles.currentDbName);

  const { data: dbImagesSize } = useView('db_images_size');

  const [isResettingDBIndexes, setIsResettingDBIndexes] = useState(false);
  const handleResetDBIndexes = useCallback(() => {
    if (!db) return;

    Alert.alert(
      'Reset DB Indexes',
      'Are you sure you want to reset the DB index now? Non of your data will be removed, but it may take some time to rebuild the necessary index on your first view on some of the pages in the app.',
      [
        {
          text: 'No',
          style: 'cancel',
          isPreferred: false,
          onPress: () => {},
        },
        {
          text: 'Yes',
          style: 'destructive',
          isPreferred: true,
          onPress: async () => {
            setIsResettingDBIndexes(true);

            try {
              const autoIndexDocs = await db.allDocs({
                startkey: '_design/auto_',
                endkey: '_design/auto_\ufff0',
              });

              for (const row of autoIndexDocs.rows) {
                const id = row.id;
                if (!id.startsWith('_design/auto_')) {
                  continue;
                }
                const rev = row.value.rev;
                await db.put({
                  _id: id,
                  _rev: rev,
                  _deleted: true,
                });
              }
              const appViewsDocs = await db.allDocs({
                startkey: `_design/${VIEWS_PREFIX}`,
                endkey: `_design/${VIEWS_PREFIX}\ufff0`,
              });

              for (const row of appViewsDocs.rows) {
                const id = row.id;
                if (!id.startsWith(`_design/${VIEWS_PREFIX}`)) {
                  continue;
                }
                const rev = row.value.rev;
                await db.put({
                  _id: id,
                  _rev: rev,
                  _deleted: true,
                });
              }

              const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
              const dbViewFiles = files.filter(file =>
                file.name.startsWith(`${dbName}-mrview-`),
              );

              for (const file of dbViewFiles) {
                // QuickSQLite.delete(file.name);
                await RNFS.unlink(file.path);
              }

              await getCurrentAppDB({ forceReload: true });

              setIsResettingDBIndexes(false);
              Alert.alert(
                'Success',
                'Database indexes has been reset. Please restart the app in case you encounter any issues.',
              );
            } catch (e) {
              logger.error(e, { showAlert: true });
            } finally {
              setIsResettingDBIndexes(false);
            }
          },
        },
      ],
    );
  }, [db, dbName, logger]);

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
        <UIGroup loading={isResettingDBIndexes}>
          <UIGroup.ListItem
            label="Reset DB Indexes"
            button
            destructive
            onPress={handleResetDBIndexes}
          />
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}
export default DatabaseManagementScreen;
