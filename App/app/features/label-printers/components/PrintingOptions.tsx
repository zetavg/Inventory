import React from 'react';
import { TextInput, TouchableOpacity } from 'react-native';

import commonStyles from '@app/utils/commonStyles';
import titleCase from '@app/utils/titleCase';

import useActionSheet from '@app/hooks/useActionSheet';

import Text, { Link } from '@app/components/Text';
import UIGroup from '@app/components/UIGroup';

import { PrinterConfigT } from '../types';

type Props = {
  printerConfig: PrinterConfigT;
  options: Record<string, unknown>;
  setOptions: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  loading?: boolean;
  header?: string;
  textInputProps?: React.ComponentProps<typeof TextInput>;
};

function PrintingOptions({
  printerConfig,
  options,
  setOptions,
  loading,
  header,
  textInputProps,
}: Props): JSX.Element | null {
  const { showActionSheet } = useActionSheet();

  if (!printerConfig || Object.keys(printerConfig.options).length <= 0) {
    return null;
  }
  return (
    <UIGroup loading={loading} header={header}>
      {UIGroup.ListItemSeparator.insertBetween(
        Object.entries(printerConfig.options)
          .map(([optionName, opt]) => {
            const value = options[optionName];
            const humanOptionName = titleCase(optionName.replace(/_/gm, ' '));
            switch (true) {
              case opt.hasOwnProperty('enum'): {
                return (
                  <UIGroup.ListTextInputItem
                    key={optionName}
                    label={humanOptionName}
                    inputElement={
                      <TouchableOpacity
                        onPress={() => {
                          showActionSheet(
                            ((opt as any).enum || []).map((v: any) => ({
                              name: v,
                              onSelect: () =>
                                setOptions(s => ({
                                  ...s,
                                  [optionName]: v,
                                })),
                            })),
                          );
                        }}
                      >
                        <Text style={commonStyles.fs18}>
                          <Link>
                            {typeof value === 'string' ? value : 'Select...'}
                          </Link>
                        </Text>
                      </TouchableOpacity>
                    }
                    {...textInputProps}
                  />
                );
              }
              case (opt as any).type === 'boolean': {
                return (
                  <UIGroup.ListTextInputItem
                    key={optionName}
                    label={humanOptionName}
                    horizontalLabel
                    inputElement={
                      <UIGroup.ListItem.Switch
                        value={!!value}
                        onValueChange={v =>
                          setOptions(o => ({
                            ...o,
                            [optionName]: v,
                          }))
                        }
                      />
                    }
                    {...textInputProps}
                  />
                );
              }
              case (opt as any).type === 'string': {
                return (
                  <UIGroup.ListTextInputItem
                    key={optionName}
                    label={humanOptionName}
                    value={typeof value === 'string' ? value : ''}
                    returnKeyType="done"
                    onChangeText={text =>
                      setOptions(o => ({
                        ...o,
                        [optionName]: text,
                      }))
                    }
                    multiline
                    blurOnSubmit
                    placeholder={`Enter ${humanOptionName}...`}
                    controlElement={
                      Array.isArray((opt as any).choices) ? (
                        <UIGroup.ListTextInputItemButton
                          onPress={() => {
                            showActionSheet(
                              ((opt as any).choices || []).map((v: any) => ({
                                name: v,
                                onSelect: () =>
                                  setOptions(s => ({
                                    ...s,
                                    [optionName]: v,
                                  })),
                              })),
                            );
                          }}
                        >
                          Choose...
                        </UIGroup.ListTextInputItemButton>
                      ) : opt.default !== undefined &&
                        options[optionName] !== opt.default ? (
                        <UIGroup.ListTextInputItemButton
                          onPress={() => {
                            setOptions(s => ({
                              ...s,
                              [optionName]: opt.default,
                            }));
                          }}
                        >
                          Reset to Default
                        </UIGroup.ListTextInputItemButton>
                      ) : undefined
                    }
                    {...textInputProps}
                  />
                );
              }
              case (opt as any).type === 'integer': {
                return (
                  <UIGroup.ListTextInputItem
                    key={optionName}
                    label={humanOptionName}
                    value={typeof value === 'number' ? value.toString() : ''}
                    horizontalLabel
                    keyboardType="number-pad"
                    returnKeyType="done"
                    selectTextOnFocus
                    placeholder="0"
                    onChangeText={text => {
                      const int = parseInt(text, 10);
                      if (isNaN(int)) return;
                      setOptions(o => ({
                        ...o,
                        [optionName]: int,
                      }));
                    }}
                    controlElement={
                      Array.isArray((opt as any).choices) ? (
                        <UIGroup.ListTextInputItemButton
                          onPress={() => {
                            showActionSheet(
                              ((opt as any).choices || []).map((v: any) => ({
                                name: v.toString(),
                                onSelect: () =>
                                  setOptions(s => ({
                                    ...s,
                                    [optionName]: v,
                                  })),
                              })),
                            );
                          }}
                        >
                          Choose...
                        </UIGroup.ListTextInputItemButton>
                      ) : opt.default !== undefined &&
                        options[optionName] !== opt.default ? (
                        <UIGroup.ListTextInputItemButton
                          onPress={() => {
                            setOptions(s => ({
                              ...s,
                              [optionName]: opt.default,
                            }));
                          }}
                        >
                          Reset to Default
                        </UIGroup.ListTextInputItemButton>
                      ) : undefined
                    }
                    {...textInputProps}
                  />
                );
              }
              default:
                return null;
            }
          })
          .filter((elem): elem is NonNullable<typeof elem> => !!elem),
      )}
    </UIGroup>
  );
}

export default PrintingOptions;
