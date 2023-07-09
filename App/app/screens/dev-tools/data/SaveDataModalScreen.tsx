import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { ZodError } from 'zod';

import {
  DataTypeWithAdditionalInfo,
  getHumanTypeName,
  getPropertyNames,
  getPropertyType,
  schema,
  toTitleCase,
  useData,
  useSave,
} from '@app/data';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useLogger from '@app/hooks/useLogger';

import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

function SaveDataModalScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'SaveData'>) {
  const { type, id, initialData, afterSave } = route.params;
  const logger = useLogger('SaveDataModalScreen');
  const save = useSave();
  const { data: originalData, loading } = useData(type, id || '', {
    disable: !id,
    validate: false,
  });
  const [data, setData] = useState<
    Partial<DataTypeWithAdditionalInfo<keyof typeof schema>> & {
      __type: keyof typeof schema;
    }
  >({ __type: type as any, __id: id });
  useEffect(() => {
    setData(d => ({ ...d, ...originalData, ...initialData }));
  }, [initialData, originalData]);

  const safeParseResults = useMemo(
    () => schema[type].safeParse(data),
    [data, type],
  );

  const isDone = useRef(false);
  const handleSave = useCallback(async () => {
    try {
      const results = await save(data);
      if (!results) {
        logger.error('Unknown error: save returned null.', {
          details: JSON.stringify({ data }, null, 2),
          showAlert: true,
        });
        return;
      }
      isDone.current = true;
      if (afterSave) afterSave(results);
      navigation.goBack();
    } catch (e) {
      if (e instanceof ZodError) {
        Alert.alert(
          'Please Fix The Following Errors',
          e.issues
            .map(
              i =>
                `• ${toTitleCase(
                  i.path.join('_').replace(/_/g, ' '),
                )} - ${i.message.toLowerCase()}`,
            )
            .join('\n'),
        );
        return;
      } else {
        logger.error(e, {
          details: JSON.stringify({ data }, null, 2),
          showAlert: true,
        });
      }
    }
  }, [afterSave, data, logger, navigation, save]);

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
      title={`${id ? 'Update' : 'Create'} ${getHumanTypeName(type, {
        plural: false,
        titleCase: true,
      })}`}
      action1Label="Save"
      action1MaterialIconName="check"
      action1Variant="strong"
      onAction1Press={handleSave}
      action2Label="Cancel"
      onAction2Press={loading ? undefined : () => navigation.goBack()}
    >
      <ModalContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />

        <UIGroup>
          {UIGroup.ListItemSeparator.insertBetween(
            getPropertyNames(type).map((propertyName: any) => {
              const [propertyType] = getPropertyType(type, propertyName);
              const humanPropertyName = toTitleCase(
                propertyName.replace(/_/g, ' '),
              );
              const value: any = data[propertyName];
              switch (propertyType) {
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
                      {...kiaTextInputProps}
                    />
                  );
                }
                case 'boolean': {
                  return (
                    <UIGroup.ListItem
                      key={propertyName}
                      label={humanPropertyName}
                      detail={
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
                    <UIGroup.ListItem
                      key={propertyName}
                      label={humanPropertyName}
                      detail={`Type "${propertyType}" is not supported.`}
                      verticalArrangedLargeTextIOS
                    />
                  );
                }
              }
            }),
          )}
        </UIGroup>

        <UIGroup header="Advanced">
          <UIGroup.ListTextInputItem
            label="Preview"
            multiline
            monospaced
            small
            value={JSON.stringify(safeParseResults, null, 2)}
          />
        </UIGroup>
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default SaveDataModalScreen;
