import { GetDatum } from '@invt/data/types';

import { getCouchDbId, getDatumFromDoc } from './couchdb-utils';
import { Context } from './types';

export default function getGetDatum({
  db,
  dbType,
  logger,
  logLevels,
}: Context): GetDatum {
  const dbGet = (docId: string) => {
    if (dbType === 'pouchdb') {
      return db.get(docId);
    } else {
      return db.get(docId);
    }
  };

  const getDatum: GetDatum = async function getDatum(type, id) {
    const doc =
      (await dbGet(getCouchDbId(type, id)).catch(e => {
        if (
          e.message === 'not_found' /* nano */ ||
          e.message === 'deleted' /* nano */ ||
          e.message ===
            'missing' /* pouchdb, note that `e instanceof Error` will be false */ ||
          e.name === 'not_found' /* also pouchdb */
        ) {
          return null;
        }

        throw e;
      })) || null;
    if (!doc) return null;

    return getDatumFromDoc(type, doc, { logger, logLevels });
  };

  return getDatum;
}
