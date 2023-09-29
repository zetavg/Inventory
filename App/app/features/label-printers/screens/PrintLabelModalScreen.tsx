import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  LayoutAnimation,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { diff } from 'deep-object-diff';

import { DataTypeWithID } from '@deps/data/types';

import { DEFAULT_LAYOUT_ANIMATION_CONFIG } from '@app/consts/animations';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import { onlyValid, useData } from '@app/data';

import commonStyles from '@app/utils/commonStyles';
import filterObjectKeys from '@app/utils/filterObjectKeys';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useActionSheet from '@app/hooks/useActionSheet';

import ModalContent from '@app/components/ModalContent';
import Text, { Link } from '@app/components/Text';
import UIGroup from '@app/components/UIGroup';

import PrintingOptions from '../components/PrintingOptions';
import PrintingPreview from '../components/PrintingPreview';
import {
  getDefaultOptions,
  getLabels,
  getPrinterConfigFromString,
  print,
} from '../printing';
import { PrinterConfig } from '../types';

function PrintLabelModalScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'PrintLabelModal'>) {
  const { itemIds } = route.params;

  const { showActionSheet } = useActionSheet();

  const dispatch = useAppDispatch();
  const printers = useAppSelector(selectors.labelPrinters.printers);
  const lastUsedPrinterId = useAppSelector(
    selectors.labelPrinters.lastUsedPrinterId,
  );

  const [isLoadingDelayed, setIsLoadingDelayed] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingDelayed(false);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const { data: items, loading: itemsLoading } = useData('item', itemIds, {
    limit: 10000,
    disable: isLoadingDelayed,
  });

  const collectionIds = useMemo(
    () =>
      Array.from(
        new Set(
          items
            ?.map(item => item.collection_id)
            .filter((id): id is string => typeof id === 'string'),
        ),
      ),
    [items],
  );
  const { data: collections, loading: collectionsLoading } = useData(
    'collection',
    collectionIds,
    { limit: 10000, disable: !items },
  );
  const collectionsMap = useMemo(() => {
    return onlyValid(collections || []).reduce((map, collection) => {
      if (collection.__id) map[collection.__id] = collection;
      return map;
    }, {} as Record<string, DataTypeWithID<'collection'>>);
  }, [collections]);

  const containerIds = useMemo(
    () =>
      Array.from(
        new Set(
          items
            ?.map(item => item.container_id)
            .filter((id): id is string => typeof id === 'string'),
        ),
      ),
    [items],
  );
  const { data: containers, loading: containersLoading } = useData(
    'item',
    containerIds,
    { limit: 10000, disable: !items },
  );
  const containersMap = useMemo(() => {
    return onlyValid(containers || []).reduce((map, container) => {
      if (container.__id) map[container.__id] = container;
      return map;
    }, {} as Record<string, DataTypeWithID<'item'>>);
  }, [containers]);

  const verifiedItems = useMemo(
    () =>
      onlyValid(items || []).map(item => ({
        ...item,
        collection: collectionsMap[item.collection_id],
        container: item.container_id
          ? containersMap[item.container_id]
          : undefined,
      })),
    [collectionsMap, containersMap, items],
  );

  const loading =
    isLoadingDelayed || itemsLoading || collectionsLoading || containersLoading;

  const [selectedPrinterId, setSelectedPrinterId] = useState(lastUsedPrinterId);
  const selectedPrinter = printers[selectedPrinterId || ''];
  useEffect(() => {
    if (!selectedPrinter?.name) return;
    if (!selectedPrinterId) return;

    dispatch(actions.labelPrinters.setLastUsedPrinterId(selectedPrinterId));
  }, [selectedPrinterId, selectedPrinter?.name, dispatch]);

  const [printerConfig, printerConfigError] = useMemo(() => {
    try {
      if (!selectedPrinter?.printerConfig) return [null, null] as const;
      const config = getPrinterConfigFromString(selectedPrinter?.printerConfig);
      const parsedConfig = PrinterConfig.parse(config);
      return [parsedConfig, null] as const;
    } catch (e) {
      return [null, e instanceof Error ? e.message : e] as const;
    }
  }, [selectedPrinter?.printerConfig]);

  const [options, setOptions] = useState<Record<string, any>>({});
  useEffect(() => {
    try {
      setOptions({
        ...getDefaultOptions(printerConfig),
        ...selectedPrinter?.savedOptions,
      });
    } catch (e) {}
    // Do not need to update options when selectedPrinter?.savedOptions changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPrinterId, printerConfig]);
  useEffect(() => {
    if (!selectedPrinterId) return;
    if (!printerConfig) return;
    if (!selectedPrinter) return;

    const optionsToSave = filterObjectKeys(
      options,
      Object.entries(printerConfig?.options)
        .filter(([_name, opt]) => opt.saveLastValue)
        .map(([name]) => name),
    );

    if (
      Object.keys(diff(optionsToSave, selectedPrinter.savedOptions || {}) || {})
        .length > 0
    ) {
      dispatch(
        actions.labelPrinters.updatePrinterSavedOptions([
          selectedPrinterId,
          optionsToSave,
        ]),
      );
    }
  }, [dispatch, options, printerConfig, selectedPrinter, selectedPrinterId]);

  const [labels, labelsError] = useMemo(() => {
    try {
      if (!printerConfig) return [null, null];
      const ls = getLabels(printerConfig, options, verifiedItems);
      return [ls, null];
    } catch (e) {
      return [null, e instanceof Error ? e.message : e] as const;
    }
  }, [options, printerConfig, verifiedItems]);

  const [labelOverrides, setLabelOverrides] = useState<Record<string, string>>(
    {},
  );
  useEffect(() => {
    setLabelOverrides({});
  }, [labels]);

  const [isPrinting, setIsPrinting] = useState(false);
  const cancelPrintingFn = useRef<null | (() => void)>(null);
  const handlePrint = useCallback(async () => {
    if (!printerConfig) return;
    if (!options) return;
    if (!labels) return;

    setIsPrinting(true);
    try {
      const controller = new AbortController();
      const signal = controller.signal;
      cancelPrintingFn.current = () => controller.abort();

      await print(
        printerConfig,
        options,
        labels.map(l => ({ ...l, ...labelOverrides })),
        signal,
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Unknown error.');
    } finally {
      setIsPrinting(false);
    }
  }, [labelOverrides, labels, options, printerConfig]);
  const handleCancelPrint = useCallback(() => {
    if (typeof cancelPrintingFn.current === 'function') {
      cancelPrintingFn.current();
    }

    setIsPrinting(false);
  }, []);

  const [showLabelOverrides, setShowLabelOverrides] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ModalContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  return (
    <ModalContent
      navigation={navigation}
      title={itemIds.length > 1 ? 'Print Labels' : 'Print Label'}
      backButtonLabel="Back"
    >
      <ModalContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />
        {Object.keys(printers).length <= 0 ? (
          <UIGroup loading={isPrinting}>
            <UIGroup.ListItem
              label="Add Printer..."
              button
              onPress={() => navigation.push('NewOrEditLabelPrinterModal', {})}
            />
          </UIGroup>
        ) : (
          <UIGroup loading={isPrinting}>
            <UIGroup.ListItem
              label="Printer"
              rightElement={
                <TouchableOpacity
                  style={styles.printerSelect}
                  onPress={() => {
                    showActionSheet(
                      Object.entries(printers).map(([id, printer]) => ({
                        name: printer?.name || '',
                        onSelect: () => {
                          setSelectedPrinterId(id);
                        },
                      })),
                    );
                  }}
                >
                  <Text style={commonStyles.fs18}>
                    <Link>{selectedPrinter?.name || 'Select Printer'}</Link>
                  </Text>
                </TouchableOpacity>
              }
            />
          </UIGroup>
        )}
        {printerConfigError ? (
          <UIGroup
            placeholder={`Error loading printer config: ${printerConfigError}`}
          />
        ) : printerConfig ? (
          <>
            <PrintingOptions
              printerConfig={printerConfig}
              options={options}
              setOptions={setOptions}
              loading={isPrinting}
              textInputProps={kiaTextInputProps}
            />
            {labelsError ? (
              <UIGroup
                loading={loading}
                placeholder={`Error getting labels: ${labelsError}`}
              />
            ) : !Array.isArray(labels) || labels.length <= 0 ? (
              <UIGroup
                loading={loading}
                placeholder={!loading ? 'Nothing to print' : undefined}
              />
            ) : (
              <>
                {labels.length === 1 ? null : (
                  <UIGroup loading={loading || isPrinting}>
                    <UIGroup.ListItem
                      label="Labels to print"
                      detail={labels.length}
                    />
                  </UIGroup>
                )}
                {!!printerConfig?.getPreview && (
                  <PrintingPreview
                    loading={loading}
                    header="Preview"
                    printerConfig={printerConfig}
                    options={options}
                    label={{ ...labels[0], ...labelOverrides }}
                  />
                )}

                <UIGroup
                  transparentBackground
                  style={styles.showLabelOverridesContainer}
                >
                  <Text style={commonStyles.tac}>
                    <Link
                      onPress={() => {
                        LayoutAnimation.configureNext(
                          DEFAULT_LAYOUT_ANIMATION_CONFIG,
                        );
                        setShowLabelOverrides(v => !v);
                      }}
                    >
                      {showLabelOverrides
                        ? 'Hide Label Overrides'
                        : 'Show Label Overrides'}
                    </Link>
                  </Text>
                </UIGroup>

                {showLabelOverrides && (
                  <View style={styles.labelOverridesContainer}>
                    <UIGroup
                      header="Label Overrides"
                      loading={loading || isPrinting}
                    >
                      {UIGroup.ListItemSeparator.insertBetween(
                        Object.entries(labels[0]).map(([key, value]) => (
                          <UIGroup.ListTextInputItem
                            key={key}
                            label={key}
                            value={
                              labelOverrides[key] ||
                              (labels.length <= 1 ? value : '')
                            }
                            onChangeText={text => {
                              setLabelOverrides(o => ({ ...o, [key]: text }));
                            }}
                          />
                        )),
                      )}
                    </UIGroup>
                  </View>
                )}

                <UIGroup loading={loading}>
                  <UIGroup.ListItem
                    label="Print"
                    button
                    onPress={handlePrint}
                    disabled={isPrinting}
                  />
                  <>
                    <UIGroup.ListItemSeparator />
                    <UIGroup.ListItem
                      label="Cancel"
                      button
                      destructive
                      disabled={!isPrinting}
                      onPress={handleCancelPrint}
                    />
                  </>
                </UIGroup>
              </>
            )}
          </>
        ) : null}
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default PrintLabelModalScreen;

const styles = StyleSheet.create({
  printerSelect: { minWidth: 80, alignItems: 'flex-end' },
  showLabelOverridesContainer: {
    marginTop: -16,
    marginBottom: 24,
  },
  labelOverridesContainer: {
    marginTop: -8,
  },
});
