import { DataTypeName, GetDatumHistories } from '@invt/data/types';

import { DataHistoryZod } from '../types';
import { Context } from './types';

const DDOC_NAME = 'get_datum_histories_v0';
const INDEX = {
  fields: [
    { type: 'desc' },
    { data_type: 'desc' },
    { data_id: 'desc' },
    { timestamp: 'desc' },
  ],
  partial_filter_selector: { type: '_history' },
};

export default function getGetDatumHistories({
  db,
  dbType,
  logger,
  logLevels,
  alwaysCreateIndexFirst,
}: Context): GetDatumHistories {
  const getDatumHistories: GetDatumHistories = async <T extends DataTypeName>(
    type: T,
    id: string,
    { limit = 100, after }: { limit?: number; after?: number } = {},
  ) => {
    if (alwaysCreateIndexFirst) {
      try {
        await db.createIndex({
          ddoc: DDOC_NAME,
          name: DDOC_NAME,
          index: INDEX as any,
        });
      } catch (e) {
        /* empty */
      }
    }

    const query = {
      use_index: DDOC_NAME,
      selector: {
        type: '_history',
        data_type: type,
        data_id: id,
        ...(after ? { timestamp: { $lt: after } } : {}),
      },
      sort: [
        { type: 'desc' },
        { data_type: 'desc' },
        { data_id: 'desc' },
        { timestamp: 'desc' },
      ] as any,
      limit,
    };

    const results = await (async () => {
      // console.log(JSON.stringify(await ((db as any).explain as any)(query)));

      if (alwaysCreateIndexFirst) {
        return await db.find(query);
      }

      let retries = 0;
      // eslint-disable-next-line no-constant-condition
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
        (d): d is NonNullable<typeof d> & { data_type: T } =>
          !!d && d.data_type === type,
      );
  };

  return getDatumHistories;
}
