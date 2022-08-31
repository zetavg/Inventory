import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';
import ModalContent from '@app/components/ModalContent';
import InsetGroup from '@app/components/InsetGroup';
import commonStyles from '@app/utils/commonStyles';
import titleCase from '@app/utils/titleCase';

import schema from '@app/db/schema';
import useDB from '@app/hooks/useDB';
import { save } from '@app/db/relationalUtils';

function RelationalPouchDBSaveScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'RelationalPouchDBSave'>) {
  const { type, initialData } = route.params;

  const typeDef = schema[type];
  if (!typeDef) throw new Error(`No such type: ${type}`);

  const { db } = useDB();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [data, setData] = useState<Record<string, any>>(initialData || {});

  const [saving, setSaving] = useState(false);
  const isDone = useRef(false);
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await save(db, type, data);
      isDone.current = true;
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Unknown error');
    } finally {
      setSaving(false);
    }
  }, [data, db, navigation, type]);

  const handleLeave = useCallback(
    (confirm: () => void) => {
      if (isDone.current) {
        confirm();
        return;
      }

      if (saving) return;

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
    [saving],
  );

  return (
    <ModalContent
      navigation={navigation}
      preventClose={hasUnsavedChanges}
      confirmCloseFn={handleLeave}
      title={`${data.id ? 'Edit' : 'Add'} ${titleCase(type)}`}
      action1Label="Save"
      action1MaterialIconName="check"
      action1Variant="strong"
      onAction1Press={handleSave}
      action2Label="Cancel"
      onAction2Press={saving ? undefined : () => navigation.goBack()}
    >
      <ScrollView
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <InsetGroup style={commonStyles.mt16}>
          {[
            ...Object.entries(typeDef.dataSchema.properties),
            // ...Object.entries(typeDef.dataSchema.optionalProperties),
          ]
            .flatMap(([field, fieldDef]) => [
              (() => {
                const relation =
                  typeDef.relations && (typeDef.relations as any)[field];
                const relationType = relation && Object.keys(relation)[0];

                switch (true) {
                  case fieldDef.type === 'string':
                    return (
                      <InsetGroup.Item
                        key={field}
                        compactLabel
                        label={titleCase(field)}
                        detail={(() => {
                          switch (relationType) {
                            case 'belongsTo':
                              return (
                                <>
                                  <InsetGroup.TextInput
                                    alignRight
                                    style={commonStyles.mr4}
                                    placeholder={`Enter ${field}`}
                                    value={data[field]}
                                    onChangeText={t => {
                                      setData(d => ({ ...d, [field]: t }));
                                      setHasUnsavedChanges(true);
                                    }}
                                  />
                                  <InsetGroup.ItemDetailButton
                                    label="Select"
                                    onPress={() =>
                                      navigation.push(
                                        'RelationalPouchDBTypeDataSelect',
                                        {
                                          type:
                                            relation[relationType].type ||
                                            relation[relationType],
                                          callback: id => {
                                            setData(d => ({
                                              ...d,
                                              [field]: id,
                                            }));
                                            setHasUnsavedChanges(true);
                                          },
                                        },
                                      )
                                    }
                                  />
                                </>
                              );
                            default:
                              return (
                                <InsetGroup.TextInput
                                  alignRight
                                  placeholder={`Enter ${field}`}
                                  value={data[field]}
                                  onChangeText={t => {
                                    setData(d => ({ ...d, [field]: t }));
                                    setHasUnsavedChanges(true);
                                  }}
                                />
                              );
                          }
                        })()}
                      />
                    );

                  default:
                    return (
                      <InsetGroup.Item
                        key={field}
                        compactLabel
                        label={titleCase(field)}
                        detail={`Unsupported: ${JSON.stringify(fieldDef)}`}
                      />
                    );
                }
              })(),
              <InsetGroup.ItemSeperator key={`s-${field}`} />,
            ])
            .slice(0, -1)}
        </InsetGroup>
      </ScrollView>
    </ModalContent>
  );
}

export default RelationalPouchDBSaveScreen;
