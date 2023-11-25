import { ListHistoryBatchesCreatedBy } from '@deps/data/types';

import { Context } from './types';

const DESIGN_DOC_NAME = 'list_history_batches_created_by_v0';
const VIEW_NAME = 'batches_by_creator';

const DESIGN_DOC = {
  _id: `_design/${DESIGN_DOC_NAME}`,
  views: {
    [VIEW_NAME]: {
      map: "function (doc) { if (doc._id.startsWith('zd-history')) emit([doc.created_by, doc.batch], 1); }",
      reduce: '_sum',
    },
  },
};

export default function getListHistoryBatchesCreatedBy({
  db,
  dbType,
  logger,
  logLevels,
  alwaysCreateIndexFirst,
}: Context): ListHistoryBatchesCreatedBy {
  const listHistoryBatchesCreatedBy: ListHistoryBatchesCreatedBy = async (
    createdBy,
    { limit = 100, after } = {},
  ) => {
    async function createIndex() {
      if (dbType === 'pouchdb') {
        try {
          await db.put(DESIGN_DOC);
        } catch (e) {}
      } else {
        try {
          await db.insert(DESIGN_DOC);
        } catch (e) {}
      }
    }
    if (alwaysCreateIndexFirst) {
      createIndex();
    }

    const results = await (async () => {
      let retries = 0;
      while (true) {
        try {
          if (dbType === 'pouchdb') {
            return await db.query(`${DESIGN_DOC_NAME}/${VIEW_NAME}`, {
              group: true,
              descending: true,
              startkey: [createdBy, typeof after === 'number' ? after - 1 : {}],
              endkey: [createdBy, 0],
              limit,
            });
          } else {
            return await db.view(DESIGN_DOC_NAME, VIEW_NAME, {
              group: true,
              descending: true,
              startkey: [createdBy, after || {}],
              endkey: [createdBy, 0],
              limit,
            });
          }
        } catch (e) {
          if (retries > 3) throw e;

          createIndex();

          retries += 1;
        }
      }
    })();

    return results.rows
      .map(r => ({ batch: r.key[1], count: r.value }))
      .filter(v => typeof v.batch === 'number');
  };

  return listHistoryBatchesCreatedBy;
}
