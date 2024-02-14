import {
  DataMeta,
  DataTypeWithID,
  GetAttachmentInfoFromDatum,
  GetData,
  GetDataConditions,
  GetDataCount,
  GetDatum,
  InvalidDataTypeWithID,
  SaveDatum,
  ValidDataTypeWithID,
} from '@invt/data/types';
import { hasChanges, onlyValid } from '@invt/data/utils';
import getChildrenItems from '@invt/data/utils/getChildrenItems';

import AirtableAPI, {
  AirtableAPIError,
  AirtableField,
  AirtableRecord,
} from './AirtableAPI';
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
  pullErrored?: number;
  status?:
    | 'initializing'
    | 'syncing'
    | 'syncing_collections'
    | 'syncing_items'
    | 'done';
  recordsCreatedOnAirtable?: Array<{
    type: string;
    id?: string;
    airtable_record_id: string;
  }>;
  recordsUpdatedOnAirtable?: Array<{
    type: string;
    id?: string;
    airtable_record_id: string;
  }>;
  recordsRemovedFromAirtable?: Array<{
    type: string;
    id?: string;
    airtable_record_id: string;
  }>;
  dataCreatedFromAirtable?: Array<{
    type: string;
    id?: string;
    airtable_record_id: string;
  }>;
  dataUpdatedFromAirtable?: Array<{
    type: string;
    id?: string;
    airtable_record_id: string;
  }>;
  dataUpdateErrors?: Array<{
    type: string;
    id?: string;
    airtable_record_id: string;
    error_message?: string;
  }>;
  dataDeletedFromAirtable?: Array<{
    type: string;
    id?: string;
    airtable_record_id?: string;
  }>;
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
    getAttachmentInfoFromDatum,
    getImageFromAirtableImage,
  }: // batchSize = 10,
  {
    fetch: Fetch;
    getDatum: GetDatum;
    getData: GetData;
    getDataCount: GetDataCount;
    saveDatum: SaveDatum;
    getAttachmentInfoFromDatum: GetAttachmentInfoFromDatum;
    getImageFromAirtableImage: (
      airtableImage: unknown,
    ) => Promise<DataTypeWithID<'image'>>;
    // batchSize?: number;
  },
) {
  let progress: SyncWithAirtableProgress = { apiCalls: 0 };
  progress.status = 'initializing';
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

    const shouldSyncItemImages =
      !config.disable_uploading_item_images && !!config.images_public_endpoint;

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
        dataIdsToSkip,
        afterSave,
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
        dataIdsToSkip?: Set<string>;
        afterSave?: (
          savedData: DataMeta<T>,
          record: AirtableRecord,
        ) => Promise<void>;
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
          ).filter(
            r =>
              !dataIdsToSkipForCreation?.has((r.fields.ID as string) || '') &&
              !dataIdsToSkip?.has((r.fields.ID as string) || ''),
          );
          const results = await api.createRecords(
            config.airtable_base_id,
            airtableTableNameOrId,
            recordsToCreate,
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
          if (!Array.isArray(progress.recordsCreatedOnAirtable))
            progress.recordsCreatedOnAirtable = [];
          progress.recordsCreatedOnAirtable.push(
            ...results.records.map(rec => ({
              type,
              id: typeof rec.fields.ID === 'string' ? rec.fields.ID : undefined,
              airtable_record_id: rec.id,
            })),
          );
          yield progress;
        }
      } catch (e) {
        if (e instanceof Error) {
          e.message =
            `Error occurred while creating Airtable record(s) from data of ${type}: ` +
            e.message;
        }

        throw e;
      }

      yield progress;

      // Update data from Airtable records

      const pulledDataIds = new Set<string>();

      async function* doUpdateDataFromAirtableRecords({
        isRetryErroredRecords,
      }: { isRetryErroredRecords?: boolean } = {}) {
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
                // Now we use filterByFormula to filter updated items.
                // Sort by # so new created items can remain the same order as in Airtable.
                sort: [{ field: '#', direction: 'asc' }],
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
                filterByFormula: isRetryErroredRecords
                  ? '{Synchronization Error Message}'
                  : fullSync || !lastPull
                  ? undefined
                  : `IS_AFTER({Modified At}, '${new Date(
                      lastPull,
                    ).toISOString()}')`,
              },
            );
            nextOffset = resp.offset;

            progress.toPull = (progress.toPull || 0) + resp.records.length;

            yield progress;

            // let i = 0;
            for (const record of resp.records) {
              // i += 1;
              const recordModifiedAt =
                typeof record.fields['Modified At'] === 'string'
                  ? new Date(record.fields['Modified At']).getTime()
                  : null;

              // Now we use filterByFormula to filter updated items, no longer need this
              // if (
              //   !fullSync &&
              //   !isRetryErroredRecords &&
              //   recordModifiedAt &&
              //   lastPull &&
              //   recordModifiedAt < lastPull
              // ) {
              //   nextOffset = undefined;
              //   progress.toPull =
              //     (progress.toPull || 0) - resp.records.length - 1 + i;
              //   break;
              // }

              if (recordIdsToDelete.has(record.id)) {
                progress.pulled = (progress.pulled || 0) + 1;
                continue;
              }

              const datum = await airtableRecordToDatum(record);

              if (
                (datum.__updated_at &&
                  (!recordModifiedAt ||
                    datum.__updated_at > recordModifiedAt)) ||
                (datum.__id && dataIdsToSkip?.has(datum.__id))
              ) {
                progress.pulled = (progress.pulled || 0) + 1;
                continue;
              }

              let savedDatum: undefined | DataMeta<T>;
              let hasSaveError = false;
              let saveError: undefined | Error;
              if (datum.__id || !datum.__deleted) {
                try {
                  savedDatum = await saveDatum(datum, {
                    createHistory: {
                      createdBy: `integration-${integrationId}`,
                      eventName: 'sync',
                      batch: syncStartedAt,
                    },
                  });

                  if (datum.__id) {
                    // For new created data, wait some time so that the creation date will differ between data within the same batch.
                    await new Promise(resolve => setTimeout(resolve, 1));
                  }
                } catch (e) {
                  hasSaveError = true;
                  if (e instanceof Error) {
                    saveError = e;
                  }
                }
              }

              if (hasSaveError) {
                progress.pullErrored = (progress.pullErrored || 0) + 1;
              }

              if (savedDatum?.__id || datum.__id) {
                pulledDataIds.add(savedDatum?.__id || datum.__id || '');
              }

              if (datum.__deleted && !hasSaveError) {
                // Deleted without error
                recordIdsToDeleteAfterPull.push(record.id);
                progress.toPush = (progress.toPush || 0) + 1;

                if (!Array.isArray(progress.dataDeletedFromAirtable))
                  progress.dataDeletedFromAirtable = [];
                progress.dataDeletedFromAirtable.push({
                  type,
                  id: datum.__id,
                  airtable_record_id: record.id,
                });
              } else {
                if (saveError) {
                  // Errored
                  recordsToUpdateAfterPull.push({
                    id: record.id,
                    fields: {
                      ID: savedDatum?.__id || datum.__id || '',
                      'Synchronization Error Message': saveError?.message || '',
                    },
                  });
                  progress.toPush = (progress.toPush || 0) + 1;

                  if (!Array.isArray(progress.dataUpdateErrors))
                    progress.dataUpdateErrors = [];
                  progress.dataUpdateErrors.push({
                    type,
                    id: datum.__id,
                    airtable_record_id: record.id,
                    error_message: saveError?.message,
                  });
                } else if (!datum.__deleted && savedDatum) {
                  // Not deleted and no error
                  if (afterSave) {
                    await afterSave(savedDatum, record);
                  }

                  const newRecord = await datumToAirtableRecord(
                    savedDatum as any,
                  );

                  if (datum.__updated_at !== savedDatum.__updated_at) {
                    if (!Array.isArray(progress.dataUpdatedFromAirtable))
                      progress.dataUpdatedFromAirtable = [];
                    progress.dataUpdatedFromAirtable.push({
                      type,
                      id: datum.__id,
                      airtable_record_id: record.id,
                    });
                  }

                  if (hasRecordFieldsChanges(record.fields, newRecord.fields)) {
                    recordsToUpdateAfterPull.push({
                      id: record.id,
                      fields: {
                        ...newRecord.fields,
                        'Synchronization Error Message': '',
                      },
                    });
                    progress.toPush = (progress.toPush || 0) + 1;
                  }
                }
              }

              progress.pulled = (progress.pulled || 0) + 1;
              yield progress;
            }

            if (!nextOffset) {
              if (isRetryErroredRecords) {
                break;
              } else {
                isRetryErroredRecords = true;
                continue;
              }
            }
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
            progress.pushed = (progress.pushed || 0) + recordIdsChunk.length;
            if (!Array.isArray(progress.recordsRemovedFromAirtable))
              progress.recordsRemovedFromAirtable = [];
            progress.recordsRemovedFromAirtable.push(
              ...recordIdsChunk.map(id => ({ type, airtable_record_id: id })),
            );
          }
          for (let i = 0; i < recordsToUpdateAfterPull.length; i += 10) {
            const recordsChunk = recordsToUpdateAfterPull.slice(i, i + 10);
            await api.updateRecords(
              config.airtable_base_id,
              airtableTableNameOrId,
              recordsChunk.filter(
                // To prevent INVALID_RECORDS - You cannot update the same record multiple times in a single request.
                // (I don't know why this happens.)
                (r, ii, rc) => rc.findIndex(rr => rr.id === r.id) === ii,
              ),
            );
            progress.pushed = (progress.pushed || 0) + recordsChunk.length;
            if (!Array.isArray(progress.recordsUpdatedOnAirtable))
              progress.recordsUpdatedOnAirtable = [];
            progress.recordsUpdatedOnAirtable.push(
              ...recordsChunk.map(rec => ({
                type,
                id:
                  typeof rec.fields.ID === 'string' ? rec.fields.ID : undefined,
                airtable_record_id: rec.id,
              })),
            );
          }
        }
      }

      for await (const p of doUpdateDataFromAirtableRecords()) {
        yield p;
      }

      for await (const p of doUpdateDataFromAirtableRecords({
        isRetryErroredRecords: true,
      })) {
        yield p;
      }

      // Update Airtable records from data

      try {
        const dataToUpdate: Array<ValidDataTypeWithID<T>> = onlyValid(
          dataToSync.filter(
            d =>
              !dataIdsToCreateSet.has(d.__id || '') &&
              (fullSync || !pulledDataIds.has(d.__id || '')) &&
              (fullSync ||
                Math.max(d.__created_at || 0, d.__updated_at || 0) >
                  (lastPush || 0)) &&
              (!d.__id || !dataIdsToSkip?.has(d.__id)),
          ) as any,
        ) as any;
        progress.toPush = (progress.toPush || 0) + dataToUpdate.length;
        for (let i = 0; i < dataToUpdate.length; i += 10) {
          const dataChunk = dataToUpdate.slice(i, i + 10);
          const results = await api.updateRecords(
            config.airtable_base_id,
            airtableTableNameOrId,
            await executeSequentially(
              dataChunk.map(d => async () => ({
                id: (d.integrations as any)[integrationId].id,
                ...(await datumToAirtableRecord(d)),
              })),
            ),
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
          if (!Array.isArray(progress.recordsUpdatedOnAirtable))
            progress.recordsUpdatedOnAirtable = [];
          progress.recordsUpdatedOnAirtable.push(
            ...results.records.map(rec => ({
              type,
              id: typeof rec.fields.ID === 'string' ? rec.fields.ID : undefined,
              airtable_record_id: rec.id,
            })),
          );
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
            if (!Array.isArray(progress.recordsRemovedFromAirtable))
              progress.recordsRemovedFromAirtable = [];
            progress.recordsRemovedFromAirtable.push({
              type,
              airtable_record_id: recordId,
            });
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

    progress.status = 'syncing_collections';

    const { collection_ids_to_sync } = config;
    if (config.scope_type === 'collections' && collection_ids_to_sync) {
      for await (const p of syncData(
        'collection',
        collection_ids_to_sync,
        'Collections',
        {
          datumToAirtableRecord: async c =>
            collectionToAirtableRecord(c, { airtableCollectionsTableFields }),
          airtableRecordToDatum: async r =>
            airtableRecordToCollection(r, {
              integrationId,
              airtableCollectionsTableFields,
              getData,
            }),
          existingRecordIdsForFullSync: fullSync_existingCollections,
          airtableFields: ['Name', 'Ref. No.'],
        },
      )) {
        yield p;
      }
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
          await Promise.all(
            [collection].map(c =>
              collectionToAirtableRecord(c, {
                airtableCollectionsTableFields,
              }),
            ),
          ),
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

        if (!Array.isArray(progress.recordsCreatedOnAirtable))
          progress.recordsCreatedOnAirtable = [];
        progress.recordsCreatedOnAirtable.push(
          ...results.records.map(rec => ({
            type: 'collection',
            id: typeof rec.fields.ID === 'string' ? rec.fields.ID : undefined,
            airtable_record_id: rec.id,
          })),
        );

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
          await Promise.all(
            [item].map(c =>
              itemToAirtableRecord(c, {
                airtableItemsTableFields,
                getAirtableRecordIdFromCollectionId,
                getAirtableRecordIdFromItemId,
                getData,
                fetch,
                getAttachmentInfoFromDatum,
                imagesPublicEndpoint: shouldSyncItemImages
                  ? config.images_public_endpoint
                  : undefined,
              }),
            ),
          ),
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

        if (!Array.isArray(progress.recordsCreatedOnAirtable))
          progress.recordsCreatedOnAirtable = [];
        progress.recordsCreatedOnAirtable.push(
          ...results.records.map(rec => ({
            type: 'collection',
            id: typeof rec.fields.ID === 'string' ? rec.fields.ID : undefined,
            airtable_record_id: rec.id,
          })),
        );

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

    progress.status = 'syncing_items';

    const itemsScope = await (async () => {
      switch (config.scope_type) {
        case 'collections':
          return {
            collection_id: { $in: collection_ids_to_sync } as any,
          };
        case 'containers': {
          const itemIdsSet = new Set<string>();
          for (const id in config.container_ids_to_sync || []) {
            itemIdsSet.add(id);
          }
          const itemsMap = await getChildrenItems(
            config.container_ids_to_sync || [],
            {
              getDatum,
              getData,
            },
          );
          for (const itemId of Object.keys(itemsMap)) {
            itemIdsSet.add(itemId);
          }
          for (const items of Object.values(itemsMap)) {
            for (const item of items) {
              if (item.__id) itemIdsSet.add(item.__id);
            }
          }
          return Array.from(itemIdsSet);
        }
      }
    })();

    const itemsScopeIdsSet = new Set(
      (
        await getData('item', itemsScope, {
          limit: 99999,
        })
      )
        .map(it => it.__id)
        .filter((id): id is NonNullable<typeof id> => !!id),
    );

    const syncedIdsRecordIdsMap = new Map<string, string | null>(
      (
        await getData(
          'item',
          { integrations: { [integrationId]: { $exists: true } } },
          {
            limit: 99999,
          },
        )
      ).map(
        it =>
          [
            it.__id as string,
            typeof ((it.integrations as any)?.[integrationId] as any)?.id ===
            'string'
              ? (((it.integrations as any)?.[integrationId] as any)
                  ?.id as string)
              : null,
          ] as const,
      ),
    );

    const itemsToRemoveFromAirtableIdsSet = new Set<string>();

    for (const id of syncedIdsRecordIdsMap.keys()) {
      if (!itemsScopeIdsSet.has(id)) {
        itemsToRemoveFromAirtableIdsSet.add(id);
      }
    }

    for await (const p of syncData('item', itemsScope, 'Items', {
      datumToAirtableRecord: async it =>
        itemToAirtableRecord(it, {
          airtableItemsTableFields,
          getAirtableRecordIdFromCollectionId,
          getAirtableRecordIdFromItemId,
          getData,
          getAttachmentInfoFromDatum,
          fetch,
          imagesPublicEndpoint: shouldSyncItemImages
            ? config.images_public_endpoint
            : undefined,
        }),
      airtableRecordToDatum: async r =>
        airtableRecordToItem(r, {
          integrationId,
          airtableItemsTableFields,
          getData,
          recordIdCollectionMap,
          recordIdItemMap,
        }),
      existingRecordIdsForFullSync: fullSync_existingItems,
      dataIdsToSkipForCreation: createdItemIds,
      dataIdsToSkip: itemsToRemoveFromAirtableIdsSet,
      afterSave: async (savedDatum, record) => {
        if (!shouldSyncItemImages) return;

        const savedItemId = savedDatum.__id;
        if (!savedItemId) return;

        let recordImages = record.fields.Images;
        if (Array.isArray(recordImages) && recordImages.length <= 0) {
          // To prevent unexpected data deletion, clearing the "Images" field will not actually delete anything. One should check the "Remove All Images" checkbox to remove all images.
          recordImages = undefined;
        }

        if (record.fields['Remove All Images']) {
          recordImages = [];
        }
        if (!Array.isArray(recordImages)) return;

        const recordImageFilenames = recordImages
          .map(ri => ri?.filename)
          .filter(f => typeof f === 'string');
        const recordImageIds = recordImageFilenames.map(f => f.split('.')[0]);
        const shouldHaveImages = await Promise.all(
          (
            await getData('image', recordImageIds)
          ).map(async (image, i) => {
            if (image.__valid) return image;

            const recordImage = (recordImages as Array<unknown>)[i];
            const img = await getImageFromAirtableImage(recordImage);

            return img;
          }),
        );
        const shouldHaveImageIdsSet = new Set<string>(
          shouldHaveImages
            .map(img => img.__id)
            .filter((id): id is NonNullable<typeof id> => !!id),
        );
        const currentItemImages = onlyValid(
          await getData('item_image', {
            item_id: savedDatum.__id,
          }),
        );
        const itemImagesToDelete = currentItemImages.filter(
          ii => !shouldHaveImageIdsSet.has(ii.image_id),
        );
        for (const ii of itemImagesToDelete) {
          await saveDatum(
            { ...ii, __deleted: true },
            {
              createHistory: {
                createdBy: `integration-${integrationId}`,
                eventName: 'sync',
                batch: syncStartedAt,
              },
            },
          );
          if (!Array.isArray(progress.dataDeletedFromAirtable))
            progress.dataDeletedFromAirtable = [];
          progress.dataDeletedFromAirtable.push({
            type: 'item_image',
            id: ii.__id,
          });
        }

        let i = 0;
        for (const img of shouldHaveImages) {
          await saveDatum(
            {
              __type: 'item_image',
              // Use a non-random ID to let the save be retry-able.
              __id: `${savedItemId}-${img.__id}`,
              item_id: savedItemId,
              image_id: img.__id,
              order: i,
            },
            {
              ignoreConflict: true,
              createHistory: {
                createdBy: `integration-${integrationId}`,
                eventName: 'sync',
                batch: syncStartedAt,
              },
            },
          );
          i += 1;
        }

        // const currentImageIdsSet = new Set<string>(
        //   currentItemImages
        //     .map(ii => ii.image_id)
        //     .filter((id): id is NonNullable<typeof id> => !!id),
        // );
        // const itemImageImageIdsToCreate = Array.from(
        //   shouldHaveImageIdsSet,
        // ).filter(id => !currentImageIdsSet.has(id));
        // let i = 0;
        // const currentRemainingItemImages = currentItemImages.filter(ii =>
        //   shouldHaveImageIdsSet.has(ii.image_id),
        // );
        // if (currentRemainingItemImages.length > 0) {
        //   i =
        //     Math.max(...currentRemainingItemImages.map(ii => ii.order || 0)) +
        //     1;
        // }
        // for (const imgId of itemImageImageIdsToCreate) {
        //   await saveDatum(
        //     {
        //       __type: 'item_image',
        //       // Use a non-random ID to let the save be retry-able.
        //       __id: `${savedItemId}-${imgId}`,
        //       item_id: savedItemId,
        //       image_id: imgId,
        //       order: i,
        //     },
        //     {
        //       ignoreConflict: true,
        //       createHistory: {
        //         createdBy: `integration-${integrationId}`,
        //         eventName: 'sync',
        //         batch: syncStartedAt,
        //       },
        //     },
        //   );
        //   i += 1;
        // }
      },
    })) {
      yield p;
    }

    try {
      for (const itemId of itemsToRemoveFromAirtableIdsSet) {
        const recordId = syncedIdsRecordIdsMap.get(itemId);
        if (recordId) {
          try {
            // Need to make sure that this item can be safely removed.
            const possibleContents = await api.listRecords(
              config.airtable_base_id,
              'Items',
              {
                pageSize: 1,
                filterByFormula: `{Container Record ID} = "${recordId}"`,
              },
            );
            if (possibleContents.records.length > 0) continue;

            await api.deleteRecords(config.airtable_base_id, 'Items', [
              recordId,
            ]);

            if (!Array.isArray(progress.recordsRemovedFromAirtable))
              progress.recordsRemovedFromAirtable = [];
            progress.recordsRemovedFromAirtable.push({
              type: 'item',
              airtable_record_id: recordId,
            });
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

          await saveDatum([
            'item',
            itemId,
            it => {
              return {
                ...it,
                integrations: {
                  ...Object.fromEntries(
                    Object.entries(
                      it.integrations && typeof it.integrations === 'object'
                        ? it.integrations
                        : {},
                    ).filter(([k]) => k !== integrationId),
                  ),
                },
              };
            },
          ]);
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        e.message =
          'Error occurred while deleting Airtable record(s) for items that should no longer be synced: ' +
          e.message;
      }

      throw e;
    }

    yield progress;

    //
    // Done
    //

    (integration.data as any).last_push = syncStartedAt;
    (integration.data as any).last_pull = syncStartedAt;
    (integration.data as any).last_synced_at = Date.now();
    progress.last_synced_at = (integration.data as any).last_synced_at;
    progress.status = 'done';
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

function hasRecordFieldsChanges(
  fields1: Record<string, unknown>,
  fields2: Record<string, unknown>,
) {
  const keys = Array.from(new Set(Object.keys(fields2)));

  for (const key of keys) {
    if (
      key === '#' ||
      key === 'Modified At' ||
      key === 'Record ID' ||
      key === 'Container Record ID'
    ) {
      continue;
    }

    const f1Value = fields1[key];
    const f2Value = fields2[key];

    if (!!f1Value !== !!f2Value) {
      if (Array.isArray(f1Value) && f1Value.length <= 0) {
        continue;
      }
      if (Array.isArray(f2Value) && f2Value.length <= 0) {
        continue;
      }
      return true;
    }
    if (!f1Value) continue;

    if (typeof f1Value !== typeof f2Value) {
      return true;
    } else if (typeof f1Value === 'object' || Array.isArray(f1Value)) {
      if (
        key === 'Images' &&
        Array.isArray(f1Value) &&
        Array.isArray(f2Value)
      ) {
        const hasDifference =
          JSON.stringify(f1Value.map(img => img.filename)) !==
          JSON.stringify(f2Value.map(img => img.filename));
        if (hasDifference) {
          return true;
        }
      } else if (JSON.stringify(f1Value) !== JSON.stringify(f2Value)) {
        return true;
      }
    } else {
      if (f1Value !== f2Value) {
        return true;
      }
    }
  }

  return false;
}
