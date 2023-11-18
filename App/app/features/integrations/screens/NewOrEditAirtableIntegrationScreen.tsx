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

import {
  DataMeta,
  InvalidDataTypeWithID,
  ValidDataTypeWithID,
} from '@deps/data/types';
import { getValidationErrorFromZodSafeParseReturnValue } from '@deps/data/utils/validation-utils';
import { AIRTABLE_TEMPLATE_BASE_URL, schema } from '@deps/integration-airtable';

import { DEFAULT_COLLECTION_ICON_NAME } from '@app/consts/default-icons';
import { URLS } from '@app/consts/info';

import CollectionListItem from '@app/features/inventory/components/CollectionListItem';

import { DataTypeWithID, useData, useSave } from '@app/data';

import commonStyles from '@app/utils/commonStyles';
import mapObjectValues from '@app/utils/mapObjectValues';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useActionSheet from '@app/hooks/useActionSheet';
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
  const { showActionSheet } = useActionSheet();

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

  const { data: selectedCollections } = useData(
    'collection',
    config?.collection_ids_to_sync || [],
    {
      disable: !config?.collection_ids_to_sync,
    },
  );
  const handleAddCollection = useCallback(() => {
    navigation.navigate('SelectCollection', {
      callback: collection_id => {
        setData(d => ({
          ...d,
          config: {
            ...d.config,
            collection_ids_to_sync: [
              ...(Array.isArray(d.config?.collection_ids_to_sync)
                ? (d.config?.collection_ids_to_sync as any)
                : []),
              collection_id,
            ].filter((v, i, a) => a.indexOf(v) === i),
          },
        }));
      },
    });
  }, [navigation]);
  const handleCollectionPress = useCallback(
    (
      c:
        | ValidDataTypeWithID<'collection'>
        | InvalidDataTypeWithID<'collection'>,
    ) => {
      showActionSheet([
        {
          name: c.__valid ? `Remove "${c.name}"` : 'Remove',
          destructive: true,
          onSelect: () => {
            setData(d => ({
              ...d,
              config: {
                ...d.config,
                collection_ids_to_sync: [
                  ...(Array.isArray(d.config?.collection_ids_to_sync)
                    ? (d.config?.collection_ids_to_sync as any)
                    : []),
                ].filter(v => v !== c.__id),
              },
            }));
          },
        },
      ]);
    },
    [showActionSheet],
  );

  const isDone = useRef(false);
  const handleSave = useCallback(async () => {
    if ((config?.collection_ids_to_sync?.length || 0) <= 0) {
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
  }, [config?.collection_ids_to_sync?.length, data, navigation, save]);

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
          header="Collections to Sync"
          footer="Select the collections to be synced to the Airtable base."
        >
          {!!selectedCollections &&
            selectedCollections.flatMap(c => [
              c.__valid ? (
                <CollectionListItem
                  key={c.__id}
                  collection={c}
                  navigable={false}
                  onPress={() => handleCollectionPress(c)}
                />
              ) : (
                <UIGroup.ListItem
                  key={c.__id}
                  label={c.__id || ''}
                  onPress={() => handleCollectionPress(c)}
                />
              ),
              <UIGroup.ListItemSeparator />,
            ])}
          <UIGroup.ListItem
            button
            label="Add Collection..."
            onPress={handleAddCollection}
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
