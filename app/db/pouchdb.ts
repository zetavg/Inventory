import PouchDBRN from 'pouchdb-react-native';
import find from 'pouchdb-find';
import rel from 'relational-pouch';
import PouchDBAuthentication from 'pouchdb-authentication';
import WebSQLite from 'react-native-quick-websql';
import { DBContent, AttachmentsDBContent, LogsDBContent } from './types';
import schema from './schema';

const SQLiteAdapter = require('pouchdb-adapter-react-native-sqlite')(WebSQLite);

PouchDBRN.plugin(require('pouchdb-quick-search'));
PouchDBRN.plugin(find);
PouchDBRN.plugin(rel);
PouchDBRN.plugin(PouchDBAuthentication);
PouchDBRN.plugin(SQLiteAdapter);

export type Database = PouchDB.RelDatabase<DBContent>;
export type AttachmentsDatabase = PouchDB.Database<AttachmentsDBContent>;
export type LogsDatabase = PouchDB.Database<LogsDBContent>;

export function getDatabase(name: string): Database {
  const db = new PouchDBRN<DBContent>(name, { adapter: 'react-native-sqlite' });
  const relDB = db.setSchema(schema);
  return relDB;
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
