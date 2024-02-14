import React, { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

// import getData from '@app/data/functions/getData';
// import getDatum from '@app/data/functions/getDatum';
// import getRelated from '@app/data/functions/getRelated';
// import saveDatum from '@app/data/functions/saveDatum';

import { useDB } from '@app/db';

import type { StackParamList } from '@app/navigation/MainStack';

import useActionSheet from '@app/hooks/useActionSheet';
import useColors from '@app/hooks/useColors';
import useLogger from '@app/hooks/useLogger';

import Icon from '@app/components/Icon';
import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

const SAMPLE_BENCHMARK_FUNCTIONS = {
  'Empty Function': `
() => {
  return new Promise(resolve =>
    setTimeout(resolve, 10),
  );
};
`.trim(),
  'saveDatum (save collection)': `
({ saveDatum, db, logger, i }) => {
  return saveDatum(
    {
      __type: 'collection',
      __id: '00000000-benchmark-collection',
      name: 'Benchmark Collection',
      collection_reference_number: '9999',
      icon_name: 'cube-outline',
      icon_color: 'gray',
    },
    { db, logger },
  );
};
`.trim(),
  'saveDatum (save item)': `
({ saveDatum, db, logger, i }) => {
  return saveDatum(
    {
      __type: 'item',
      __id: \`00000000-benchmark-item-\${i}\`,
      name: \`Benchmark Item #\${i + 1}\`,
      icon_name: 'cube-outline',
      icon_color: 'gray',
      collection_id: '00000000-benchmark-collection',
    },
    { db, logger },
  );
};
`.trim(),
  'saveDatum (delete item)': `
({ saveDatum, db, logger, i }) => {
  return saveDatum(
    {
      __type: 'item',
      __id: \`00000000-benchmark-item-\${i}\`,
      __deleted: true,
    },
    { db, logger },
  );
};
`.trim(),
  'getDatum (item)': `
({ getDatum, db, logger }) => {
  return getDatum(
    'item',
    '00000000-benchmark-item-0', {
      logger,
      db,
    }
  ).then(item => item?.name || '(item not found or invalid)');
};
`.trim(),
  'getData (item by collection ID)': `
({ getData, db, logger }) => {
  return getData(
    'item',
    {
      collection_id: '00000000-benchmark-collection',
    },
    {},
    {
      logger,
      db,
    },
  ).then(items => items.length);
};
`.trim(),
} as const;

function BenchmarkScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Benchmark'>) {
  const { orangeTag } = useColors();
  const { showActionSheet } = useActionSheet();

  const { db } = useDB();
  const logger = useLogger('Benchmark');

  const [benchmarkFunction, setBenchmarkFunction] = useState(
    Object.values(SAMPLE_BENCHMARK_FUNCTIONS)[0],
  );
  const [iterations, setIterations] = useState(100);
  const [safetyCatch, setSafetyCatch] = useState(false);

  const handleShowQuerySelections = useCallback(() => {
    showActionSheet(
      Object.entries(SAMPLE_BENCHMARK_FUNCTIONS).map(([n, f]) => ({
        name: n,
        onSelect: () => {
          setBenchmarkFunction(f);
        },
      })),
    );
  }, [showActionSheet]);

  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  const safetyCatchRef = useRef(safetyCatch);
  safetyCatchRef.current = safetyCatch;
  const shouldStop = useRef(false);
  const [currentIteration, setCurrentIteration] = useState(-1);
  const [startAt, setStartAt] = useState(0);
  const [endAt, setEndAt] = useState(0);
  const lastReturnValueRef = useRef('');
  const doRun = useCallback(async () => {
    if (!safetyCatchRef.current) return;
    if (isRunningRef.current) return;

    setIsRunning(true);
    const startTime = Date.now();
    setStartAt(startTime);
    setEndAt(startTime);
    lastReturnValueRef.current = '';
    isRunningRef.current = true;
    shouldStop.current = false;

    try {
      // eslint-disable-next-line no-eval
      const benchmarkFn = eval(benchmarkFunction);

      setCurrentIteration(0);

      for (let i = 0; i < iterations; i++) {
        if (shouldStop.current) break;

        const returnValue = await benchmarkFn({
          logger,
          db,
          // getDatum,
          // getData,
          // getRelated,
          // saveDatum,
          i,
        });

        setCurrentIteration(i + 1);
        setEndAt(Date.now());
        if (returnValue !== undefined) {
          lastReturnValueRef.current = JSON.stringify(returnValue);
        } else {
          lastReturnValueRef.current = '';
        }
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Unknown error.');
    } finally {
      setIsRunning(false);
    }
  }, [benchmarkFunction, db, iterations, logger]);

  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  return (
    <ScreenContent navigation={navigation} title="Benchmark">
      <ScreenContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        <UIGroup>
          <UIGroup.ListTextInputItem
            label="Function to Execute"
            monospaced
            small
            placeholder="async () => {}"
            autoCapitalize="none"
            multiline
            value={benchmarkFunction}
            onChangeText={setBenchmarkFunction}
            controlElement={
              <UIGroup.ListTextInputItem.Button
                onPress={handleShowQuerySelections}
              >
                {({ iconProps }) => <Icon {...iconProps} name="list" />}
              </UIGroup.ListTextInputItem.Button>
            }
            {...kiaTextInputProps}
          />
        </UIGroup>

        <UIGroup>
          <UIGroup.ListTextInputItem
            label="Iterations"
            horizontalLabel
            placeholder="100"
            keyboardType="number-pad"
            selectTextOnFocus
            returnKeyType="done"
            value={iterations.toString()}
            onChangeText={t => {
              if (isRunningRef.current) return;
              const n = parseInt(t, 10);
              if (isNaN(n)) return;
              setIterations(n);
            }}
            disabled={isRunning}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="I'm aware that this can be dangerous"
            horizontalLabel
            inputElement={
              <UIGroup.ListItem.Switch
                value={safetyCatch}
                onValueChange={setSafetyCatch}
                trackColor={{ true: orangeTag }}
                disabled={isRunning}
              />
            }
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            button
            label="Run"
            disabled={!safetyCatch || isRunning}
            onPress={doRun}
          />
          {isRunning && (
            <>
              <UIGroup.ListItemSeparator />
              <UIGroup.ListItem
                button
                destructive
                label="Stop"
                onPress={() => (shouldStop.current = true)}
              />
            </>
          )}
        </UIGroup>

        {currentIteration > 0 && (
          <UIGroup
            header="Status"
            footer={`Time elapsed: ${
              (endAt - startAt) / 1000
            }s.\n\n~${Math.round(
              (endAt - startAt) / currentIteration,
            )}ms per iteration.`}
          >
            <UIGroup.ListItem
              label="Iterations"
              detail={`${currentIteration}/${iterations}`}
            />
            {!!lastReturnValueRef.current && (
              <>
                <UIGroup.ListItemSeparator />
                <UIGroup.ListTextInputItem
                  label="Last Return Value"
                  monospaced
                  small
                  showSoftInputOnFocus={false}
                  value={lastReturnValueRef.current}
                />
              </>
            )}
          </UIGroup>
        )}
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default BenchmarkScreen;
