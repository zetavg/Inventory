import React, { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { QuickSQLite } from 'react-native-quick-sqlite';

import { deleteSqliteDb, getSqliteDbNames } from '@app/db/sqlite';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';

import useActionSheet from '@app/hooks/useActionSheet';
import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import Icon from '@app/components/Icon';
import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

const SAMPLE_QUERIES: ReadonlyArray<string> = [
  "SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name;",
  'SELECT * FROM "logs" LIMIT 10 OFFSET 0;',
  'SELECT * FROM "document-store" LIMIT 10 OFFSET 0;',
  'SELECT * FROM "test_sqlite" LIMIT 10 OFFSET 0;',
  `CREATE TABLE "test_sqlite" (
  id INTEGER PRIMARY KEY,
  string STRING,
  text TEXT
);`,
  `INSERT INTO "test_sqlite" (string, text)
VALUES ('This is a string', 'This is a text');`,
  'DROP TABLE IF EXISTS "test_sqlite";',
];

function SQLiteScreen({
  navigation,
}: StackScreenProps<StackParamList, 'SQLite'>) {
  const { showActionSheet } = useActionSheet();

  const [database, setDatabase] = useState('default.sqlite3');
  const [query, setQuery] = useState(SAMPLE_QUERIES[0]);

  const [rows, setRows] = useState<undefined | Object>(undefined);
  const [insertId, setInsertId] = useState<undefined | number>(undefined);
  const [rowsAffected, setRowsAffected] = useState<undefined | number>(
    undefined,
  );

  const handleShowDbSelections = useCallback(async () => {
    const dbNames = await getSqliteDbNames();

    showActionSheet(
      dbNames.map(name => ({
        name,
        onSelect: () => {
          setDatabase(name);
        },
      })),
    );
  }, [showActionSheet]);

  const handleShowQuerySelections = useCallback(() => {
    showActionSheet(
      SAMPLE_QUERIES.map(q => ({
        name: q,
        onSelect: () => {
          setQuery(q);
        },
      })),
    );
  }, [showActionSheet]);

  const handleExecute = useCallback(() => {
    Alert.alert(
      'Confirmation',
      `Are you sure you want to execute SQL query:\n\n${query}\n\non database "${database}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Execute',
          style: 'destructive',
          onPress: () => {
            try {
              QuickSQLite.open(database);
              const {
                insertId: iId,
                rowsAffected: ra,
                rows: r,
              } = QuickSQLite.execute(database, query, []);
              setInsertId(iId);
              setRowsAffected(ra);
              setRows(r);
            } catch (e: any) {
              Alert.alert('An error occurred', e.message);
            }
          },
        },
      ],
    );
  }, [database, query]);

  const [deleteDbDryRun, setDeleteDbDryRun] = useState(true);

  const handleDeleteDatabaseDryRun = useCallback(async () => {
    try {
      const result = await deleteSqliteDb(database, { dryRun: true });
      Alert.alert('Dry Run Result', JSON.stringify(result, null, 2));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }, [database]);

  const handleDeleteDatabase = useCallback(() => {
    Alert.alert(
      'Confirmation',
      `Are you sure you want to DELETE the database "${database}"? This action is irreversible!`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Double Confirmation',
              `Are you really sure you want to DELETE the database "${database}"?`,
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const result = await deleteSqliteDb(database);
                      Alert.alert('Result', JSON.stringify(result, null, 2));
                    } catch (e: any) {
                      Alert.alert('Error', e.message);
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, [database]);

  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  return (
    <ScreenContent navigation={navigation} title="SQLite">
      <ScreenContent.ScrollView ref={scrollViewRef}>
        <UIGroup style={commonStyles.mt16}>
          <UIGroup.ListTextInputItem
            label="Database"
            monospaced
            small
            placeholder="db_..."
            autoCapitalize="none"
            returnKeyType="done"
            value={database}
            onChangeText={setDatabase}
            rightElement={
              <UIGroup.ListTextInputItem.Button
                onPress={handleShowDbSelections}
              >
                Select
              </UIGroup.ListTextInputItem.Button>
            }
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Query"
            monospaced
            small
            placeholder="SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name;"
            autoCapitalize="none"
            multiline
            value={query}
            onChangeText={setQuery}
            rightElement={
              <UIGroup.ListTextInputItem.Button
                onPress={handleShowQuerySelections}
              >
                {({ iconProps }) => <Icon {...iconProps} name="list" />}
              </UIGroup.ListTextInputItem.Button>
            }
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Execute Query"
            button
            onPress={handleExecute}
          />
        </UIGroup>

        <UIGroup header="Query Results">
          <UIGroup.ListTextInputItem
            label="Insert ID"
            horizontalLabel
            monospaced
            small
            placeholder="(undefined)"
            value={insertId === undefined ? '' : insertId.toString()}
            showSoftInputOnFocus={false}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Rows Affected"
            horizontalLabel
            monospaced
            small
            placeholder="(undefined)"
            value={rowsAffected === undefined ? '' : rowsAffected.toString()}
            showSoftInputOnFocus={false}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Rows"
            monospaced
            small
            multiline
            placeholder="(undefined)"
            value={rows === undefined ? '' : JSON.stringify(rows, null, 2)}
            showSoftInputOnFocus={false}
          />
        </UIGroup>

        <UIGroup header="Delete Database">
          <UIGroup.ListItem
            label="Dry Run"
            detail={
              <UIGroup.ListItem.Switch
                value={deleteDbDryRun}
                onChange={() => setDeleteDbDryRun(v => !v)}
              />
            }
          />
          <UIGroup.ListItemSeparator />
          {deleteDbDryRun ? (
            <UIGroup.ListItem
              button
              label="Delete Database (Dry Run)"
              onPress={handleDeleteDatabaseDryRun}
            />
          ) : (
            <UIGroup.ListItem
              button
              destructive
              label="Delete Database"
              onPress={handleDeleteDatabase}
            />
          )}
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default SQLiteScreen;
