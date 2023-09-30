import appLogger, { getLevelsToLog } from '@app/logger';

import { getDatumFromDoc, getPouchDbId } from '../pouchdb-utils';
import { DataType, DataTypeName } from '../schema';
import {
  DataTypeWithID,
  GetData,
  InvalidDataTypeWithID,
  SortOption,
} from '../types';

export function getGetData({
  db,
  logger,
}: {
  db: PouchDB.Database;
  logger: typeof appLogger;
}): GetData {
  const getData: GetData = async function getData(
    type,
    conditions = {},
    { skip = 0, limit = undefined, sort } = {},
  ) {
    let selector = {
      type,
      // ...getDataTypeSelector(type),
    };

    const sortData: typeof sort =
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

    let ddocName;
    if (Array.isArray(conditions)) {
      selector = {
        _id: {
          $in: conditions.map(id => getPouchDbId(type, id)),
        },
      } as any;
    } else if (Object.keys(conditions).length > 0) {
      const conditionData = Object.fromEntries(
        Object.entries(conditions).map(([k, v]) => [
          (() => {
            switch (k) {
              default:
                return `data.${k}`;
            }
          })(),
          v,
        ]),
      ) as any;
      const indexFields = [
        ...(sortData ? sortData.flatMap(s => Object.keys(s)) : []),
        ...Object.keys(conditionData),
      ];
      ddocName = `get_data--type_${type}--${indexFields.join('-')}`;
      await db.createIndex({
        index: {
          ddoc: ddocName,
          name: ddocName,
          fields: indexFields,
          partial_filter_selector: { type },
        },
      });
      selector = {
        ...conditionData,
      };
    } else if (sortData) {
      const indexFields = [...sortData.flatMap(s => Object.keys(s))];
      ddocName = `get_data--type_${type}--${indexFields.join('-')}`;
      await db.createIndex({
        index: {
          ddoc: ddocName,
          name: ddocName,
          fields: indexFields,
          partial_filter_selector: { type },
        },
      });
    } else {
      ddocName = 'get_data--type';
      await db.createIndex({
        index: {
          ddoc: ddocName,
          name: ddocName,
          fields: ['type'],
        },
      });
    }

    if (sortData) {
      for (const s of sortData) {
        for (const key of Object.keys(s)) {
          (selector as any)[key] = { $exists: true };
        }
      }
    }

    const query = {
      use_index: ddocName ? ([ddocName, ddocName] as any) : undefined,
      selector,
      skip,
      limit,
      sort: sortData || undefined,
    };

    if (getLevelsToLog().includes('debug')) {
      (db as any).explain(query).then((explain: any) =>
        logger.debug(`getData query: ${JSON.stringify(query, null, 2)}`, {
          details: JSON.stringify({ explain }, null, 2),
        }),
      );
    }

    const response = await db.find(query);

    const data = response.docs.map(d =>
      getDatumFromDoc(type, d, logger),
    ) as any;

    if (Array.isArray(conditions) && !sortData) {
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

export default async function getDataLegacy<T extends DataTypeName>(
  type: T,
  conditions: ReadonlyArray<string> | Partial<DataType<T>>,
  options: {
    skip?: number;
    limit?: number;
    sort?: SortOption;
  } = {},
  context: {
    db: PouchDB.Database;
    logger: typeof appLogger;
  },
): Promise<Array<DataTypeWithID<T> | InvalidDataTypeWithID<T>>> {
  return getGetData(context)(type, conditions, options);
}
