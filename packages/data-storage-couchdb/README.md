# data-storage-couchdb

Functions for accessing data stored in CouchDB.

## Try it in `ts-node`

```bash
ts-node -r tsconfig-paths/register
```

```js
const nano = require('nano')('http://admin:mypassword@localhost:5984');
let db = nano.db.use('<db_name>');
```

```js
import getGetConfig from  './lib/functions/getGetConfig';
let getConfig = getGetConfig({ db });
await getConfig();
```

```js
import getGetDatum from  './lib/functions/getGetDatum';
let getDatum = getGetDatum({ db });
await getDatum('item', '<item_id>');
```

```js
import getGetData from  './lib/functions/getGetData';
let getData = getGetData({ db });
await getData('collection', {}, {});
```

```js
import getGetData from  './lib/functions/getGetData';
let getData = getGetData({ db });

import getGetRelated from  './lib/functions/getGetRelated';
let getRelated = getGetRelated({ db });
let collections = await getData('collection', {}, {});
await getRelated(collections[0], 'items', {});
```
