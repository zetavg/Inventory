import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { v4 as uuid } from 'uuid';

import { DataTypeWithID } from '@invt/data/types';

import type { RootStackParamList } from '@app/navigation/Navigation';

import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

import PrintingOptions from '../components/PrintingOptions';
import PrintingPreview from '../components/PrintingPreview';
import {
  getDefaultOptions,
  getLabels,
  getPrinterConfigFromString,
  print,
} from '../printing';
import { INITIAL_PRINTER_CONFIG } from '../slice';
import { PrinterConfig } from '../types';

const SAMPLE_COLLECTION: DataTypeWithID<'collection'> = {
  __id: uuid(),
  __type: 'collection',
  name: 'Sample Collection',
  collection_reference_number: '1234',
  icon_name: 'box',
  icon_color: 'gray',
  config_uuid: '<sample-config-uuid>',
  __valid: true,
};

const SAMPLE_CONTAINER: DataTypeWithID<'item'> = {
  __id: uuid(),
  __type: 'item',
  item_type: 'container',
  collection_id: 'collection-id',
  name: 'Sample Container',
  icon_name: 'cube-outline',
  icon_color: 'gray',
  item_reference_number: '000000',
  serial: 0,
  individual_asset_reference: '1234.000000.0000',
  config_uuid: '<sample-config-uuid>',
  __valid: true,
};

const SAMPLE_ITEM: DataTypeWithID<'item'> & {
  collection: DataTypeWithID<'collection'>;
  container?: DataTypeWithID<'item'> | undefined;
} = {
  __id: uuid(),
  __type: 'item',
  collection_id: SAMPLE_COLLECTION.__id || '',
  container_id: SAMPLE_CONTAINER.__id || '',
  name: 'Sample Item',
  icon_name: 'cube-outline',
  icon_color: 'gray',
  item_reference_number: '123456',
  serial: 1234,
  individual_asset_reference: '1234.123456.1234',
  config_uuid: '<sample-config-uuid>',
  __valid: true,
  collection: SAMPLE_COLLECTION,
  container: SAMPLE_CONTAINER,
};

export const SAMPLE_PRINTER_CONFIG = INITIAL_PRINTER_CONFIG;

function TestPrinterConfigModalScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'TestPrinterConfigModal'>) {
  const { printerConfig: printerConfigStr } = route.params;

  const [printerConfig, printerConfigError] = useMemo(() => {
    try {
      const pc = getPrinterConfigFromString(printerConfigStr);
      const parsedPc = PrinterConfig.parse(pc);
      return [parsedPc, null];
    } catch (e) {
      return [null, e instanceof Error ? e.message : 'unknown error'];
    }
  }, [printerConfigStr]);

  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ModalContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  const [options, setOptions] = useState<Record<string, any>>({});
  useEffect(() => {
    if (!printerConfig) return;

    setOptions(getDefaultOptions(printerConfig));
  }, [printerConfig]);

  const [sampleItem, setSampleItem] = useState(SAMPLE_ITEM);
  const [sampleLabels, sampleLabelsError] = useMemo(() => {
    if (!printerConfig) return [null, null];

    try {
      const labels = getLabels(printerConfig, options, [sampleItem]);
      return [labels, null];
    } catch (e) {
      return [null, e instanceof Error ? e.message : 'unknown error'];
    }
  }, [sampleItem, options, printerConfig]);

  const [isTestPrinting, setIsTestPrinting] = useState(false);
  const cancelPrintingFn = useRef<null | (() => void)>(null);
  const handleTestPrint = useCallback(async () => {
    setIsTestPrinting(true);
    try {
      const controller = new AbortController();
      const signal = controller.signal;
      cancelPrintingFn.current = () => controller.abort();

      const pc = getPrinterConfigFromString(printerConfigStr);
      const parsedPc = PrinterConfig.parse(pc);
      const labels = getLabels(parsedPc, options, [sampleItem]);
      await print(pc, options, labels, signal);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Unknown error.');
    } finally {
      setIsTestPrinting(false);
    }
  }, [sampleItem, options, printerConfigStr]);
  const handleCancelTestPrint = useCallback(() => {
    if (typeof cancelPrintingFn.current === 'function') {
      cancelPrintingFn.current();
    }

    setIsTestPrinting(false);
  }, []);

  return (
    <ModalContent
      navigation={navigation}
      title="Test Printer Config"
      backButtonLabel="Back"
    >
      <ModalContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />

        {(() => {
          if (printerConfigError || !printerConfig) {
            return (
              <UIGroup
                placeholder={`Invalid printer config: ${
                  printerConfigError || 'null'
                }`}
              />
            );
          }

          return (
            <>
              <UIGroup loading={isTestPrinting} header="Sample Data">
                <UIGroup.ListTextInputItem
                  label="Sample Item Name"
                  value={sampleItem.name}
                  onChangeText={text =>
                    setSampleItem(si => ({ ...si, name: text }))
                  }
                />
                <UIGroup.ListItemSeparator />
                <UIGroup.ListTextInputItem
                  label="Sample Item Collection Name"
                  value={sampleItem.collection.name}
                  onChangeText={text =>
                    setSampleItem(si => ({
                      ...si,
                      collection: { ...si.collection, name: text },
                    }))
                  }
                />
                <UIGroup.ListItemSeparator />
                <UIGroup.ListTextInputItem
                  label="Sample Item IAR"
                  value={sampleItem.individual_asset_reference}
                  monospaced
                  onChangeText={text =>
                    setSampleItem(si => ({
                      ...si,
                      individual_asset_reference: text,
                    }))
                  }
                />
              </UIGroup>

              <PrintingOptions
                printerConfig={printerConfig}
                options={options}
                setOptions={setOptions}
                loading={isTestPrinting}
                header="Print Options"
                textInputProps={kiaTextInputProps}
              />

              {(() => {
                if (sampleLabelsError || !sampleLabels) {
                  return (
                    <UIGroup
                      placeholder={`Error executing "getLabel" function: ${
                        sampleLabelsError || 'null'
                      }`}
                    />
                  );
                }

                return (
                  <>
                    {sampleLabels && (
                      <UIGroup header="Label Data">
                        <UIGroup.ListTextInputItem
                          value={JSON.stringify(sampleLabels[0], null, 2)}
                          multiline
                          monospaced
                          small
                          readonly
                          showSoftInputOnFocus={false}
                        />
                      </UIGroup>
                    )}

                    {sampleLabels && !!printerConfig?.getPreview && (
                      <PrintingPreview
                        header="Preview"
                        printerConfig={printerConfig}
                        options={options}
                        label={sampleLabels[0]}
                      />
                    )}

                    <UIGroup>
                      <UIGroup.ListItem
                        label="Test Print"
                        button
                        onPress={handleTestPrint}
                        disabled={isTestPrinting}
                      />
                      <>
                        <UIGroup.ListItemSeparator />
                        <UIGroup.ListItem
                          label="Cancel"
                          button
                          destructive
                          disabled={!isTestPrinting}
                          onPress={handleCancelTestPrint}
                        />
                      </>
                    </UIGroup>
                  </>
                );
              })()}
            </>
          );
        })()}
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default TestPrinterConfigModalScreen;
