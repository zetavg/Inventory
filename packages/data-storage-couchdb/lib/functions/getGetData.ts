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
const AUTO_DDOC_PREFIX = 'auto_get_data';

export default function getGetData({
  db,
  logger,
  logLevels,
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
          fields: ['type'],
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

        const sortKeys = (couchdbSort || []).flatMap(s => Object.keys(s));

        const seenIndexFieldsSet = new Set();
        const indexFields = [
          ...Object.keys(flattenedSelector).sort(),
          ...sortKeys,
        ].filter(f => {
          const result = !seenIndexFieldsSet.has(f);
          if (result) seenIndexFieldsSet.add(f);
          return result;
        });

        const ddocName_ = `${AUTO_DDOC_PREFIX}--${type}--${indexFields.join(
          '-',
        )}`;
        const index_ = {
          fields: [...indexFields],
          partial_filter_selector: { type },
        };
        const query_ = {
          use_index: ddocName_,
          selector: {
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
                  ...indexFields
                    .filter(f => !sortKeysSet.has(f))
                    .map(k => ({ [k]: 'asc' as const })),
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

    if (logger && logDebug) {
      logger.debug(
        `getData query: ${JSON.stringify(
          query,
          null,
          2,
        )}, index: ${JSON.stringify(index, null, 2)}`,
      );
    }

    const response = await (async () => {
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
