import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { QuickSQLite } from 'react-native-quick-sqlite';

import { deleteSqliteDb, getSqliteDbNames } from '@app/db/sqlite';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';

import useActionSheet from '@app/hooks/useActionSheet';
import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import InsetGroup from '@app/components/InsetGroup';
import ScreenContent from '@app/components/ScreenContent';
import { Link } from '@app/components/Text';

function SQLiteScreen({
  navigation,
}: StackScreenProps<StackParamList, 'SQLite'>) {
  const { showActionSheet } = useActionSheet();

  const [database, setDatabase] = useState('default.sqlite3');
  const [query, setQuery] = useState(
    "SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name;",
  );
  const [rows, setRows] = useState<undefined | Object>(undefined);

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

  const handleExecute = useCallback(() => {
    Alert.alert(
      'Confirmation',
      `Are you sure you want to execute SQL query "${query}"" on database "${database}"?`,
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
                // status: s,
                // message: m,
                rows: r,
              } = QuickSQLite.execute(database, query, []);
              // setStatus(s);
              // setMessage(m);
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
  useScrollViewContentInsetFix(scrollViewRef);

  return (
    <ScreenContent navigation={navigation} title="SQLite">
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <InsetGroup style={commonStyles.mt16}>
          <InsetGroup.Item
            label="Database"
            vertical2
            detail={
              <View style={[commonStyles.row, commonStyles.alignItemsCenter]}>
                <InsetGroup.TextInput
                  style={commonStyles.devToolsMonospaced}
                  placeholder={'default'}
                  autoCapitalize="none"
                  returnKeyType="done"
                  value={database}
                  onChangeText={setDatabase}
                />
                <TouchableOpacity onPress={handleShowDbSelections}>
                  <Link>Select</Link>
                </TouchableOpacity>
              </View>
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Query"
            vertical2
            detail={
              <InsetGroup.TextInput
                style={commonStyles.devToolsMonospaced}
                placeholder="SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name;"
                autoCapitalize="none"
                multiline
                value={query}
                onChangeText={setQuery}
              />
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Execute Query"
            button
            onPress={handleExecute}
          />
        </InsetGroup>

        <InsetGroup label="Query Results">
          <InsetGroup.Item
            label="Rows"
            vertical2
            detailTextStyle={commonStyles.devToolsMonospaced}
            detail={
              rows === undefined ? '(undefined)' : JSON.stringify(rows, null, 2)
            }
          />
        </InsetGroup>

        <InsetGroup label="Delete Database">
          <InsetGroup.Item
            label="Dry Run"
            detail={
              <Switch
                value={deleteDbDryRun}
                onChange={() => setDeleteDbDryRun(v => !v)}
              />
            }
          />
          <InsetGroup.ItemSeparator />
          {deleteDbDryRun ? (
            <InsetGroup.Item
              button
              label="Delete Database (Dry Run)"
              onPress={handleDeleteDatabaseDryRun}
            />
          ) : (
            <InsetGroup.Item
              button
              destructive
              label="Delete Database"
              onPress={handleDeleteDatabase}
            />
          )}
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default SQLiteScreen;
