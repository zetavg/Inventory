# snipe-it-integration

Integration for Snipe-IT - free open source IT asset management software.

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
getCompanies(ctx).then(companies => console.log(companies));
```

```js
import getCategories from  './lib/snipe-it-client/functions/getCategories';
getCategories(ctx).then(categories => console.log(categories));
```

```js
import getModelById from  './lib/snipe-it-client/functions/getModelById';
getModelById(ctx, 1).then(model => console.log(model));
```

```js
import getAssetById from  './lib/snipe-it-client/functions/getAssetById';
getAssetById(ctx, 1).then(asset => console.log(asset));
```

```js
import getAssetsGenerator from  './lib/snipe-it-client/functions/getAssetsGenerator';
(async function () {
  for await (const { total, current, asset } of getAssetsGenerator(ctx, 1)) {
    console.log(`${current}/${total}:`, asset);
  }
})();
```
