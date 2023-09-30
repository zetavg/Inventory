import type nano from 'nano';

import { GetDatum } from '@deps/data/types';

import { getCouchDbId, getDatumFromDoc } from './couchdb-utils';

export default function getGetDatum({
  db,
}: {
  db: nano.DocumentScope<unknown>;
}): GetDatum {
  const getDatum: GetDatum = async function getDatum(type, id) {
    const doc =
      (await db.get(getCouchDbId(type, id)).catch(e => {
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
