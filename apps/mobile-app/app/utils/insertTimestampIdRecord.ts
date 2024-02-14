// @ts-nocheck

import PouchDB from 'pouchdb-react-native';

/**
 * Insert a document into PouchDB using the timestamp as ID.
 * Automatically tries to increase the timestamp if another document has
 * already been inserted with the same timestamp.
 */
export default async function insertTimestampIdRecord<T>(
  db: PouchDB.Database<T>,
  doc: T,
  timestamp: number = new Date().getTime(),
) {
  let timestampOffset = 0;

  while (true) {
    try {
      return await db.put({
        _id: (timestamp + timestampOffset).toString().padStart(16, '0'),
        ...doc,
      });
    } catch (e) {
      if (e && typeof e === 'object' && (e as any).name === 'conflict') {
        if (timestampOffset > 500) throw e;

        timestampOffset += 1;
        continue;
      } else {
        throw e;
      }
    }
  }
}
