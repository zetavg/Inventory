# data-storage-couchdb

Functions for accessing data stored in CouchDB.

## REPL

You can start a TypeScript REPL to manage data in a CouchDB database by running:

```bash
./repl --db_uri <uri> --db_username <username>
```

See `./repl --help` for more info.

Sample usage inside the REPL:

```js
await getConfig();
await updateConfig({ /* ... */ });

await getData('collection', {}, {});
await getData('item', {}, { sort: [{ __updated_at: 'desc' }], limit: 10 });
await getDatum('item', '<item_id>');
await getRelated((await getData('collection'))[0], 'items', { limit: 10 });

// Insert data
newCollection = await saveDatum({ __type: 'collection', name: 'New Collection', icon_name: 'box', icon_color: 'gray', collection_reference_number: '1' });
newItem = await saveDatum({ __type: 'item', collection_id: newCollection.__id, name: 'New Item', icon_name: 'box', icon_color: 'gray', model_name: 'New Item Model' });

// Update data
await saveDatum({ ...newItem, individual_asset_reference: '123456' }, { ignoreConflict: true });

// Delete data
await saveDatum({ __type: 'item', __id: newItem.__id, __deleted: true }, { ignoreConflict: true });
await saveDatum({ __type: 'collection', __id: newCollection.__id, __deleted: true }, { ignoreConflict: true });

// Fix data consistency
(async () => {
  // Running this in async IIFE to allow stopping the iteration by pressing Ctrl+C
  let shouldStopIteration = false;
  const onSEGINT = () => {
    console.log('Stopping fixDataConsistency...');
    shouldStopIteration = true;
  };
  getREPL().on('SIGINT', onSEGINT);
  for await (const progress of fixDataConsistency({
    batchSize: 10,
    // Other parameters such as getData,saveDatum will be provided automatically buy the REPL
  })) {
    console.log(progress);
    fixDataConsistencyResults = progress;
    if (shouldStopIteration) break;
  }
  if (shouldStopIteration) {
    console.log('fixDataConsistency stopped.');
    console.log('');
  } else {
    console.log('fixDataConsistency done.');
    console.log('');
  }
  getREPL().removeListener('SIGINT', onSEGINT);
})();
```

## Run Test Suits

```bash
yarn test
```

### Run data-storage-couchdb test with debug logging

```bash
DEBUG=true yarn test lib/__tests__/data-storage-couchdb.test.ts
```

### Run data-storage-couchdb test with remote database

```bash
COUCHDB_URI='http://127.0.0.1:5984/<db_name>' COUCHDB_USERNAME=<username> COUCHDB_PASSWORD=<password> yarn test lib/__tests__/data-storage-couchdb.test.ts --runInBand
```
