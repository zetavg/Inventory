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
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import RNSInfo from 'react-native-sensitive-info';

import { z } from 'zod';

import { DataMeta } from '@deps/data/types';
import { AirtableAPIError } from '@deps/integration-airtable/AirtableAPI';
import schema from '@deps/integration-airtable/schema';
import syncWithAirtable, {
  SyncWithAirtableProgress,
} from '@deps/integration-airtable/syncWithAirtable';

import CollectionListItem from '@app/features/inventory/components/CollectionListItem';

import { DataTypeWithID, onlyValid, useData, useSave } from '@app/data';
import {
  getGetData,
  getGetDataCount,
  getGetDatum,
  getSaveDatum,
} from '@app/data/functions';

import { useDB } from '@app/db';

import commonStyles from '@app/utils/commonStyles';
import mapObjectValues from '@app/utils/mapObjectValues';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useAutoFocus from '@app/hooks/useAutoFocus';
import useDeepCompare from '@app/hooks/useDeepCompare';
import useLogger from '@app/hooks/useLogger';

import ModalContent from '@app/components/ModalContent';
import { Link } from '@app/components/Text';
import TimeAgo from '@app/components/TimeAgo';
import UIGroup from '@app/components/UIGroup';

const DATE_DISPLAY_TYPES = ['time_ago', 'locale'] as const;

function AirtableIntegrationScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'AirtableIntegration'>) {
  const { integrationId } = route.params;

  const logger = useLogger('AirtableIntegrationScreen');
  const { db } = useDB();

  const { data, loading, reload } = useData('integration', integrationId);
  const integration = onlyValid(data);

  const config = useMemo<Partial<z.infer<typeof schema.config>>>(() => {
    return mapObjectValues(schema.config.shape, (t, n) => {
      try {
        return t.parse(((data?.config as any) || {})[n]) as any;
      } catch (e) {
        return undefined;
      }
    });
  }, [data?.config]);
  const { data: collectionsToSync, loading: collectionsToSyncLoading } =
    useData('collection', config.collection_ids_to_sync || []);

  const [working, setWorking] = useState(false);
  const isWorking = useRef(working);
  isWorking.current = working;

  const [syncProgress, setSyncProgress] = useState<SyncWithAirtableProgress>(
    {},
  );
  // useEffect(() => {
  //   if (!syncProgress.base_id) return;

  //   if (syncProgress.base_id !== (data?.data as any)?.base_id) {
  //     reload();
  //   }
  // }, [data?.data, reload, syncProgress.base_id]);
  useEffect(() => {
    if (!syncProgress.last_synced_at) return;

    if (syncProgress.last_synced_at !== (data?.data as any)?.last_synced_at) {
      reload();
    }
  }, [data?.data, reload, syncProgress.last_synced_at]);

  const [shouldStop, setShouldStop] = useState<boolean>(false);
  const shouldStopRef = useRef(shouldStop);
  shouldStopRef.current = shouldStop;

  const [lastSyncAtDisplayType, setLastSyncAtDisplayType] =
    useState<(typeof DATE_DISPLAY_TYPES)[number]>('time_ago');
  const rotateLastSyncAtDisplayType = useCallback(() => {
    setLastSyncAtDisplayType(type => {
      const currentIndex = DATE_DISPLAY_TYPES.indexOf(type);
      const nextIndex = (currentIndex + 1) % DATE_DISPLAY_TYPES.length;
      return DATE_DISPLAY_TYPES[nextIndex];
    });
  }, []);

  const getSecretsFromUser = useCallback(async () => {
    if (!integration?.__id) return;

    const gotSecrets = await new Promise(resolve => {
      navigation.push('GetSecrets', {
        secrets: [
          {
            name: 'Airtable Access Token',
            key: 'airtable_access_token',
            // eslint-disable-next-line react/no-unstable-nested-components
            description: ({ textProps }) => (
              <Text {...textProps}>
                You can get a Airtable access token on{' '}
                <Link
                  onPress={() =>
                    Linking.openURL('https://airtable.com/create/tokens')
                  }
                >
                  https://airtable.com/create/tokens
                </Link>
                .{'\n\n'}The access token must include scopes{' '}
                <Text style={commonStyles.fontMonospaced}>
                  data.records:read
                </Text>
                ,{' '}
                <Text style={commonStyles.fontMonospaced}>
                  data.records:write
                </Text>
                ,{' '}
                <Text style={commonStyles.fontMonospaced}>data.bases:read</Text>{' '}
                and{' '}
                <Text style={commonStyles.fontMonospaced}>
                  data.bases:write
                </Text>
                , with access "all current and future bases" in your workspace.
                {'\n\n'}This access token will only be stored on this device,
                and never be sync or uploaded to any remote servers.
              </Text>
            ),
          },
        ],
        callback: resolve,
      });
    });

    if (gotSecrets) {
      await RNSInfo.setItem(integrationId, JSON.stringify(gotSecrets), {
        sharedPreferencesName: 'shared_preferences',
        keychainService: 'integration_secrets',
      });
    }

    return gotSecrets;
  }, [integration?.__id, integrationId, navigation]);

  const handleSync = useCallback(async () => {
    if (!db) return;
    if (!integrationId) return;
    if (isWorking.current) return;

    setWorking(true);
    setSyncProgress({});

    try {
      const secretsText = await RNSInfo.getItem(integrationId, {
        sharedPreferencesName: 'shared_preferences',
        keychainService: 'integration_secrets',
      });
      let secrets;

      try {
        secrets = JSON.parse(secretsText);
      } catch (e) {}

      let { airtable_access_token } = secrets || {};
      let hasAuthError = false;
      let retries = 0;
      let gotAirtableBaseSchema = false;

      while (true) {
        try {
          if (!airtable_access_token || hasAuthError) {
            secrets = await getSecretsFromUser();
            airtable_access_token = (secrets as any)?.airtable_access_token;
          }

          const getDatum = getGetDatum({ db, logger });
          const getData = getGetData({ db, logger });
          const getDataCount = getGetDataCount({ db, logger });
          const saveDatum = getSaveDatum({ db, logger });

          for await (const p of syncWithAirtable(
            {
              integrationId,
              secrets,
              fullSync: true,
            },
            {
              fetch,
              getDatum,
              getData,
              getDataCount,
              saveDatum,
            },
          )) {
            if (!gotAirtableBaseSchema) {
              if (p.base_schema) {
                logger.info('Got Airtable base schema', {
                  details: JSON.stringify(p.base_schema, null, 2),
                });
                gotAirtableBaseSchema = true;
              }
            }
            setSyncProgress({ ...p });
            // Need this for UI to update
            await new Promise(resolve => setTimeout(resolve, 10));
            if (shouldStopRef.current) break;
          }
          break;
        } catch (e) {
          if (retries > 2) throw e;

          if (
            e instanceof AirtableAPIError &&
            e.type === 'AUTHENTICATION_REQUIRED'
          ) {
            hasAuthError = true;
            retries += 1;
          } else {
            throw e;
          }
        }
      }
    } catch (e) {
      logger.error(e, { showAlert: true });
    } finally {
      setWorking(false);
    }
  }, [db, logger, getSecretsFromUser, integrationId]);

  const handleLeave = useCallback((confirm: () => void) => {
    if (!isWorking.current) {
      confirm();
      return;
    } else {
      Alert.alert(
        'Still Working',
        'You cannot leave while synchronization is in progress. Please wait for the synchronization to finish, or stop it.',
      );
    }

    // Alert.alert(
    //   'Discard changes?',
    //   'The collection is not saved yet. Are you sure to discard the changes and leave?',
    //   [
    //     { text: "Don't leave", style: 'cancel', onPress: () => {} },
    //     {
    //       text: 'Discard',
    //       style: 'destructive',
    //       onPress: confirm,
    //     },
    //   ],
    // );
  }, []);

  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ModalContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  return (
    <ModalContent
      navigation={navigation}
      preventClose={true}
      confirmCloseFn={handleLeave}
      title={integration?.name || 'Airtable Integration'}
    >
      <ModalContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />

        <UIGroup>
          <UIGroup.ListItem label="Integration Type" detail="Airtable" />
        </UIGroup>

        {!!collectionsToSync && collectionsToSync.length > 0 && (
          <UIGroup header="Collections to Sync">
            {UIGroup.ListItemSeparator.insertBetween(
              collectionsToSync.map(c =>
                c.__valid ? (
                  <CollectionListItem
                    key={c.__id}
                    collection={c}
                    navigable={false}
                    onPress={() => {}}
                  />
                ) : (
                  <UIGroup.ListItem label={c.__id} />
                ),
              ),
            )}
          </UIGroup>
        )}

        <UIGroup loading={loading}>
          <UIGroup.ListItem
            label="Last Synced"
            adjustsDetailFontSizeToFit
            // eslint-disable-next-line react/no-unstable-nested-components
            detail={({ textProps }) => (
              <TouchableWithoutFeedback onPress={rotateLastSyncAtDisplayType}>
                <View>
                  {
                    // eslint-disable-next-line react/no-unstable-nested-components
                    (() => {
                      const { last_synced_at } = integration?.data || {};
                      if (typeof last_synced_at !== 'number') {
                        return <Text {...textProps}>Never Synced</Text>;
                      }

                      switch (lastSyncAtDisplayType) {
                        case 'time_ago':
                          return (
                            <TimeAgo
                              date={last_synced_at}
                              textProps={textProps}
                            />
                          );
                        case 'locale':
                          return (
                            <Text {...textProps}>
                              {new Date(last_synced_at).toLocaleString()}
                            </Text>
                          );
                        default: {
                          const unhandledCase: never = lastSyncAtDisplayType;
                          return (
                            <Text {...textProps}>
                              Unhandled: {unhandledCase}
                            </Text>
                          );
                        }
                      }
                    })()
                  }
                </View>
              </TouchableWithoutFeedback>
            )}
          />
          <UIGroup.ListItemSeparator />
          {typeof syncProgress.toPush === 'number' && (
            <>
              <UIGroup.ListItem
                label="Push"
                adjustsDetailFontSizeToFit
                detail={`${
                  typeof syncProgress.pushed === 'number'
                    ? syncProgress.pushed
                    : 0
                }/${syncProgress.toPush}`}
              />
              <UIGroup.ListItemSeparator />
            </>
          )}
          {typeof syncProgress.toPull === 'number' && (
            <>
              <UIGroup.ListItem
                label="Pull"
                adjustsDetailFontSizeToFit
                detail={`${
                  typeof syncProgress.pulled === 'number'
                    ? syncProgress.pulled
                    : 0
                }/${syncProgress.toPull}`}
              />
              <UIGroup.ListItemSeparator />
            </>
          )}
          {typeof syncProgress.apiCalls === 'number' && (
            <>
              <UIGroup.ListItem
                label="Airtable API Calls"
                adjustsDetailFontSizeToFit
                detail={`${syncProgress.apiCalls}`}
              />
              <UIGroup.ListItemSeparator />
            </>
          )}
          <UIGroup.ListItem
            button
            disabled={working}
            label="Sync Now"
            onPress={handleSync}
          />
          {working && (
            <>
              <UIGroup.ListItemSeparator />
              <UIGroup.ListItem
                button
                destructive
                label="Stop Synchronization"
                onPress={() => setShouldStop(true)}
              />
            </>
          )}
        </UIGroup>

        {typeof integration?.config?.airtable_base_id === 'string' && (
          <UIGroup>
            <UIGroup.ListItem
              label="Go to connected Base on Airtable"
              button
              onPress={() =>
                Linking.openURL(
                  `https://airtable.com/${integration?.config?.airtable_base_id}`,
                )
              }
            />
          </UIGroup>
        )}

        <UIGroup loading={working}>
          <UIGroup.ListItem
            button
            disabled={working}
            label="Edit Integration..."
            onPress={() =>
              navigation.push('NewOrEditAirtableIntegration', {
                integrationId: route.params.integrationId,
                afterDelete: () => {
                  navigation.goBack();
                },
              })
            }
          />
        </UIGroup>
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default AirtableIntegrationScreen;
