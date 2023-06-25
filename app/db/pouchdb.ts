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
export async function getLogsDatabase(name: string): Promise<LogsDatabase> {
  const db = new PouchDB(name, {
    adapter: 'react-native-sqlite',
    auto_compaction: true,
  });

  // db.createIndex({
  //   index: { fields: ['timestamp', 'type', 'ok', 'event', 'server'] },
  // });

  return db;
}

// export const PouchDB = PouchDBCore;
