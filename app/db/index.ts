import PouchDBRN from 'pouchdb-react-native';
import WebSQLite from 'react-native-quick-websql';
import { DBContent, AttachmentDBContent } from './types';

const SQLiteAdapter = require('pouchdb-adapter-react-native-sqlite')(WebSQLite);

PouchDBRN.plugin(require('pouchdb-quick-search'));
PouchDBRN.plugin(SQLiteAdapter);

export type Database = PouchDB.Database<DBContent>;
export type AttachmentsDatabase = PouchDB.Database<AttachmentDBContent>;

export function getDatabase(name: string): Database {
  return new PouchDBRN<DBContent>(name, { adapter: 'react-native-sqlite' });
}

export function getAttachmentsDatabase(name: string): AttachmentsDatabase {
  return new PouchDBRN<AttachmentDBContent>(name, {
    adapter: 'react-native-sqlite',
  });
}
