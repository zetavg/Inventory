import {
  DataMeta,
  GetData,
  GetDataConditions,
  GetDataCount,
  GetDatum,
  InvalidDataTypeWithID,
  SaveDatum,
  ValidDataTypeWithID,
} from '@deps/data/types';
import { onlyValid } from '@deps/data/utils';

import AirtableAPI, { AirtableAPIError, AirtableField } from './AirtableAPI';
import {
  airtableRecordToCollection,
  airtableRecordToItem,
  collectionToAirtableRecord,
  itemToAirtableRecord,
} from './conversions';
import schema from './schema';

type Fetch = (url: string | Request, opts?: RequestInit) => Promise<Response>;

export type SyncWithAirtableProgress = {
  base_schema?: unknown;
  toPush?: number;
  toPull?: number;
  pushed?: number;
  pulled?: number;
  apiCalls?: number;
  last_synced_at?: number;
};

type RecordWithID = {
  id: string;
  fields: { ID?: string } & { [key: string]: unknown };
};

async function executeSequentially<T>(
  promiseFns: ReadonlyArray<() => Promise<T>>,
): Promise<Array<T>> {
  const results = [];
  for (const promiseFn of promiseFns) {
    const result = await promiseFn();
    results.push(result);
  }
  return results;
}

export default async function* syncWithAirtable(
  {
    integrationId,
    secrets,
    fullSync,
  }: {
    integrationId: string;
    secrets: { [key: string]: string };
    fullSync?: boolean;
  },
  {
    fetch,
    getDatum,
    getData,
    getDataCount,
    saveDatum,
  }: // batchSize = 10,
  {
    fetch: Fetch;
    getDatum: GetDatum;
    getData: GetData;
    getDataCount: GetDataCount;
    saveDatum: SaveDatum;
    // batchSize?: number;
  },
) {
  let progress: SyncWithAirtableProgress = { apiCalls: 0 };
  let integration = await getDatum('integration', integrationId);
  if (!integration) {
    throw new Error(`Can't find integration with ID ${integrationId}`);
  }

  try {
    //
    // Prepare API
    //

    const api = new AirtableAPI({
      fetch,
      accessToken: secrets.airtable_access_token,
      onApiCall: () => {
        progress.apiCalls = (progress.apiCalls || 0) + 1;
      },
    });

    const isRecordExist = async function (tableId: string, recordId: string) {
      try {
        await api.getRecord(config.airtable_base_id, tableId, recordId);
        return true;
      } catch (e) {
        if (e instanceof AirtableAPIError) {
          if (
            e.type === 'NOT_FOUND' ||
            e.type === 'INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND'
          ) {
            return false;
          }
        }
        if (e instanceof Error) {
          e.message = `isRecordExist: ${e.message} (tableId: ${tableId}, recordId: ${recordId})`;
        }
        throw e;
      }
    };

    yield progress;

    //
    // Prepare Integration
    //

    const config = schema.config.parse(integration.config);

    if (!integration.data) {
      integration.data = {};
    }

    yield progress;

    //
    // Process Airtable Schema
    //

    const base_schema = await api.getBaseSchema(config.airtable_base_id);
    progress.base_schema = base_schema;

    const collectionsTable = base_schema.tables.find(
      t => t.name === 'Collections',
    );
    const itemsTable = base_schema.tables.find(t => t.name === 'Items');
    if (!collectionsTable) {
      throw new Error(
        `Cannot find a table named "Collections" in the Airtable base "${config.airtable_base_id}"`,
      );
    }
    if (!itemsTable) {
      throw new Error(
        `Cannot find a table named "Collections" in the Airtable base "${config.airtable_base_id}"`,
      );
    }

    function checkTableFields(
      tableName: string,
      fields: { [name: string]: AirtableField },
    ) {
      if (!fields.ID) {
        throw new Error(
          `Cannot find a field named "ID" in the "${tableName}" table in the Airtable base "${config.airtable_base_id}"`,
        );
      }
      if (fields.ID.type !== 'singleLineText') {
        throw new Error(
          `Expect the field "ID" in the "${tableName}" table to have type "singleLineText", got "${fields.ID.type}"`,
        );
      }
      if (!fields['Modified At']) {
        throw new Error(
          `Cannot find a field named "Modified At" in the "${tableName}" table in the Airtable base "${config.airtable_base_id}"`,
        );
      }
      if ((fields['Modified At'].type as any) !== 'lastModifiedTime') {
        throw new Error(
          `Expect the field "Modified At" in the "${tableName}" table to have type "lastModifiedTime", got "${fields['Modified At'].type}"`,
        );
      }
    }

    const airtableCollectionsTableFields = Object.fromEntries(
      collectionsTable.fields.map(f => [f.name, f]),
    );
    checkTableFields('Collections', airtableCollectionsTableFields);

    const airtableItemsTableFields = Object.fromEntries(
      itemsTable.fields.map(f => [f.name, f]),
    );
    checkTableFields('Items', airtableCollectionsTableFields);

    //
    // Functions for getting and setting integration data on database item
    //

    function getIntegrationData(
      d:
        | ValidDataTypeWithID<'collection'>
        | InvalidDataTypeWithID<'collection'>
        | ValidDataTypeWithID<'item'>
        | InvalidDataTypeWithID<'item'>,
    ) {
      const integrationsData = d.integrations || {};
      if (typeof integrationsData !== 'object') {
        throw new Error(
          `${d.__type} ${
            d.__id
          } has invalid integrations data: ${typeof integrationsData}`,
        );
      }
      const thisIntegrationData =
        (integrationsData as { [key: string]: unknown })[integrationId] || {};
      if (typeof thisIntegrationData !== 'object') {
        throw new Error(
          `${d.__type} ${
            d.__id
          } has invalid integrations value for key "${integrationId}": ${typeof thisIntegrationData}`,
        );
      }

      return thisIntegrationData as { [key: string]: unknown };
    }

    async function updateIntegrationData(
      type: 'collection' | 'item',
      id: string,
      data: { [key: string]: unknown },
    ) {
      return await saveDatum(
        [
          type,
          id,
          d => ({
            ...d,
            integrations: {
              ...(d.integrations || {}),
              [integrationId]: {
                ...(typeof (d.integrations || ({} as any))[integrationId] ===
                'object'
                  ? (d.integrations || ({} as any))[integrationId]
                  : {}),
                ...data,
              },
            },
          }),
        ],
        { noTouch: true, skipValidation: true, skipCallbacks: true },
      );
    }

    yield progress;

    //
    // Set sync variables
    //

    const syncStartedAt = Date.now();
    const lastPush: number | undefined =
      typeof (integration.data as any)?.last_push === 'number'
        ? (integration.data as any)?.last_push
        : undefined;
    const lastPull: number | undefined =
      typeof (integration.data as any)?.last_pull === 'number'
        ? (integration.data as any)?.last_pull
        : undefined;

    const fullSync_existingCollections: Array<RecordWithID> = [];
    const fullSync_existingItems: Array<RecordWithID> = [];

    if (fullSync) {
      try {
        let nextOffset: string | undefined;
        while (true) {
          const resp = await api.listRecords(
            config.airtable_base_id,
            'Collections',
            {
              offset: nextOffset,
              fields: ['ID'],
            },
          );
          fullSync_existingCollections.push(...resp.records);
          nextOffset = resp.offset;
          if (!nextOffset) break;
        }
      } catch (e) {
        if (e instanceof Error) {
          e.message =
            'Error on fullSync listRecords - Collections: ' + e.message;
        }

        throw e;
      }

      try {
        let nextOffset: string | undefined;
        while (true) {
          const resp = await api.listRecords(config.airtable_base_id, 'Items', {
            offset: nextOffset,
            fields: ['ID'],
          });
          fullSync_existingItems.push(...resp.records);
          nextOffset = resp.offset;
          if (!nextOffset) break;
        }
      } catch (e) {
        if (e instanceof Error) {
          e.message = 'Error on fullSync listRecords - Items: ' + e.message;
        }

        throw e;
      }
    }

    yield progress;

    //
    // Generic function to sync a specific data type
    //

    async function* syncData<T extends 'collection' | 'item'>(
      type: T,
      scope: GetDataConditions<T>,
      airtableTableNameOrId: string,
      {
        datumToAirtableRecord,
        airtableRecordToDatum,
        existingRecordIdsForFullSync,
        airtableFields,
        dataIdsToSkipForCreation,
      }: {
        datumToAirtableRecord: (d: ValidDataTypeWithID<T>) => Promise<{
          id?: string;
          fields: { [key: string]: unknown };
        }>;
        airtableRecordToDatum: (r: {
          id: string;
          fields: { [key: string]: unknown };
        }) => Promise<ValidDataTypeWithID<T> | InvalidDataTypeWithID<T>>;
        existingRecordIdsForFullSync: Array<RecordWithID>;
        airtableFields?: ReadonlyArray<string>;
        dataIdsToSkipForCreation?: Set<string>;
      },
    ) {
      // Prepare data to delete

      const toDeleteData = await getData(
        'integration_deleted_data',
        {
          integration_id: integrationId,
          type: type,
        },
        { limit: 999999 },
      );
      const recordIdsToDelete = new Set(
        toDeleteData
          .map(d => (d.data as any)?.id)
          .filter(s => typeof s === 'string'),
      );

      // Prepare local data to sync

      const dataToSyncByScope = await getData(type, scope, { limit: 999999 });
      const dataToSyncBySyncedBefore = await getData(
        type,
        {
          integrations: { [integrationId]: { id: { $exists: true } } },
          ...(fullSync ? {} : { __updated_at: { $gt: lastPush || 0 } }),
        } as any,
        { limit: 999999 },
      );
      const dataToSyncMap = new Map<
        string,
        ValidDataTypeWithID<T> | InvalidDataTypeWithID<T>
      >();
      for (const d of dataToSyncByScope) {
        if (!d.__id) continue;
        dataToSyncMap.set(d.__id, d);
      }
      for (const d of dataToSyncBySyncedBefore) {
        if (!d.__id) continue;
        dataToSyncMap.set(d.__id, d);
      }
      const dataToSync = Array.from(dataToSyncMap.values());

      // Create records on Airtable

      const dataToCreate: Array<ValidDataTypeWithID<T>> = onlyValid(
        dataToSync.filter(
          d =>
            !d.integrations ||
            !(d.integrations as any)[integrationId] ||
            !(d.integrations as any)[integrationId].id ||
            (fullSync &&
              !existingRecordIdsForFullSync.find(
                r => r.id === (d.integrations as any)[integrationId].id,
              )),
        ) as any,
      ) as any;
      const dataIdsToCreateSet = new Set<string>(
        dataToCreate.map(d => d.__id || ''),
      );

      try {
        progress.toPush = (progress.toPush || 0) + dataToCreate.length;

        yield progress;

        for (let i = 0; i < dataToCreate.length; i += 10) {
          const dataChunk = dataToCreate.slice(i, i + 10);
          const recordsToCreate = (
            await executeSequentially(
              dataChunk.map(d => () => datumToAirtableRecord(d)),
            )
          ).filter(r => !createdItemIds.has((r.fields.ID as string) || ''));
          const results = await api.createRecords(
            config.airtable_base_id,
            airtableTableNameOrId,
            {
              records: recordsToCreate,
            },
          );

          for (const rec of results.records) {
            const id = rec.fields.ID;
            if (typeof id === 'string') {
              await updateIntegrationData(type, id, {
                id: rec.id,
                modified_at: Date.now(),
              });
            }
          }

          progress.pushed = (progress.pushed || 0) + dataChunk.length;
          yield progress;
        }
      } catch (e) {
        if (e instanceof Error) {
          e.message =
            `Error occurred while creating Airtable record(s) from data of ${type}: ` +
            e.message;
        }
      }

      yield progress;

      // Update data from Airtable records

      const pulledDataIds = new Set<string>();
      const recordsToUpdateAfterPull: Array<{
        id: string;
        fields: { [key: string]: any };
      }> = [];
      const recordIdsToDeleteAfterPull: Array<string> = [];
      try {
        let nextOffset: string | undefined;
        while (true) {
          const resp = await api.listRecords(
            config.airtable_base_id,
            airtableTableNameOrId,
            {
              sort: [{ field: 'Modified At', direction: 'desc' }],
              offset: nextOffset,
              fields: airtableFields
                ? [
                    ...airtableFields,
                    'ID',
                    'Modified At',
                    'Delete',
                    'Synchronization Error Message',
                  ]
                : undefined,
            },
          );
          nextOffset = resp.offset;

          progress.toPull = (progress.toPull || 0) + resp.records.length;

          yield progress;

          let i = 0;
          for (const record of resp.records) {
            i += 1;
            const recordModifiedAt =
              typeof record.fields['Modified At'] === 'string'
                ? new Date(record.fields['Modified At']).getTime()
                : null;

            if (
              !fullSync &&
              recordModifiedAt &&
              lastPull &&
              recordModifiedAt < lastPull
            ) {
              nextOffset = undefined;
              progress.toPull =
                (progress.toPull || 0) - resp.records.length - 1 + i;
              break;
            }

            if (recordIdsToDelete.has(record.id)) {
              progress.pulled = (progress.pulled || 0) + 1;
              continue;
            }

            const datum = await airtableRecordToDatum(record);

            if (
              datum.__updated_at &&
              (!recordModifiedAt || datum.__updated_at > recordModifiedAt)
            ) {
              progress.pulled = (progress.pulled || 0) + 1;
              continue;
            }

            let savedDatum: undefined | DataMeta<T>;
            let hasSaveError = false;
            let saveError: undefined | Error;
            if (datum.__id || !datum.__deleted) {
              try {
                savedDatum = await saveDatum(datum);
              } catch (e) {
                hasSaveError = true;
                if (e instanceof Error) {
                  saveError = e;
                }
              }
            }

            if (savedDatum?.__id || datum.__id) {
              pulledDataIds.add(savedDatum?.__id || datum.__id || '');
            }

            if (datum.__deleted && !hasSaveError) {
              recordIdsToDeleteAfterPull.push(record.id);
            } else {
              if (
                saveError ||
                !!record.fields['Synchronization Error Message'] ||
                record.fields.ID !== (savedDatum?.__id || datum.__id)
              ) {
                recordsToUpdateAfterPull.push({
                  id: record.id,
                  fields: {
                    ID: savedDatum?.__id || datum.__id || '',
                    'Synchronization Error Message': saveError?.message || '',
                  },
                });
              }
            }

            progress.pulled = (progress.pulled || 0) + 1;
            yield progress;
          }

          if (!nextOffset) break;
        }
      } catch (e) {
        if (e instanceof Error) {
          e.message =
            `Error occurred while updating ${type} data from Airtable record(s): ` +
            e.message;
        }

        throw e;
      } finally {
        for (let i = 0; i < recordIdsToDeleteAfterPull.length; i += 10) {
          const recordIdsChunk = recordIdsToDeleteAfterPull.slice(i, i + 10);
          await api.deleteRecords(
            config.airtable_base_id,
            airtableTableNameOrId,
            recordIdsChunk,
          );
        }
        for (let i = 0; i < recordsToUpdateAfterPull.length; i += 10) {
          const recordsChunk = recordsToUpdateAfterPull.slice(i, i + 10);
          await api.updateRecords(
            config.airtable_base_id,
            airtableTableNameOrId,
            {
              records: recordsChunk,
            },
          );
        }
      }

      // Update Airtable records from data

      try {
        const dataToUpdate: Array<ValidDataTypeWithID<T>> = onlyValid(
          dataToSync.filter(
            d =>
              !dataIdsToCreateSet.has(d.__id || '') &&
              !pulledDataIds.has(d.__id || '') &&
              (fullSync ||
                Math.max(d.__created_at || 0, d.__updated_at || 0) >
                  (lastPush || 0)),
          ) as any,
        ) as any;
        progress.toPush = (progress.toPush || 0) + dataToUpdate.length;
        for (let i = 0; i < dataToUpdate.length; i += 10) {
          const dataChunk = dataToUpdate.slice(i, i + 10);
          const results = await api.updateRecords(
            config.airtable_base_id,
            airtableTableNameOrId,
            {
              records: await executeSequentially(
                dataChunk.map(d => async () => ({
                  id: (d.integrations as any)[integrationId].id,
                  ...(await datumToAirtableRecord(d)),
                })),
              ),
            },
          );

          for (const rec of results.records) {
            const id = rec.fields.ID;
            if (typeof id === 'string') {
              await updateIntegrationData(type, id, {
                id: rec.id,
                modified_at:
                  typeof rec.fields['Modified At'] === 'string'
                    ? new Date(rec.fields['Modified At']).getTime()
                    : null,
              });
            }
          }

          progress.pushed = (progress.pushed || 0) + dataChunk.length;
          yield progress;
        }
      } catch (e) {
        if (e instanceof Error) {
          e.message =
            `Error occurred while updating Airtable record(s) from data of ${type}: ` +
            e.message;
        }

        throw e;
      }

      yield progress;

      // Delete records on Airtable

      try {
        for (const recordId of recordIdsToDelete) {
          try {
            await api.deleteRecords(
              config.airtable_base_id,
              airtableTableNameOrId,
              [recordId],
            );
          } catch (e) {
            if (
              e instanceof AirtableAPIError &&
              (e.type === 'NOT_FOUND' ||
                e.type === 'INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND')
            ) {
              // Already deleted
            } else {
              throw e;
            }
          }
        }
        toDeleteData.forEach(d => saveDatum({ ...d, __deleted: true }));
      } catch (e) {
        if (e instanceof Error) {
          e.message =
            `Error occurred while deleting Airtable record(s) for data of ${type}: ` +
            e.message;
        }

        throw e;
      }
    }

    //
    // Sync Collections
    //

    const { collection_ids_to_sync } = config;
    for await (const p of syncData(
      'collection',
      collection_ids_to_sync,
      'Collections',
      {
        datumToAirtableRecord: async c =>
          collectionToAirtableRecord(c, { airtableCollectionsTableFields }),
        airtableRecordToDatum: async r =>
          airtableRecordToCollection(r, { integrationId, getData }),
        existingRecordIdsForFullSync: fullSync_existingCollections,
        airtableFields: ['Name', 'Ref. No.'],
      },
    )) {
      yield p;
    }

    yield progress;

    //
    // Helper Functions for Syncing Items
    //

    const collectionIdAirtableRecordIdMap = new Map<string, string>();
    async function getAirtableRecordIdFromCollectionId(collectionId: string) {
      if (collectionIdAirtableRecordIdMap.has(collectionId)) {
        return collectionIdAirtableRecordIdMap.get(collectionId);
      }

      const collection = await getDatum('collection', collectionId);
      if (!collection) return;

      const integrationData = getIntegrationData(collection);
      const recordId = integrationData.id;
      if (
        typeof recordId !== 'string' ||
        // With fullSync we need to make sure it's really there
        (fullSync &&
          !fullSync_existingCollections.find(r => r.id === recordId) &&
          !(await isRecordExist('Collections', recordId)))
      ) {
        if (!collection.__valid) {
          throw new Error(`Collection ${collection.__id} is invalid`);
        }
        const results = await api.createRecords(
          config.airtable_base_id,
          'Collections',
          {
            records: await Promise.all(
              [collection].map(c =>
                collectionToAirtableRecord(c, {
                  airtableCollectionsTableFields,
                }),
              ),
            ),
          },
        );

        for (const rec of results.records) {
          const id = rec.fields.ID;
          if (typeof id === 'string') {
            await updateIntegrationData('collection', id, {
              id: rec.id,
              modified_at: Date.now(),
            });
            collectionIdAirtableRecordIdMap.set(collectionId, rec.id);
            return rec.id;
          }
        }

        return;
      }

      collectionIdAirtableRecordIdMap.set(collectionId, recordId);
      return recordId;
    }

    const itemIdAirtableRecordIdMap = new Map<string, string>();
    const createdItemIds = new Set<string>();
    async function getAirtableRecordIdFromItemId(itemId: string) {
      if (itemIdAirtableRecordIdMap.has(itemId)) {
        return itemIdAirtableRecordIdMap.get(itemId);
      }

      const item = await getDatum('item', itemId);
      if (!item) return;

      const integrationData = getIntegrationData(item);
      const recordId = integrationData.id;
      if (
        typeof recordId !== 'string' ||
        // With fullSync we need to make sure it's really there
        (fullSync &&
          !fullSync_existingItems.find(r => r.id === recordId) &&
          !(await isRecordExist('Items', recordId)))
      ) {
        if (!item.__valid) {
          throw new Error(`Item ${item.__id} is invalid`);
        }
        const results = await api.createRecords(
          config.airtable_base_id,
          'Items',
          {
            records: await Promise.all(
              [item].map(c =>
                itemToAirtableRecord(c, {
                  airtableItemsTableFields,
                  getAirtableRecordIdFromCollectionId,
                  getAirtableRecordIdFromItemId,
                }),
              ),
            ),
          },
        );

        if (item.__id) createdItemIds.add(item.__id);

        for (const rec of results.records) {
          const id = rec.fields.ID;
          if (typeof id === 'string') {
            await updateIntegrationData('item', id, {
              id: rec.id,
              modified_at: Date.now(),
            });
            itemIdAirtableRecordIdMap.set(itemId, rec.id);
            return rec.id;
          }
        }
        return;
      }

      itemIdAirtableRecordIdMap.set(itemId, recordId);
      return recordId;
    }

    const recordIdCollectionMap: Map<
      string,
      DataMeta<'collection'>
    > = new Map();
    const recordIdItemMap: Map<string, DataMeta<'item'>> = new Map();

    //
    // Sync Items
    //

    for await (const p of syncData(
      'item',
      {
        collection_id: { $in: collection_ids_to_sync } as any,
      },
      'Items',
      {
        datumToAirtableRecord: async it =>
          itemToAirtableRecord(it, {
            airtableItemsTableFields,
            getAirtableRecordIdFromCollectionId,
            getAirtableRecordIdFromItemId,
          }),
        airtableRecordToDatum: async r =>
          airtableRecordToItem(r, {
            integrationId,
            getData,
            recordIdCollectionMap,
            recordIdItemMap,
          }),
        existingRecordIdsForFullSync: fullSync_existingItems,
        dataIdsToSkipForCreation: createdItemIds,
      },
    )) {
      yield p;
    }

    yield progress;

    //
    // Done
    //

    (integration.data as any).last_push = syncStartedAt;
    (integration.data as any).last_pull = syncStartedAt;
    (integration.data as any).last_synced_at = Date.now();
    progress.last_synced_at = (integration.data as any).last_synced_at;
    yield progress;
  } catch (e) {
    throw e;
  } finally {
    if (
      !(integration.data as any).airtable_api_calls ||
      typeof (integration.data as any).airtable_api_calls !== 'object'
    ) {
      (integration.data as any).airtable_api_calls = {};
    }
    const currentYearAndMonth = getCurrentYearAndMonth();
    const aac = (integration.data as any).airtable_api_calls;
    aac[currentYearAndMonth] =
      (aac[currentYearAndMonth] || 0) + progress.apiCalls;
    await saveDatum(integration);
  }
}

function getCurrentYearAndMonth() {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Ensures two-digit format
  return `${year}-${month}`;
}
