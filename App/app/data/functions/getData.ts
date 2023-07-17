import appLogger, { getLevelsToLog } from '@app/logger';

import {
  getDataTypeSelector,
  getDatumFromDoc,
  getPouchDbId,
} from '../pouchdb-utils';
import { DataType, DataTypeName } from '../schema';
import {
  DataTypeWithAdditionalInfo,
  InvalidDataTypeWithAdditionalInfo,
} from '../types';

type Sort = Array<{ [propName: string]: 'asc' | 'desc' }>;

export default async function getData<T extends DataTypeName>(
  type: T,
  conditions: ReadonlyArray<string> | Partial<DataType<T>>,
  {
    skip = 0,
    limit = undefined,
    sort,
  }: {
    skip?: number;
    limit?: number;
    sort?: Sort;
  } = {},
  {
    db,
    logger,
  }: {
    db: PouchDB.Database;
    logger: typeof appLogger;
  },
): Promise<
  Array<DataTypeWithAdditionalInfo<T> | InvalidDataTypeWithAdditionalInfo<T>>
> {
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
    // TODO: implement
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

  return response.docs.map(d => getDatumFromDoc(type, d, logger)) as any;
}
