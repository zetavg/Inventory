import {
  GetData,
  InvalidDataTypeWithID,
  ValidDataTypeWithID,
} from '@deps/data/types';

import {
  flattenSelector,
  getCouchDbId,
  getDatumFromDoc,
} from './couchdb-utils';
import { Context } from './types';

/**
 * We will need to update this if we change the auto ddoc generation logic, so
 * that the app can generate the new and updated design docs.
 */
const AUTO_DDOC_PREFIX = 'auto_get_data_v1';

export default function getGetData({
  db,
  logger,
  logLevels,
  alwaysCreateIndexFirst,
}: Context): GetData {
  const getData: GetData = async function getData(
    type,
    conditions = {},
    { skip = 0, limit = undefined, sort } = {},
  ) {
    const logDebug = logLevels && logLevels().includes('debug');

    const couchdbSort: Array<{ [key: string]: 'asc' | 'desc' }> | undefined =
      sort &&
      sort.map(
        s =>
          Object.fromEntries(
            Object.entries(s).map(([k, v]) => [
              (() => {
                switch (k) {
                  case '__id':
                    return '_id';
                  case '__created_at':
                    return 'created_at';
                  case '__updated_at':
                    return 'updated_at';
                  default:
                    return `data.${k}`;
                }
              })(),
              v,
            ]),
          ) as any,
      );

    const { query, ddocName, index } = (() => {
      // Array of IDs
      if (Array.isArray(conditions)) {
        if (couchdbSort) {
          throw new Error(
            'The sort option is not currently supported while using and array of IDs as the conditions',
          );
        }

        return {
          ddocName: undefined,
          index: undefined,
          query: {
            selector: {
              _id: {
                $in: conditions.map(id => getCouchDbId(type, id)),
              },
            },
            skip,
            limit,
          },
        };
      }

      // No conditions, no sort, only select by type.
      if (Object.keys(conditions).length <= 0 && (!sort || sort.length <= 0)) {
        const ddocName_ = `${AUTO_DDOC_PREFIX}--type`;
        const index_ = {
          fields: ['type', '_id'],
        };
        const query_ = {
          use_index: ddocName_,
          selector: { type },
          skip,
          limit,
        };

        return {
          ddocName: ddocName_,
          index: index_,
          query: query_,
        };
      }

      // Select or sort
      if (true) {
        const flattenedSelector = flattenSelector(
          Object.fromEntries(
            Object.entries(conditions).map(([k, v]) => [
              (() => {
                switch (k) {
                  case '__id':
                    return '_id';
                  case '__created_at':
                    return 'created_at';
                  case '__updated_at':
                    return 'updated_at';
                  default:
                    return `data.${k}`;
                }
              })(),
              (() => {
                switch (k) {
                  case '__id': {
                    if (typeof v === 'string') {
                      return `${type}-${v}`;
                    }

                    if (typeof v === 'object') {
                      return Object.fromEntries(
                        Object.entries(v).map(([kk, vv]) => {
                          if (
                            [
                              '$lt',
                              '$gt',
                              '$lte',
                              '$gte',
                              '$eq',
                              '$ne',
                            ].includes(kk)
                          ) {
                            return [kk, `${type}-${vv}`];
                          }
                          return [kk, vv];
                        }),
                      );
                    }

                    return v;
                  }
                  default:
                    return v;
                }
              })(),
            ]),
          ) as any,
        );

        const sortKeys = (couchdbSort || []).flatMap(s => Object.keys(s));
        // CouchDB limitation: sorts currently only support a single direction for all fields
        const shouldUseDesc = couchdbSort?.[0]?.[sortKeys[0]] === 'desc';

        const seenIndexFieldsSet = new Set();
        const indexFields = [
          ...Object.keys(flattenedSelector).sort(),
          ...sortKeys,
        ].filter(f => {
          if (f === '_id') return false;

          const result = !seenIndexFieldsSet.has(f);
          if (result) seenIndexFieldsSet.add(f);
          return result;
        });

        const ddocName_ =
          indexFields.length > 0
            ? `${AUTO_DDOC_PREFIX}--type_${type}--${indexFields.join('-')}${
                // shouldUseDesc ? '--desc' : ''
                ''
              }`
            : `${AUTO_DDOC_PREFIX}--type`;
        const index_ =
          indexFields.length > 0
            ? {
                // fields: ['type', ...indexFields].map(f =>
                //   shouldUseDesc ? { [f]: 'desc' } : { [f]: 'asc' },
                // ),
                fields: ['type', ...indexFields],
                partial_filter_selector: { type },
              }
            : {
                fields: ['type', '_id'],
              };
        const query_ = {
          use_index: ddocName_,
          selector: {
            type,
            ...flattenedSelector,
          },
          sort: couchdbSort
            ? (() => {
                // A PouchDB limitation: all the fields used in the index is needed
                // to be used in sort, if we are using sort.
                // See: `sortMatches = oneArrayIsStrictSubArrayOfOther(...)` in node_modules/pouchdb-find/lib/index.js
                const sortKeysSet = new Set(
                  couchdbSort.flatMap(s => Object.keys(s)),
                );
                return [
                  ...['type', ...indexFields]
                    .filter(f => !sortKeysSet.has(f))
                    .map(k => ({
                      [k]: shouldUseDesc ? ('desc' as const) : ('asc' as const),
                    })),
                  ...couchdbSort,
                ];
              })()
            : undefined,
          skip,
          limit,
        };

        return {
          ddocName: ddocName_,
          index: index_,
          query: query_,
        };
      }
    })();

    // Since remote CouchDB server may not throw error if index not found
    if (alwaysCreateIndexFirst && ddocName && index) {
      try {
        await db.createIndex({
          ddoc: ddocName,
          name: ddocName,
          index,
        });
      } catch (e) {}
    }

    if (logger && logDebug) {
      let explain = '';
      try {
        explain = `, explain: ${JSON.stringify(
          await ((db as any).explain as any)(query),
          null,
          2,
        )}`;
      } catch (e) {
        explain = `, explain: error on getting explain - ${
          e instanceof Error ? e.message : JSON.stringify(e)
        }`;
      }
      logger.debug(
        `getData query: ${JSON.stringify(
          query,
          null,
          2,
        )}, index: ${JSON.stringify(index, null, 2)}` + explain,
      );
    }

    const response = await (async () => {
      if (alwaysCreateIndexFirst) {
        return await db.find(query);
      }

      let retries = 0;
      while (true) {
        try {
          return await db.find(query);
        } catch (e) {
          if (retries > 3) throw e;

          if (ddocName && index) {
            if (logger && logDebug) {
              logger.debug(
                `getData: creating index "${ddocName}": ${JSON.stringify(
                  index,
                  null,
                  2,
                )}`,
              );
            }

            try {
              await db.createIndex({
                ddoc: ddocName,
                name: ddocName,
                index,
              });
            } catch (err) {
              logger?.warn(
                `Cannot create index ${ddocName}: ${err} (trying to create index because of ${e})`,
              );
            }
          }

          retries += 1;
        }
      }
    })();

    const data = response.docs.map(d =>
      getDatumFromDoc(type, d, { logger, logLevels }),
    ) as any;

    if (Array.isArray(conditions) && !couchdbSort) {
      const dataMap = new Map<
        string,
        ValidDataTypeWithID<typeof type> | InvalidDataTypeWithID<typeof type>
      >();
      for (const d of data) {
        dataMap.set(d.__id, d);
      }
      return conditions.map(
        (
          id,
        ):
          | ValidDataTypeWithID<typeof type>
          | InvalidDataTypeWithID<typeof type> =>
          dataMap.get(id) || { __type: type, __id: id, __valid: false },
      );
    }

    return data;
  };

  return getData;
}
