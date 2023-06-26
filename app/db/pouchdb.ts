import WebSQLite from 'react-native-quick-websql';

import PouchDB from 'pouchdb';

const SQLiteAdapter = require('pouchdb-adapter-react-native-sqlite')(WebSQLite);

PouchDB.plugin(SQLiteAdapter);

export type Database = PouchDB.Database<any>;
export type LogsDatabase = PouchDB.Database<any>;

export async function getDatabase(name: string): Promise<Database> {
  const db = new PouchDB(name, {
    adapter: 'react-native-sqlite',
  });
  return db;
}

// export const PouchDB = PouchDBCore;
