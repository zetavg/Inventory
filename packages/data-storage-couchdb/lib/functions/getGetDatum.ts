import { GetDatum } from '@deps/data/types';

import { getCouchDbId, getDatumFromDoc } from './couchdb-utils';
import { Context } from './types';

export default function getGetDatum({ db, dbType }: Context): GetDatum {
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
        if (e instanceof Error && e.name === 'not_found') {
          return null;
        }

        throw e;
      })) || null;
    if (!doc) return null;

    return getDatumFromDoc(type, doc);
  };

  return getDatum;
}
