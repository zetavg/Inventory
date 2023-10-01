import {
  DataTypeWithID,
  GetData,
  InvalidDataTypeWithID,
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

    const { selector, indexFields } = (() => {
      if (Array.isArray(conditions)) {
        if (couchdbSort) {
          throw new Error(
            'The sort option is not currently supported while using and array of IDs as the conditions',
          );
        }

        return {
          selector: {
            type,
            _id: {
              $in: conditions.map(id => getCouchDbId(type, id)),
            },
          },
          indexFields: [],
        };
      }

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

      const sfs = new Set();
      return {
        selector: {
          ...flattenedSelector,
        },
        indexFields: [...Object.keys(flattenedSelector), ...sortKeys].filter(
          f => {
            const result = !sfs.has(f);
            if (result) sfs.add(f);
            return result;
          },
        ),
      };
    })();

    const { ddocName, index } = (() => {
      if (indexFields.length <= 0) {
        return {
          ddocName: `${AUTO_DDOC_PREFIX}--type`,
          index: {
            fields: ['type'],
          },
        };
      } else {
        return {
          ddocName: `${AUTO_DDOC_PREFIX}--${type}--${indexFields.join('-')}`,
          index: {
            fields: [...indexFields],
            partial_filter_selector: { type },
          },
        };
      }
    })();

    const query = {
      use_index: ddocName ? ([ddocName, ddocName] as any) : undefined,
      selector: indexFields.length <= 0 ? { type } : selector,
      skip,
      limit,
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
    };

    if (logger && logDebug) {
      logger.debug(
        `getData query ${JSON.stringify(query, null, 2)} index ${JSON.stringify(
          index,
          null,
          2,
        )}`,
      );
    }

    const response = await (async () => {
      let retries = 0;
      while (true) {
        try {
          return await db.find(query);
        } catch (e) {
          if (retries > 3) throw e;

          await db.createIndex({
            ddoc: ddocName,
            name: ddocName,
            index,
          });

          if (logger && logDebug) {
            logger.debug(
              `getData: creating index "${ddocName}": ${JSON.stringify(
                index,
                null,
                2,
              )}`,
            );
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
        DataTypeWithID<typeof type> | InvalidDataTypeWithID<typeof type>
      >();
      for (const d of data) {
        dataMap.set(d.__id, d);
      }
      return conditions
        .map(id => dataMap.get(id))
        .filter((d): d is NonNullable<typeof d> => !!d);
    }

    return data;
  };

  return getData;
}
