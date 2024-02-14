import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { getValidationErrorFromZodSafeParseReturnValue } from '@invt/data/utils/validation-utils';

import {
  DataTypeName,
  DataTypeWithID,
  getHumanName,
  getPropertyNames,
  getPropertyType,
  schema,
  useData,
  useSave,
} from '@app/data';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useDeepCompare from '@app/hooks/useDeepCompare';

import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

function SaveDataModalScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'SaveData'>) {
  const {
    type,
    id,
    initialData: initialDataFromParams,
    afterSave,
  } = route.params;
  const { save, saving } = useSave();
  const { data: originalData, loading } = useData(type, id || '', {
    disable: !id,
  });
  const initialData = useMemo<
    Partial<DataTypeWithID<DataTypeName>> & {
      __type: keyof typeof schema;
    }
  >(
    () => ({
      __type: type as any,
      __id: id,
      ...initialDataFromParams,
      ...(originalData?.__valid ? (originalData as any) : {}),
    }),
    [id, initialDataFromParams, originalData, type],
  );
  const [data, setData] = useState<
    Partial<DataTypeWithID<DataTypeName>> & {
      __type: keyof typeof schema;
    }
  >(initialData);
  useEffect(() => {
    setData(d => ({
      ...d,
      ...initialData,
    }));
  }, [initialData]);

  const hasChanges = !useDeepCompare(initialData, data);

  const safeParseResults = useMemo(
    () => schema[type].safeParse(data),
    [data, type],
  );

  const isDone = useRef(false);
  const handleSave = useCallback(async () => {
    const results = await save(data);
    if (results) {
      isDone.current = true;
      if (afterSave) afterSave(results);
      navigation.goBack();
    }
  }, [afterSave, data, navigation, save]);

  const handleLeave = useCallback(
    (confirm: () => void) => {
      if (isDone.current) {
        confirm();
        return;
      }

      if (loading) return;

      Alert.alert(
        'Discard changes?',
        'The document is not saved yet. Are you sure to discard the changes and leave?',
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
    [loading],
  );
  const scrollViewRef = useRef<ScrollView>(null);

  const { kiaTextInputProps } =
    ModalContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  return (
    <ModalContent
      navigation={navigation}
      confirmCloseFn={handleLeave}
      preventClose={hasChanges}
      title={`${id ? 'Edit' : 'New'} ${getHumanName(type, {
        plural: false,
        titleCase: true,
      })}`}
      action1Label="Save"
      action1MaterialIconName="check"
      action1Variant="strong"
      onAction1Press={loading || saving ? undefined : handleSave}
      action2Label="Cancel"
      onAction2Press={loading || saving ? undefined : () => navigation.goBack()}
    >
      <ModalContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />

        <UIGroup loading={loading || saving}>
          {UIGroup.ListItemSeparator.insertBetween(
            getPropertyNames(type).map((propertyName: any) => {
              const [propertyType] = (getPropertyType as any)(
                type,
                propertyName,
              );
              const humanPropertyName = getHumanName(propertyName, {
                titleCase: true,
              });
              const value: any = data[propertyName];
              switch (propertyType) {
                case 'enum':
                case 'string': {
                  return (
                    <UIGroup.ListTextInputItem
                      key={propertyName}
                      label={humanPropertyName}
                      value={value}
                      onChangeText={t =>
                        setData(d => ({ ...d, [propertyName]: t }))
                      }
                      placeholder={`Enter ${humanPropertyName}`}
                      returnKeyType="done"
                      multiline
                      blurOnSubmit
                      {...kiaTextInputProps}
                    />
                  );
                }
                case 'number':
                case 'integer': {
                  return (
                    <UIGroup.ListTextInputItem
                      key={propertyName}
                      label={humanPropertyName}
                      value={typeof value === 'number' ? value.toString() : ''}
                      onChangeText={t => {
                        const n =
                          propertyType === 'integer'
                            ? parseInt(t, 10)
                            : parseFloat(t);
                        if (Number.isNaN(n)) {
                          setData(d => ({ ...d, [propertyName]: undefined }));
                        } else {
                          setData(d => ({ ...d, [propertyName]: n }));
                        }
                      }}
                      placeholder={`Enter ${humanPropertyName}`}
                      returnKeyType="done"
                      keyboardType={
                        propertyType === 'integer' ? 'number-pad' : 'numeric'
                      }
                      {...kiaTextInputProps}
                    />
                  );
                }
                case 'boolean': {
                  return (
                    <UIGroup.ListTextInputItem
                      key={propertyName}
                      label={humanPropertyName}
                      horizontalLabel
                      inputElement={
                        <UIGroup.ListItem.Switch
                          value={value}
                          onValueChange={v =>
                            setData(d => ({ ...d, [propertyName]: v }))
                          }
                        />
                      }
                    />
                  );
                }
                default: {
                  return (
                    <UIGroup.ListTextInputItem
                      key={propertyName}
                      label={humanPropertyName}
                      value={`- Editing type "${propertyType}" is not supported. -`}
                      disabled
                      multiline
                    />
                  );
                }
              }
            }),
          )}
        </UIGroup>

        <UIGroup header="Advanced">
          <UIGroup.ListTextInputItem
            label="Data"
            multiline
            monospaced
            small
            showSoftInputOnFocus={false}
            value={JSON.stringify(data, null, 2)}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Validation Issues"
            multiline
            monospaced
            small
            showSoftInputOnFocus={false}
            value={JSON.stringify(
              getValidationErrorFromZodSafeParseReturnValue(safeParseResults)
                ?.issues || [],
              null,
              2,
            )}
          />
        </UIGroup>
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default SaveDataModalScreen;
