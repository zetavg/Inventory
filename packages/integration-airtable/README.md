# integration-airtable

Integration for Airtable.

## REPL

You can start a TypeScript REPL for development by running:

```bash
./repl
```

See `./repl --help` for more info.

Sample usage inside the REPL:

```js
// Get access token from https://airtable.com/create/tokens
var api = new AirtableAPI({ fetch, accessToken: '<access_token>' });
await api.listBases();

await createInventoryBase({
  api,
  // Find the Workspace ID by clicking on a workspace in https://airtable.com/workspaces and extracting the ID from the URL.
  workspaceId: '<workspace_id>',
  name: 'Test Inventory Base',
});
```
