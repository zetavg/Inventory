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

      return {
        selector: {
          type,
          ...flattenedSelector,
          ...Object.fromEntries(sortKeys.map(k => [k, { $exists: true }])),
        },
        indexFields: [...Object.keys(flattenedSelector), ...sortKeys],
      };
    })();

    const { ddocName, index } = (() => {
      if (indexFields.length <= 0) {
        return {
          ddocName: 'auto_get_data--type',
          index: {
            fields: ['type'],
            partial_filter_selector: { type },
          },
        };
      } else {
        return {
          ddocName: `auto_get_data--${type}--${indexFields.join('-')}`,
          index: {
            fields: ['type', ...indexFields],
            partial_filter_selector: { type },
          },
        };
      }
    })();

    const query = {
      use_index: ddocName ? ([ddocName, ddocName] as any) : undefined,
      selector,
      skip,
      limit,
      sort: couchdbSort || undefined,
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
