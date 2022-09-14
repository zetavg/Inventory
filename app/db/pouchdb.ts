import PouchDBRN from 'pouchdb-react-native';
import find from 'pouchdb-find';
import rel from 'relational-pouch';
import PouchDBAuthentication from 'pouchdb-authentication';
import WebSQLite from 'react-native-quick-websql';
import { DBContent, AttachmentsDBContent, LogsDBContent } from './types';
import schema from './schema';
import { translateSchema } from './relationalUtils';

const SQLiteAdapter = require('pouchdb-adapter-react-native-sqlite')(WebSQLite);

PouchDBRN.plugin(require('pouchdb-quick-search'));
PouchDBRN.plugin(find);
PouchDBRN.plugin(rel);
PouchDBRN.plugin(PouchDBAuthentication);
PouchDBRN.plugin(SQLiteAdapter);

export type Database = PouchDB.RelDatabase<DBContent> & {
  indexesReady: Promise<void>;
};
export type AttachmentsDatabase = PouchDB.Database<AttachmentsDBContent>;
export type LogsDatabase = PouchDB.Database<LogsDBContent>;

export function getDatabase(name: string): Database {
  const db = new PouchDBRN<DBContent>(name, { adapter: 'react-native-sqlite' });
  const relDB = db.setSchema(translateSchema(schema));

  const relDataIndexDdoc = {
    views: {
      by_collection: {
        map: 'function (doc) { emit(doc && doc.data && doc.data.collection); }',
      },
    },
  };
  db.get('_design/relational_data_index')
    .catch(() => ({ _id: '_design/relational_data_index' }))
    .then(doc => db.put({ ...doc, ...relDataIndexDdoc } as any));

  return addIndexesToDB(relDB, [
    relDB.createIndex({
      index: {
        ddoc: 'index-field-collectionReferenceNumber',
        fields: ['data.collectionReferenceNumber'],
      },
    }),
    relDB.createIndex({
      index: {
        ddoc: 'index-field-computedRfidTagEpcMemoryBankContents',
        fields: ['data.computedRfidTagEpcMemoryBankContents'],
      },
    }),
    relDB.createIndex({
      index: {
        ddoc: 'index-field-actualRfidTagEpcMemoryBankContents',
        fields: ['data.actualRfidTagEpcMemoryBankContents'],
      },
    }),
  ]);
}

function addIndexesToDB(
  db: PouchDB.RelDatabase<DBContent>,
  indexPromises: Promise<any>[],
): PouchDB.RelDatabase<DBContent> & {
  indexesReady: Promise<any>;
} {
  const newDb: PouchDB.RelDatabase<DBContent> & {
    indexesReady: Promise<any>;
  } = db as any;
  newDb.indexesReady = Promise.all(indexPromises);
  return newDb;
}

export function getAttachmentsDatabase(name: string): AttachmentsDatabase {
  const db = new PouchDBRN<AttachmentsDBContent>(name, {
    adapter: 'react-native-sqlite',
    auto_compaction: true,
  });

  db.createIndex({
    index: { fields: ['thumbnail_type', 'added_at'] },
  });

  return db;
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
