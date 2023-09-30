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
await getData('collection', {}, {});
await getData('item', {}, { sort: [{ __updated_at: 'desc' }], limit: 10 });
await getDatum('item', '<item_id>');
await getRelated((await getData('collection'))[0], 'items', { limit: 10 });
```
