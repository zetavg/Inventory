import type PouchDB from 'pouchdb';
import type nano from 'nano';

export type Context =
  | {
      dbType?: 'couchdb';
      db: nano.DocumentScope<unknown>;
    }
  | {
      dbType: 'pouchdb';
      db: PouchDB.Database;
    };
