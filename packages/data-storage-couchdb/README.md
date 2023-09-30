# data-storage-couchdb

Functions for accessing data stored in CouchDB.

## REPL

You can start a TypeScript REPL to manage data in a CouchDB database by running:

```bash
./repl.ts --db_uri <uri> --db_username <username>
```

See `./repl.ts --help` for more info.

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
```
