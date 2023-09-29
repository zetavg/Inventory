import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Linking, ScrollView, TextInput } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { diff } from 'deep-object-diff';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import filterObjectKeys from '@app/utils/filterObjectKeys';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useAutoFocus from '@app/hooks/useAutoFocus';

import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

import { getPrinterConfigFromString } from '../printing';
import { INITIAL_PRINTER_CONFIG, initialPrinterState } from '../slice';
import { PrinterConfig } from '../types';

export const SAMPLE_PRINTER_CONFIG = `
{
  options: {},
  getLabel: ({ item, options, utils }) => {
    return {};
  },
  print: ({ options, labels, utils, signal }) => {
    return Promise.all(
      labels.map(label => {
        return fetch(
          'https://example.com/...',
          { signal, method: 'POST' },
        );
      }),
    );
  },
  // Optional
  getPreview: ({ options, label, utils }) => {
    return {
      width: 800,
      height: 200,
      uri: 'https://example.com/...',
    };
  },
};
`.trim();

const WARNING_MESSAGE =
  '⚠️ Do not paste configurations from untrusted sources! Your data may be leaked or damaged by malicious code inside the config.';

function NewOrEditLabelPrinterModalScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'NewOrEditLabelPrinterModal'>) {
  const { id } = route.params;
  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ModalContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);
  const afterSave = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const dispatch = useAppDispatch();
  const printers = useAppSelector(selectors.labelPrinters.printers);
  const editingPrinter = printers[id || ''];
  const initialState = useMemo(
    () =>
      filterObjectKeys(editingPrinter || { ...initialPrinterState }, [
        'name',
        'printerConfig',
      ]),
    [editingPrinter],
  );
  const [state, setState] = useState(initialState);
  const hasUnsavedChanges = useMemo(
    () => Object.keys(diff(state, initialState)).length > 0,
    [initialState, state],
  );

  const nameErrorMessage = useMemo(() => {
    if (!state.name) {
      return 'Name is required.';
    }

    return null;
  }, [state.name]);

  const configErrorMessage = useMemo(() => {
    if (!state.printerConfig) {
      return 'Config is required.';
    }

    try {
      const pc = getPrinterConfigFromString(state.printerConfig);
      PrinterConfig.parse(pc);
    } catch (e) {
      return e instanceof Error ? e.message : 'Unknown error';
    }

    return null;
  }, [state.printerConfig]);

  const isSaved = useRef(false);
  const handleSave = useCallback(() => {
    const errorMessages = [nameErrorMessage, configErrorMessage].filter(m => m);

    if (errorMessages.length > 0) {
      Alert.alert(
        'Please fix the following errors',
        errorMessages.map(m => `• ${m}`).join('\n'),
      );
      return;
    }

    try {
      if (!id) {
        dispatch(actions.labelPrinters.addPrinter(state));
      } else {
        dispatch(actions.labelPrinters.updatePrinter([id, state]));
      }
      isSaved.current = true;
      afterSave && afterSave();
    } catch (e) {
      // logger.error(e, { showAlert: true });
    }
  }, [nameErrorMessage, configErrorMessage, id, afterSave, dispatch, state]);

  const handleLeave = useCallback(
    (confirm: () => void) => {
      if (isSaved.current) {
        confirm();
        return;
      }

      if (!hasUnsavedChanges) {
        confirm();
        return;
      }

      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them and leave?',
        [
          { text: "Don't leave", style: 'cancel', onPress: () => {} },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: confirm,
          },
        ],
      );
    },
    [hasUnsavedChanges],
  );

  const nameInputRef = useRef<TextInput>(null);
  const printerConfigInputRef = useRef<TextInput>(null);
  // const dbUsernameInputRef = useRef<TextInput>(null);
  // const dbPasswordInputRef = useRef<TextInput>(null);

  useAutoFocus(nameInputRef, { scrollViewRef, disable: !!id });

  const loadSampleConfig = useCallback(() => {
    printerConfigInputRef.current?.blur();
    setState(s => ({
      ...s,
      printerConfig: SAMPLE_PRINTER_CONFIG,
    }));
  }, []);
  const handleLoadSampleConfigPress = useCallback(() => {
    if (
      state.printerConfig !== INITIAL_PRINTER_CONFIG &&
      state.printerConfig !== SAMPLE_PRINTER_CONFIG
    ) {
      Alert.alert(
        'Discard Changes?',
        'Are you sure you want to discard your changes and load the sample?',
        [
          {
            text: "Don't discard",
            style: 'cancel',
            onPress: () => {},
          },
          {
            text: 'Discard and load sample',
            style: 'destructive',
            onPress: loadSampleConfig,
          },
        ],
      );
    } else {
      loadSampleConfig();
    }
  }, [loadSampleConfig, state.printerConfig]);

  return (
    <ModalContent
      navigation={navigation}
      preventClose={hasUnsavedChanges}
      confirmCloseFn={handleLeave}
      title={id ? 'Edit Printer' : 'Add Printer'}
      action1Label="Save"
      action1MaterialIconName="check"
      action1Variant="strong"
      onAction1Press={handleSave}
      backButtonLabel="Cancel"
    >
      <ModalContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />
        <UIGroup header="Printer Name" footer={nameErrorMessage || undefined}>
          <UIGroup.ListTextInputItem
            ref={nameInputRef}
            placeholder="My Printer"
            value={state.name}
            multiline
            blurOnSubmit
            onChangeText={text =>
              setState({ ...state, name: text.replace(/[\r\n]+/g, ' ') })
            }
            autoCapitalize="words"
            returnKeyType="done"
            {...kiaTextInputProps}
          />
        </UIGroup>

        <UIGroup
          header="Printer Config"
          footer={
            configErrorMessage
              ? configErrorMessage + '\n\n' + WARNING_MESSAGE
              : WARNING_MESSAGE
          }
        >
          <UIGroup.ListTextInputItem
            ref={printerConfigInputRef}
            label="Config"
            placeholder={
              'Paste config here...\n\n(It is recommended to edit the config in a code editor and copy-paste it here)\n'
            }
            value={state.printerConfig}
            controlElement={
              <>
                {!!configErrorMessage && (
                  <UIGroup.ListTextInputItemButton
                    onPress={handleLoadSampleConfigPress}
                  >
                    Load Sample
                  </UIGroup.ListTextInputItemButton>
                )}
                <UIGroup.ListTextInputItemButton
                  onPress={() =>
                    navigation.push('TestPrinterConfigModal', {
                      printerConfig: state.printerConfig,
                    })
                  }
                  disabled={!!configErrorMessage}
                >
                  {configErrorMessage ? 'Invalid Config' : 'Test'}
                </UIGroup.ListTextInputItemButton>
              </>
            }
            keyboardType="ascii-capable"
            autoCapitalize="none"
            multiline
            monospaced
            small
            selectTextOnFocus
            onChangeText={text => setState({ ...state, printerConfig: text })}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            button
            label="Test..."
            onPress={() =>
              navigation.push('TestPrinterConfigModal', {
                printerConfig: state.printerConfig,
              })
            }
            disabled={!!configErrorMessage}
          />
        </UIGroup>
        <UIGroup footer="Check out the documentation on how to integrate with your label printer.">
          <UIGroup.ListItem
            button
            label="Printer Integration Documentation"
            onPress={() =>
              Linking.openURL(
                'https://docs.inventory.z72.io/app/label-printer-integration',
              )
            }
          />
        </UIGroup>
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default NewOrEditLabelPrinterModalScreen;
