import PouchDBRN from 'pouchdb-react-native';
import PouchDBAuthentication from 'pouchdb-authentication';
import WebSQLite from 'react-native-quick-websql';
import { DBContent, AttachmentsDBContent, LogsDBContent } from './types';

const SQLiteAdapter = require('pouchdb-adapter-react-native-sqlite')(WebSQLite);

PouchDBRN.plugin(require('pouchdb-quick-search'));
PouchDBRN.plugin(require('pouchdb-find'));
PouchDBRN.plugin(PouchDBAuthentication);
PouchDBRN.plugin(SQLiteAdapter);

export type Database = PouchDB.Database<DBContent>;
export type AttachmentsDatabase = PouchDB.Database<AttachmentsDBContent>;
export type LogsDatabase = PouchDB.Database<LogsDBContent>;

export function getDatabase(name: string): Database {
  return new PouchDBRN<DBContent>(name, { adapter: 'react-native-sqlite' });
}

export function getAttachmentsDatabase(name: string): AttachmentsDatabase {
  return new PouchDBRN<AttachmentsDBContent>(name, {
    adapter: 'react-native-sqlite',
    auto_compaction: true,
  });
}

export function getLogsDatabase(name: string): LogsDatabase {
  const db = new PouchDBRN<LogsDBContent>(name, {
    adapter: 'react-native-sqlite',
    auto_compaction: true,
  });

  db.createIndex({
    index: { fields: ['timestamp', 'type', 'ok', 'event', 'server'] },
  });

  return db;
}

export const PouchDB = PouchDBRN;
