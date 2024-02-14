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
  Switch,
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
} from '@invt/data/types';
import { getValidationErrorFromZodSafeParseReturnValue } from '@invt/data/utils/validation-utils';
import { AIRTABLE_TEMPLATE_BASE_URL, schema } from '@invt/integration-airtable';

import { DEFAULT_COLLECTION_ICON_NAME } from '@app/consts/default-icons';
import { URLS } from '@app/consts/info';

import CollectionListItem from '@app/features/inventory/components/CollectionListItem';
import ItemListItem from '@app/features/inventory/components/ItemListItem';

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
  >({ __type: 'integration', integration_type: 'airtable', config: {} });
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

  const { data: selectedContainers } = useData(
    'item',
    config?.container_ids_to_sync || [],
    {
      disable: !config?.container_ids_to_sync,
    },
  );
  const handleAddContainer = useCallback(() => {
    navigation.navigate('SelectItem', {
      as: 'container',
      callback: container_id => {
        setData(d => ({
          ...d,
          config: {
            ...d.config,
            container_ids_to_sync: [
              ...(Array.isArray(d.config?.container_ids_to_sync)
                ? (d.config?.container_ids_to_sync as any)
                : []),
              container_id,
            ].filter((v, i, a) => a.indexOf(v) === i),
          },
        }));
      },
    });
  }, [navigation]);
  const handleContainerPress = useCallback(
    (it: ValidDataTypeWithID<'item'> | InvalidDataTypeWithID<'item'>) => {
      showActionSheet([
        {
          name: it.__valid ? `Remove "${it.name}"` : 'Remove',
          destructive: true,
          onSelect: () => {
            setData(d => ({
              ...d,
              config: {
                ...d.config,
                container_ids_to_sync: [
                  ...(Array.isArray(d.config?.container_ids_to_sync)
                    ? (d.config?.container_ids_to_sync as any)
                    : []),
                ].filter(v => v !== it.__id),
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
    if (
      config.scope_type === 'collections' &&
      (config?.collection_ids_to_sync?.length || 0) <= 0
    ) {
      Alert.alert('Pleas at least select one collection to sync.');
      return;
    }
    if (
      config.scope_type === 'containers' &&
      (config?.container_ids_to_sync?.length || 0) <= 0
    ) {
      Alert.alert('Pleas at least select one container to sync.');
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
  }, [
    config?.collection_ids_to_sync?.length,
    config?.container_ids_to_sync?.length,
    config.scope_type,
    data,
    navigation,
    save,
  ]);

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
          header="Items Scope"
          footer={(() => {
            switch (config.scope_type) {
              case 'collections':
                return 'Sync items in the selected collections.';
              case 'containers':
                return 'Sync items under the selected containers.';
              default:
                return undefined;
            }
          })()}
        >
          <UIGroup.ListItem
            label="Collections"
            selected={config.scope_type === 'collections'}
            onPress={() =>
              setData(d => ({
                ...d,
                config: { ...d.config, scope_type: 'collections' },
              }))
            }
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Containers"
            selected={config.scope_type === 'containers'}
            onPress={() =>
              setData(d => ({
                ...d,
                config: { ...d.config, scope_type: 'containers' },
              }))
            }
          />
        </UIGroup>

        {config.scope_type === 'collections' && (
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
                <UIGroup.ListItemSeparator key={`${c.__id}-s`} />,
              ])}
            <UIGroup.ListItem
              button
              label="Add Collection..."
              onPress={handleAddCollection}
            />
          </UIGroup>
        )}

        {config.scope_type === 'containers' && (
          <UIGroup
            loading={initialDataLoading}
            header="Containers to Sync"
            footer="Select the containers to be synced to the Airtable base."
          >
            {!!selectedContainers &&
              selectedContainers.flatMap(it => [
                it.__valid ? (
                  <ItemListItem
                    key={it.__id}
                    item={it}
                    navigable={false}
                    onPress={() => handleContainerPress(it)}
                  />
                ) : (
                  <UIGroup.ListItem
                    key={it.__id}
                    label={it.__id || ''}
                    onPress={() => handleContainerPress(it)}
                  />
                ),
                <UIGroup.ListItemSeparator key={`${it.__id}-s`} />,
              ])}
            <UIGroup.ListItem
              button
              label="Add Container..."
              onPress={handleAddContainer}
            />
          </UIGroup>
        )}

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

        <UIGroup
          loading={initialDataLoading}
          header="Images Public Endpoint (Optional)"
          // eslint-disable-next-line react/no-unstable-nested-components
          footer={({ textProps }) => (
            <Text {...textProps}>
              To sync item images to Airtable, you will need to have a public
              images endpoint, which Airtable will use to download your images.
              {'\n\n'}
              The endpoint needs to be able to serve images via{' '}
              <Text style={commonStyles.fontMonospaced}>
                {'<endpoint>/<image_id>.<jpg|png>'}
              </Text>
              . For example, if you provide{' '}
              <Text style={commonStyles.fontMonospaced}>
                {'https://example.com/images'}
              </Text>{' '}
              as the endpoint, images should be accessible via URLs such as{' '}
              <Text style={commonStyles.fontMonospaced}>
                {'https://example.com/images/sample-image-id.jpg'}
              </Text>
              .{'\n\n'}
              See{' '}
              <Link
                onPress={() =>
                  Linking.openURL(
                    URLS.airtable_integration_using_public_images_endpoint,
                  )
                }
              >
                the docs
              </Link>{' '}
              for more information
            </Text>
          )}
        >
          <UIGroup.ListTextInputItem
            placeholder="e.g.: https://my.server/database/images"
            value={
              typeof data?.config?.images_public_endpoint === 'string'
                ? data?.config?.images_public_endpoint
                : ''
            }
            onChangeText={text =>
              setData(d => ({
                ...d,
                config: {
                  ...d.config,
                  images_public_endpoint: text.replace(/[\r\n]/g, '').trim(),
                },
              }))
            }
            autoCapitalize="none"
            spellCheck={false}
            autoCorrect={false}
            multiline
            selectTextOnFocus
            returnKeyType="done"
            monospaced
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            horizontalLabel
            label="Upload Images to Airtable"
            inputElement={
              <Switch
                disabled={!config.images_public_endpoint}
                value={
                  !config.disable_uploading_item_images &&
                  !!config.images_public_endpoint
                }
                onValueChange={v =>
                  setData(d => ({
                    ...d,
                    config: {
                      ...d.config,
                      disable_uploading_item_images: !v,
                    },
                  }))
                }
              />
            }
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
