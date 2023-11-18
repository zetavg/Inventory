import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { z } from 'zod';

import { DataMeta } from '@deps/data/types';
import { getValidationErrorFromZodSafeParseReturnValue } from '@deps/data/utils/validation-utils';
import { AIRTABLE_TEMPLATE_BASE_URL, schema } from '@deps/integration-airtable';

import { DEFAULT_COLLECTION_ICON_NAME } from '@app/consts/default-icons';
import { URLS } from '@app/consts/info';

import { DataTypeWithID, useData, useSave } from '@app/data';

import commonStyles from '@app/utils/commonStyles';
import mapObjectValues from '@app/utils/mapObjectValues';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useAutoFocus from '@app/hooks/useAutoFocus';
import useDeepCompare from '@app/hooks/useDeepCompare';

import Icon, {
  verifyIconColorWithDefault,
  verifyIconName,
  verifyIconNameWithDefault,
} from '@app/components/Icon';
import ModalContent from '@app/components/ModalContent';
import { Link } from '@app/components/Text';
import UIGroup from '@app/components/UIGroup';
function NewOrEditAirtableIntegrationScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'NewOrEditAirtableIntegration'>) {
  const { integrationId, afterDelete } = route.params;

  const { save, saving } = useSave();

  const [initialData, setInitialData] = useState<
    DataMeta<'integration'> & Partial<DataTypeWithID<'integration'>>
  >({ __type: 'integration', integration_type: 'airtable' });
  const [data, setData] = useState<
    DataMeta<'integration'> & Partial<DataTypeWithID<'integration'>>
  >(initialData);
  useEffect(() => {
    setData(d => ({ ...d, ...initialData }));
  }, [initialData]);

  const { data: loadedData, loading: initialDataLoading } = useData(
    'integration',
    integrationId || '',
    { disable: !integrationId },
  );
  const initialDataLoaded = useRef(false);
  useEffect(() => {
    if (!loadedData?.__valid) return;
    if (initialDataLoaded.current) return;
    setInitialData(loadedData);
    initialDataLoaded.current = true;
  }, [loadedData]);

  const config = useMemo<Partial<z.infer<typeof schema.config>>>(() => {
    return mapObjectValues(schema.config.shape, (t, n) => {
      try {
        return t.parse((data.config || {})[n]) as any;
      } catch (e) {
        return undefined;
      }
    });
  }, [data.config]);

  const hasChanges = !useDeepCompare(initialData, data);

  const collectionIdsToSync0 = config?.collection_ids_to_sync?.[0];
  const { data: selectedCollection } = useData(
    'collection',
    collectionIdsToSync0 || '',
    {
      disable: !collectionIdsToSync0,
    },
  );
  const handleOpenSelectCollection = useCallback(() => {
    navigation.navigate('SelectCollection', {
      defaultValue: collectionIdsToSync0,
      callback: collection_id => {
        setData(d => ({
          ...d,
          config: { ...d.config, collection_ids_to_sync: [collection_id] },
        }));
      },
    });
  }, [collectionIdsToSync0, navigation]);

  const isDone = useRef(false);
  const handleSave = useCallback(async () => {
    if (!collectionIdsToSync0) {
      Alert.alert('Pleas at least select a collection to sync.');
      return;
    }

    const configSafeParseResults = schema.config.safeParse(data.config);
    const configValidationError = getValidationErrorFromZodSafeParseReturnValue(
      configSafeParseResults,
    );
    if (configValidationError) {
      Alert.alert(
        'Please fix the following errors',
        configValidationError.messages.map(m => `• ${m}`).join('\n'),
      );
      return;
    }

    const saved = await save(data);
    if (saved) {
      isDone.current = true;
      navigation.goBack();
    }
  }, [collectionIdsToSync0, data, navigation, save]);

  const handleLeave = useCallback(
    (confirm: () => void) => {
      if (isDone.current) {
        confirm();
        return;
      }

      if (saving) return;

      Alert.alert(
        'Discard changes?',
        'The collection is not saved yet. Are you sure to discard the changes and leave?',
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

  const doDelete = useCallback(async () => {
    const deleted = await save({
      ...initialData,
      __deleted: true,
    });
    if (deleted) {
      navigation.goBack();
      if (typeof afterDelete === 'function') {
        afterDelete();
      }
    }
  }, [afterDelete, initialData, navigation, save]);
  const handleDeleteButtonPressed = useCallback(() => {
    Alert.alert(
      'Confirmation',
      `Are you sure you want to delete the collection "${initialData.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: doDelete,
        },
      ],
    );
  }, [doDelete, initialData.name]);

  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ModalContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);
  const nameInputRef = useRef<TextInput>(null);
  useAutoFocus(nameInputRef, {
    scrollViewRef,
    disable: !!data.name,
  });

  return (
    <ModalContent
      navigation={navigation}
      preventClose={hasChanges}
      confirmCloseFn={handleLeave}
      title={`${initialData.__id ? 'Edit' : 'New'} Airtable Integration`}
      action1Label="Save"
      action1MaterialIconName="check"
      action1Variant="strong"
      onAction1Press={saving ? undefined : handleSave}
      action2Label="Cancel"
      onAction2Press={saving ? undefined : () => navigation.goBack()}
    >
      <ModalContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />
        <UIGroup
          asSectionHeader
          style={[commonStyles.mb0, commonStyles.mt0]}
          // eslint-disable-next-line react/no-unstable-nested-components
          footer={({ textProps }) => (
            <Text {...textProps}>
              ⚠ Based on your{' '}
              <Link
                onPress={() => Linking.openURL('https://airtable.com/pricing')}
              >
                plan
              </Link>{' '}
              on Airtable, Airtable may have limitations on records per base and
              API calls per month.{'\n\n'}⚠ Be sure to read and understand the{' '}
              <Link
                onPress={() =>
                  Linking.openURL(URLS.airtable_integration_limitations)
                }
              >
                limitations
              </Link>{' '}
              before you use this integration.
            </Text>
          )}
        />
        <UIGroup loading={initialDataLoading}>
          <UIGroup.ListTextInputItem
            ref={nameInputRef}
            label="Name"
            placeholder="Enter a recognizable name for this integration"
            autoCapitalize="words"
            value={data.name}
            returnKeyType={!data.collection_reference_number ? 'next' : 'done'}
            onChangeText={text => {
              setData(d => ({
                ...d,
                name: text,
              }));
            }}
            {...kiaTextInputProps}
          />
        </UIGroup>

        <UIGroup
          loading={initialDataLoading}
          header="Data to Sync"
          footer="Select the scope of items to be synced to the Airtable base."
        >
          <UIGroup.ListTextInputItem
            label="Collection"
            // eslint-disable-next-line react/no-unstable-nested-components
            inputElement={({ textProps, iconProps }) => (
              <TouchableOpacity
                style={commonStyles.flex1}
                onPress={handleOpenSelectCollection}
              >
                <View
                  style={[
                    commonStyles.flex1,
                    commonStyles.row,
                    commonStyles.alignItemsCenter,
                    { gap: 8, marginVertical: 4 },
                  ]}
                >
                  {/* eslint-disable-next-line react/no-unstable-nested-components */}
                  {(() => {
                    if (!collectionIdsToSync0) {
                      return (
                        <Text
                          {...textProps}
                          style={[textProps.style, commonStyles.opacity05]}
                        >
                          Select...
                        </Text>
                      );
                    } else if (
                      collectionIdsToSync0 === selectedCollection?.__id
                    ) {
                      return (
                        <>
                          <Icon
                            {...iconProps}
                            name={verifyIconNameWithDefault(
                              selectedCollection.icon_name ||
                                DEFAULT_COLLECTION_ICON_NAME,
                            )}
                            color={verifyIconColorWithDefault(
                              selectedCollection.icon_color,
                            )}
                          />
                          <Text {...textProps}>
                            {typeof selectedCollection.name === 'string'
                              ? selectedCollection.name
                              : selectedCollection.__id}
                          </Text>
                        </>
                      );
                    } else {
                      return (
                        <Text
                          {...textProps}
                          style={[textProps.style, commonStyles.opacity05]}
                        >
                          Loading ({collectionIdsToSync0})...
                        </Text>
                      );
                    }
                  })()}
                </View>
              </TouchableOpacity>
            )}
            controlElement={
              <UIGroup.ListTextInputItem.Button
                onPress={handleOpenSelectCollection}
              >
                Select
              </UIGroup.ListTextInputItem.Button>
            }
            {...kiaTextInputProps}
          />
        </UIGroup>

        <UIGroup
          loading={initialDataLoading}
          header="Airtable Base ID"
          // eslint-disable-next-line react/no-unstable-nested-components
          footer={({ textProps }) => (
            <Text {...textProps}>
              You will need to duplicate{' '}
              <Link onPress={() => Linking.openURL(AIRTABLE_TEMPLATE_BASE_URL)}>
                this template base
              </Link>{' '}
              and get it's base ID from the URL. Check{' '}
              <Link
                onPress={() =>
                  Linking.openURL(URLS.airtable_integration_setup_base_doc)
                }
              >
                here
              </Link>{' '}
              for more instructions.
            </Text>
          )}
        >
          <UIGroup.ListTextInputItem
            placeholder="Enter Airtable Base ID"
            value={
              typeof data?.config?.airtable_base_id === 'string'
                ? data?.config?.airtable_base_id
                : ''
            }
            onChangeText={text =>
              setData(d => ({
                ...d,
                config: {
                  ...d.config,
                  airtable_base_id: text.replace(/[?/]/gm, ''),
                },
              }))
            }
            autoCapitalize="none"
            spellCheck={false}
            selectTextOnFocus
            returnKeyType="done"
            monospaced
            {...kiaTextInputProps}
          />
        </UIGroup>

        {!!initialData.__id && (
          <UIGroup loading={initialDataLoading}>
            <UIGroup.ListItem
              button
              destructive
              label={`Delete "${initialData?.name}"`}
              onPress={handleDeleteButtonPressed}
            />
          </UIGroup>
        )}
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default NewOrEditAirtableIntegrationScreen;
