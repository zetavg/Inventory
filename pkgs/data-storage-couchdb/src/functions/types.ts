import type PouchDB from 'pouchdb';
import type nano from 'nano';

export type Logger = {
  debug: (message: string) => void;
  info: (message: string) => void;
  log: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
};

export type Context =
  | {
      dbType?: 'couchdb';
      db: nano.DocumentScope<unknown>;
      logger?: Logger | null;
      logLevels?: () => ReadonlyArray<string>;
      /** Since remote CouchDB server may not throw error if index not found */
      alwaysCreateIndexFirst?: boolean;
    }
  | {
      dbType: 'pouchdb';
      db: PouchDB.Database;
      logger?: Logger | null;
      logLevels?: () => ReadonlyArray<string>;
      /** Since remote CouchDB server may not throw error if index not found */
      alwaysCreateIndexFirst?: boolean;
    };

export type CouchDBDoc = {
  _id?: string;
  _rev?: string;
  _deleted?: boolean;
  type?: unknown;
  data?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};
