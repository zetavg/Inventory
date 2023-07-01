import WebSQLite from 'react-native-quick-websql';

import PouchDB from 'pouchdb';

// import { deleteSqliteDb } from './sqlite';

const SQLiteAdapter = require('pouchdb-adapter-react-native-sqlite')(WebSQLite);

PouchDB.plugin(require('pouchdb-authentication'));
PouchDB.plugin(SQLiteAdapter);

export async function getPouchDBDatabase<Content extends {} = {}>(
  name: string,
): Promise<PouchDB.Database<Content>> {
  const db = new PouchDB<Content>(name, {
    adapter: 'react-native-sqlite',
  });
  return db;
}

export { PouchDB };

// export async function deletePouchDBDatabase(name: string) {
//   // Since the database is backed by sqlite, we delete the sqlite file directly.
//   const results = await deleteSqliteDb(name);
//   return results;
// }
