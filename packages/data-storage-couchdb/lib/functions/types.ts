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
    }
  | {
      dbType: 'pouchdb';
      db: PouchDB.Database;
      logger?: Logger | null;
      logLevels?: () => ReadonlyArray<string>;
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
