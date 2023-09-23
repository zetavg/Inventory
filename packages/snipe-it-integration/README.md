# snipe-it-integration

Integration for for Snipe-IT - free open source IT asset management software.

## snipe-it-client

A minimal client for Snipe-IT.

### Try it in `ts-node`

```bash
ts-node
```

```js
import fetch from 'node-fetch';
const baseUrl = 'https://<domain>/api/v1';
const key = '<key>';
const ctx = { fetch, baseUrl, key };
```

```js
import getCompanies from  './lib/snipe-it-client/functions/getCompanies';
getCompanies(ctx).then(companies => console.log(companies))
```
