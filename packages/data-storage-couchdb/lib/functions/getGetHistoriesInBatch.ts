import { DataTypeName, GetHistoriesInBatch } from '@deps/data/types';

import { DataHistoryZod } from '../types';

import { Context } from './types';

const DDOC_NAME = 'get_histories_in_batch_v0';
const INDEX = {
  fields: [{ batch: 'asc' }, { created_by: 'asc' }, { timestamp: 'asc' }],
  partial_filter_selector: { type: '_history' },
};

export default function getGetHistoriesInBatch({
  db,
  dbType,
  logger,
  logLevels,
  alwaysCreateIndexFirst,
}: Context): GetHistoriesInBatch {
  const getHistoriesInBatch: GetHistoriesInBatch = async (
    batch: number,
    { createdBy } = {},
  ) => {
    if (alwaysCreateIndexFirst) {
      try {
        await db.createIndex({
          ddoc: DDOC_NAME,
          name: DDOC_NAME,
          index: INDEX as any,
        });
      } catch (e) {}
    }

    const query = {
      use_index: DDOC_NAME,
      selector: {
        batch,
        ...(createdBy ? { created_by: createdBy } : {}),
      },
      sort: [
        { batch: 'asc' },
        { created_by: 'asc' },
        { timestamp: 'asc' },
      ] as any,
      limit: 9999,
    };

    const results = await (async () => {
      // console.log(JSON.stringify(await ((db as any).explain as any)(query)));

      if (alwaysCreateIndexFirst) {
        return await db.find(query);
      }

      let retries = 0;
      while (true) {
        try {
          return await db.find(query);
        } catch (e) {
          if (retries > 3) throw e;

          try {
            await db.createIndex({
              ddoc: DDOC_NAME,
              name: DDOC_NAME,
              index: INDEX as any,
            });
          } catch (err) {
            logger?.warn(
              `Cannot create index ${DDOC_NAME}: ${err} (trying to create index because of ${e})`,
            );
          }

          retries += 1;
        }
      }
    })();

    return results.docs
      .map(doc => {
        try {
          return DataHistoryZod.parse(doc);
        } catch (e) {
          return null;
        }
      })
      .filter(
        (d): d is NonNullable<typeof d> & { data_type: DataTypeName } => !!d, // TODO: check d.data_type is a DataTypeName
      );
  };

  return getHistoriesInBatch;
}
