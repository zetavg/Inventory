import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Linking,
  ScrollView,
  Switch,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import RNSInfo from 'react-native-sensitive-info';

import { z } from 'zod';

import { AirtableAPIError } from '@deps/integration-airtable/AirtableAPI';
import schema from '@deps/integration-airtable/schema';
import syncWithAirtable, {
  SyncWithAirtableProgress,
} from '@deps/integration-airtable/syncWithAirtable';

import { DEFAULT_LAYOUT_ANIMATION_CONFIG } from '@app/consts/animations';
import { URLS } from '@app/consts/info';

import CollectionListItem from '@app/features/inventory/components/CollectionListItem';
import ItemListItem from '@app/features/inventory/components/ItemListItem';

import { onlyValid, useData } from '@app/data';
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
  const { data: containersToSync, loading: containersToSyncLoading } = useData(
    'item',
    config.container_ids_to_sync || [],
  );

  const [syncing, setSyncing] = useState(false);
  const isSyncing = useRef(syncing);
  isSyncing.current = syncing;

  const [syncProgress, setSyncProgress] = useState<SyncWithAirtableProgress>(
    {},
  );
  const syncProgressRef = useRef(syncProgress);
  syncProgressRef.current = syncProgress;
  const [syncErrored, setSyncErrored] = useState(false);
  // useEffect(() => {
  //   if (!syncProgress.base_id) return;

  //   if (syncProgress.base_id !== (data?.data as any)?.base_id) {
  //     reload();
  //   }
  // }, [data?.data, reload, syncProgress.base_id]);
  // useEffect(() => {
  //   if (!syncProgress.last_synced_at) return;

  //   if (syncProgress.last_synced_at !== (data?.data as any)?.last_synced_at) {
  //     reload();
  //   }
  // }, [data?.data, reload, syncProgress.last_synced_at]);

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

    const gotSecrets = await new Promise(
      (resolve: (secrets: { [key: string]: string } | null) => void) => {
        navigation.push('GetSecrets', {
          secrets: [
            {
              name: 'Airtable Access Token',
              key: 'airtable_access_token',
              defaultValue: '',
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
                  <Text style={commonStyles.fontMonospaced}>
                    data.bases:read
                  </Text>{' '}
                  and{' '}
                  <Text style={commonStyles.fontMonospaced}>
                    data.bases:write
                  </Text>
                  , with access "all current and future bases" in your
                  workspace.
                  {'\n\n'}See{' '}
                  <Link
                    onPress={() =>
                      Linking.openURL(
                        URLS.airtable_integration_get_personal_access_token_doc,
                      )
                    }
                  >
                    this document
                  </Link>{' '}
                  for more instructions.{'\n\n'}This access token will only be
                  stored on this device, and never be sync or uploaded to any
                  remote servers.
                </Text>
              ),
            },
          ],
          callback: resolve,
        });
      },
    );

    if (gotSecrets) {
      await RNSInfo.setItem(integrationId, JSON.stringify(gotSecrets), {
        sharedPreferencesName: 'shared_preferences',
        keychainService: 'integration_secrets',
      });
    }

    return gotSecrets;
  }, [integration?.__id, integrationId, navigation]);

  const [fullSync, setFullSync] = useState(false);
  const handleSync = useCallback(async () => {
    if (!db) return;
    if (!integrationId) return;
    if (isSyncing.current) return;

    setShouldStop(false);
    setSyncing(true);
    setSyncProgress({});
    setSyncErrored(false);

    try {
      const secretsText = await RNSInfo.getItem(integrationId, {
        sharedPreferencesName: 'shared_preferences',
        keychainService: 'integration_secrets',
      });
      let secrets: { [key: string]: string } | null | undefined;

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
            secrets = (await getSecretsFromUser()) || {};
            airtable_access_token = ((secrets as any) || {})
              ?.airtable_access_token;

            if (!airtable_access_token) {
              throw new Error('No Airtable access token provided.');
            }
          }

          const getDatum = getGetDatum({ db, logger });
          const getData = getGetData({ db, logger });
          const getDataCount = getGetDataCount({ db, logger });
          const saveDatum = getSaveDatum({ db, logger });

          for await (const p of syncWithAirtable(
            {
              integrationId,
              secrets: secrets || {},
              fullSync,
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
            LayoutAnimation.configureNext(DEFAULT_LAYOUT_ANIMATION_CONFIG);
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
      logger.info('Airtable sync completed', {
        details: JSON.stringify({
          progress: (() => {
            const { base_schema: _, ...p } = syncProgressRef.current;
            return p;
          })(),
        }),
      });
    } catch (e) {
      setSyncErrored(true);
      logger.error(e, { showAlert: true });
    } finally {
      setSyncing(false);
      reload();
    }
  }, [db, integrationId, logger, getSecretsFromUser, fullSync, reload]);

  const handleLeave = useCallback((confirm: () => void) => {
    if (!isSyncing.current) {
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
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem label="Integration ID" detail={integrationId} />
        </UIGroup>

        {config.scope_type === 'collections' &&
          !!collectionsToSync &&
          collectionsToSync.length > 0 && (
            <UIGroup
              header="Collections to Sync"
              loading={loading || collectionsToSyncLoading}
            >
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

        {config.scope_type === 'containers' &&
          !!containersToSync &&
          containersToSync.length > 0 && (
            <UIGroup
              header="containers to Sync"
              loading={loading || containersToSyncLoading}
            >
              {UIGroup.ListItemSeparator.insertBetween(
                containersToSync.map(it =>
                  it.__valid ? (
                    <ItemListItem
                      key={it.__id}
                      item={it}
                      navigable={false}
                      onPress={() => {}}
                    />
                  ) : (
                    <UIGroup.ListItem label={it.__id} />
                  ),
                ),
              )}
            </UIGroup>
          )}

        <UIGroup loading={loading || syncing}>
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
        </UIGroup>

        {/*{(typeof syncProgress.toPush === 'number' ||
          typeof syncProgress.toPull === 'number' ||
          typeof syncProgress.pullErrored === 'number' ||
          typeof syncProgress.apiCalls === 'number') && (
          <UIGroup header="Sync Status">
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
            {typeof syncProgress.pullErrored === 'number' && (
              <>
                <UIGroup.ListItem
                  label="Pull Errored"
                  adjustsDetailFontSizeToFit
                  detail={`${syncProgress.pullErrored}`}
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
          </UIGroup>
        )}*/}

        <UIGroup
          loading={loading}
          // eslint-disable-next-line react/no-unstable-nested-components
          footer={({ textProps }) => (
            <Text {...textProps}>
              {(() => {
                if (syncProgress.status) {
                  let statusStr: string = syncErrored
                    ? 'Errored.'
                    : (() => {
                        switch (syncProgress.status) {
                          case 'initializing':
                            return 'Initializing...';
                          case 'syncing':
                            return 'Syncing...';
                          case 'syncing_collections':
                            return 'Syncing collections...';
                          case 'syncing_items':
                            return 'Syncing items...';
                          case 'done':
                            return 'Sync done.';
                        }
                      })();

                  if (syncProgress.recordsCreatedOnAirtable) {
                    statusStr += '\n';
                    statusStr += `${syncProgress.recordsCreatedOnAirtable.length} records created on Airtable.`;
                  }
                  if (syncProgress.recordsUpdatedOnAirtable) {
                    statusStr += '\n';
                    statusStr += `${syncProgress.recordsUpdatedOnAirtable.length} records updated on Airtable.`;
                  }
                  if (syncProgress.recordsRemovedFromAirtable) {
                    statusStr += '\n';
                    statusStr += `${syncProgress.recordsRemovedFromAirtable.length} records removed from Airtable.`;
                  }
                  if (syncProgress.dataCreatedFromAirtable) {
                    statusStr += '\n';
                    statusStr += `${syncProgress.dataCreatedFromAirtable.length} items created.`;
                  }
                  if (syncProgress.dataUpdatedFromAirtable) {
                    statusStr += '\n';
                    statusStr += `${syncProgress.dataUpdatedFromAirtable.length} items updated.`;
                  }
                  if (syncProgress.dataUpdateErrors) {
                    statusStr += '\n';
                    statusStr += `Cannot update ${syncProgress.dataUpdateErrors.length} items due to errors.`;
                  }
                  if (syncProgress.dataDeletedFromAirtable) {
                    statusStr += '\n';
                    statusStr += `${syncProgress.dataDeletedFromAirtable.length} items deleted.`;
                  }
                  if (syncProgress.apiCalls) {
                    statusStr += '\n';
                    statusStr += `${syncProgress.apiCalls} Airtable API calls used.`;
                  }

                  return statusStr;
                } else {
                  return 'Press "Start Synchronization" to start a synchronization.';
                }
              })()}
              {'\n\n'}
              By default, only modified records will be synced. If you want to
              sync all records (which may fix some synchronization errors),
              switch on "Full Sync".
            </Text>
          )}
        >
          <UIGroup.ListItem
            button
            disabled={syncing}
            label="Start Synchronization"
            onPress={handleSync}
          />
          {syncing && (
            <>
              <UIGroup.ListItemSeparator />
              <UIGroup.ListItem
                button
                destructive
                label="Abort Synchronization"
                onPress={() => setShouldStop(true)}
              />
            </>
          )}
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Full Sync"
            detail={
              <Switch
                value={fullSync}
                onValueChange={setFullSync}
                disabled={syncing}
              />
            }
          />
        </UIGroup>

        <UIGroup footer="Review data updated by this integration.">
          <UIGroup.ListItem
            label="Data Updated By This Integration"
            navigable
            onPress={() =>
              navigation.push('HistoryBatches', {
                createdBy: `integration-${integrationId}`,
                title: 'Data Changes',
              })
            }
          />
        </UIGroup>

        <UIGroup
          loading={loading || syncing}
          footer="This statistic represents the Airtable API usage for this month as self-calculated by this integration. It may not necessarily reflect the actual usage."
        >
          <UIGroup.ListItem
            label="API Calls This Month"
            detail={(() => {
              const { data: d } = integration || {};
              if (!d || typeof d !== 'object') return '0';
              const { airtable_api_calls } = d;
              if (!airtable_api_calls || typeof airtable_api_calls !== 'object')
                return '0';
              const count = (airtable_api_calls as any)[
                getCurrentYearAndMonth()
              ];
              if (typeof count !== 'number') return '0';

              return count.toString();
            })()}
          />
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

        <UIGroup loading={syncing}>
          <UIGroup.ListItem
            button
            disabled={syncing}
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

function getCurrentYearAndMonth() {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Ensures two-digit format
  return `${year}-${month}`;
}

export default AirtableIntegrationScreen;
