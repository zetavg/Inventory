import PouchDBRN from 'pouchdb-react-native';

PouchDBRN.plugin(require('pouchdb-adapter-asyncstorage').default);
const db = new PouchDBRN('pouchdb', {
  adapter: 'asyncstorage',
});

export default db;
