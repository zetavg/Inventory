import PouchDBRN from 'pouchdb-react-native';
import WebSQLite from 'react-native-quick-websql';

const SQLiteAdapter = require('pouchdb-adapter-react-native-sqlite')(WebSQLite);

export const DB_NAME = 'pouchdb-sqlite';

PouchDBRN.plugin(require('pouchdb-quick-search'));
PouchDBRN.plugin(SQLiteAdapter);
const db = new PouchDBRN(DB_NAME, { adapter: 'react-native-sqlite' });

export default db;
