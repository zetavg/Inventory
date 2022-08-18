import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, Alert } from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';
import Switch from '@app/components/Switch';
import commonStyles from '@app/utils/commonStyles';
import useDebouncedValue from '@app/hooks/useDebouncedValue';
import { DB_NAME } from '@app/db/pouchdb';

import { QuickSQLite } from 'react-native-quick-sqlite';

function SQLiteScreen({
  navigation,
}: StackScreenProps<StackParamList, 'SQLite'>) {
  const [database, setDatabase] = useState(DB_NAME);
  const [query, setQuery] = useState(
    "SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name;",
  );
  const [status, setStatus] = useState<undefined | 0 | 1>(undefined);
  const [message, setMessage] = useState<undefined | string>(undefined);
  const [rows, setRows] = useState<undefined | Object>(undefined);

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
            const {
              status: s,
              message: m,
              rows: r,
            } = QuickSQLite.executeSql(database, query, []);
            setStatus(s);
            setMessage(m);
            setRows(r);
          },
        },
      ],
    );
  }, [database, query]);

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
              <InsetGroup.TextInput
                placeholder={DB_NAME}
                autoCapitalize="none"
                returnKeyType="done"
                value={database}
                onChangeText={setDatabase}
              />
            }
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            label="Query"
            vertical2
            detail={
              <InsetGroup.TextInput
                placeholder="SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name;"
                autoCapitalize="none"
                multiline
                value={query}
                onChangeText={setQuery}
              />
            }
          />
        </InsetGroup>

        <InsetGroup>
          <InsetGroup.Item
            label="Execute Query"
            button
            onPress={handleExecute}
          />
        </InsetGroup>

        <InsetGroup label="Query Results">
          <InsetGroup.Item
            label="Status"
            vertical2
            detail={status === undefined ? '(undefined)' : status.toString()}
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            label="Message"
            vertical2
            detail={message === undefined ? '(undefined)' : message}
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            label="Rows"
            vertical2
            detail={
              rows === undefined ? '(undefined)' : JSON.stringify(rows, null, 2)
            }
          />
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default SQLiteScreen;
