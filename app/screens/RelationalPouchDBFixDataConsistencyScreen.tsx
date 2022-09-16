import React, { useRef, useState, useCallback } from 'react';
import { Alert, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';

import schema from '@app/db/schema';
import useDB from '@app/hooks/useDB';
import titleCase from '@app/utils/titleCase';
import { save } from '@app/db/relationalUtils';

type ErrorRecord = {
  type: string;
  id: string;
  error: any;
  errorMessage: string;
};

function RelationalPouchDBFixDataConsistencyScreen({
  navigation,
}: StackScreenProps<StackParamList, 'RelationalPouchDBFixDataConsistency'>) {
  const { db } = useDB();

  const [status, setStatus] = useState(
    Object.fromEntries(
      Object.keys(schema).map(type => [type, { all: null, done: 0 }]),
    ),
  );
  const [errors, setErrors] = useState<Array<ErrorRecord>>([]);
  const [started, setStarted] = useState(false);
  const startedRef = useRef(started);
  startedRef.current = started;

  const start = useCallback(async () => {
    setStarted(true);
    setStatus(
      Object.fromEntries(
        Object.keys(schema).map(type => [type, { all: null, done: 0 }]),
      ),
    );
    setErrors([]);
    startedRef.current = true;
    console.log('Start');
    try {
      const idsForEachType: Record<string, Array<string>> = {};

      for (const type of Object.keys(schema)) {
        if (!startedRef.current) return;
        console.log(`Getting all IDs for type ${type}`);
        const ids = (await db.rel.find(type))[(schema as any)[type].plural].map(
          (d: any) => d.id,
        );
        idsForEachType[type] = ids;
        setStatus(s => ({ ...s, [type]: { done: 0, all: ids.length } }));
      }

      for (const type of Object.keys(schema)) {
        const ids = idsForEachType[type];
        if (!startedRef.current) return;

        for (const id of ids) {
          if (!startedRef.current) return;

          try {
            const result = await db.rel.find(type, id);
            const data = result[(schema as any)[type].plural][0];
            await save(db, type as any, data, { touch: false });
          } catch (err: any) {
            setErrors(es => [
              ...es,
              { type, id, errorMessage: err.message, error: err },
            ]);
          } finally {
            setStatus(s => ({
              ...s,
              [type]: { ...s[type], done: s[type].done + 1 },
            }));
          }
        }
      }
    } catch (e: any) {
      Alert.alert(
        'Unknown Error',
        `Operation stopped due to unknown error: ${e.message}`,
      );
    } finally {
      setStarted(false);
    }
  }, [db]);

  const stop = useCallback(() => {
    setStarted(false);
  }, []);

  return (
    <ScreenContent navigation={navigation} title="Fix Data Consistency">
      <ScrollView
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <InsetGroup label="Status">
          {Object.entries(status).flatMap(([type, s]) => [
            <InsetGroup.Item
              key={type}
              label={titleCase(type)}
              detail={s.all === null ? 'N/A' : `${s.done}/${s.all}`}
            />,
            <InsetGroup.ItemSeperator />,
          ])}
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            button
            label="Start"
            onPress={start}
            disabled={started}
          />
          {started && (
            <>
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item button label="Stop" destructive onPress={stop} />
            </>
          )}
        </InsetGroup>
        {errors.length > 0 && (
          <InsetGroup label="Errors">
            {errors.flatMap((record, i) => [
              <InsetGroup.Item
                key={i}
                vertical
                label={`${record.type} ${record.id}`}
                detail={record.errorMessage}
                onPress={() =>
                  navigation.push('GenericTextDetails', {
                    title: 'Error Details',
                    details: JSON.stringify(record, null, 2),
                  })
                }
              />,
              <InsetGroup.ItemSeperator />,
            ])}
          </InsetGroup>
        )}
      </ScrollView>
    </ScreenContent>
  );
}

export default RelationalPouchDBFixDataConsistencyScreen;
