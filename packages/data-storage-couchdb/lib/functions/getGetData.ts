import {
  DataTypeWithID,
  GetData,
  InvalidDataTypeWithID,
} from '@deps/data/types';

import type nano from 'nano';

import { getCouchDbId, getDatumFromDoc } from './couchdb-utils';

export default function getGetData({
  db,
}: {
  db: nano.DocumentScope<unknown>;
}): GetData {
  const getData: GetData = async function getData(
    type,
    conditions,
    { skip = 0, limit = undefined, sort },
  ) {
    let selector = { type };

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
          $in: conditions.map(id => getCouchDbId(type, id)),
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
        ddoc: ddocName,
        name: ddocName,
        index: {
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
        ddoc: ddocName,
        name: ddocName,
        index: {
          fields: indexFields,
          partial_filter_selector: { type },
        },
      });
    } else {
      ddocName = 'get_data--type';
      await db.createIndex({
        ddoc: ddocName,
        name: ddocName,
        index: {
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

    const response = await db.find(query);

    const data = response.docs.map(d => getDatumFromDoc(type, d)) as any;

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
