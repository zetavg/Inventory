import appLogger from '@app/logger';

import saveDatum from './functions/saveDatum';
import { getDatumFromDoc } from './pouchdb-utils';
import { getDataIdFromPouchDbId } from './pouchdb-utils';
import schema, { DATA_TYPE_NAMES, DataTypeName } from './schema';
import { DataTypeWithAdditionalInfo } from './types';

const logger = appLogger.for({ module: 'fixConsistency' });

/**
 * It's highly recommended to backup the database before doing this!
 */
export default async function fixConsistency({
  db,
  successCallback,
  errorCallback,
  batchSize = 10,
}: {
  db: PouchDB.Database;
  successCallback: (
    data: DataTypeWithAdditionalInfo<DataTypeName>,
  ) => Promise<void>;
  errorCallback: (info: {
    type: string;
    id?: string;
    rawId: string;
    error: unknown;
  }) => Promise<void>;
  batchSize?: number;
}) {
  for (const typeName of DATA_TYPE_NAMES) {
    let ended = false;
    let batch = 0;
    while (!ended) {
      const response = await db.find({
        selector: { type: typeName },
        limit: batchSize,
        skip: batchSize * batch,
      });
      if (response.docs.length === 0) {
        ended = true;
        continue;
      }

      for (const doc of response.docs) {
        let id: string | undefined;
        try {
          id = getDataIdFromPouchDbId(doc._id).id;
          const data = getDatumFromDoc(typeName, doc, logger);
          if (!data) throw new Error('getDatumFromDoc returns null');
          // Data might be invalid, we expect it to be fixed by beforeSave
          // if (!data.__valid)
          //   throw new Error(
          //     `Data is not valid: ${JSON.stringify(
          //       data.__error_details,
          //       null,
          //       2,
          //     )}`,
          //   );
          await saveDatum(data as any, { db, logger, noTouch: true });

          await successCallback(data as any);
        } catch (e) {
          await errorCallback({
            type: typeName,
            id,
            rawId: doc._id,
            error: e,
          });
        }
      }

      batch += 1;
    }
  }
}
