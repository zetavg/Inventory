import PouchDBRN from 'pouchdb-react-native';

import WebSQLite from 'react-native-quick-websql';

export const DB_NAME = 'pouchdb-sqlite';

const SQLiteAdapter = require('pouchdb-adapter-react-native-sqlite')(WebSQLite);

PouchDBRN.plugin(SQLiteAdapter);
const db = new PouchDBRN(DB_NAME, { adapter: 'react-native-sqlite' });

export default db;
