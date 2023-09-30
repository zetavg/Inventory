import appLogger from '@app/logger';

import { DataType, DataTypeName } from '../../schema';
import {
  DataTypeWithAdditionalInfo,
  GetData,
  InvalidDataTypeWithAdditionalInfo,
} from '../../types';
import { mockData } from '../setMockData';

type Sort = Array<{ [propName: string]: 'asc' | 'desc' }>;

export function getGetData(_context: {
  db: PouchDB.Database;
  logger: typeof appLogger;
}): GetData {
  const getData: GetData = async function getData<T extends DataTypeName>(
    type: T,
    conditions: ReadonlyArray<string> | Partial<DataType<T>> = {},
    {
      skip = 0,
      limit = undefined,
      sort,
    }: {
      skip?: number;
      limit?: number;
      sort?: Sort;
    } = {},
  ): Promise<
    Array<DataTypeWithAdditionalInfo<T> | InvalidDataTypeWithAdditionalInfo<T>>
  > {
    if (Array.isArray(conditions)) {
      const data = conditions.map((id: string) => {
        return mockData[type].find(
          (
            d:
              | DataTypeWithAdditionalInfo<T>
              | InvalidDataTypeWithAdditionalInfo<T>,
          ) => d.__id === id,
        );
      });
      return data.filter(d => !!d);
    }

    const filteredData = mockData[type].filter((d: any) => {
      for (const [k, v] of Object.entries(conditions)) {
        if (d[k] !== v) return false;
      }
      return true;
    });

    const sortedData = filteredData.sort((a: any, b: any) => {
      for (const s of sort || []) {
        const [k, v] = Object.entries(s)[0];

        if (typeof a[k] === 'number' && typeof b[k] === 'number') {
          if (a[k] < b[k]) return v === 'asc' ? -1 : 1;
          if (a[k] > b[k]) return v === 'asc' ? 1 : -1;
        }

        // TODO: support other types
      }
      return 0;
    });

    return sortedData;
  };

  return getData;
}

export default async function getDataLegacy<T extends DataTypeName>(
  type: T,
  conditions: ReadonlyArray<string> | Partial<DataType<T>>,
  options: {
    skip?: number;
    limit?: number;
    sort?: Sort;
  } = {},
  context: {
    db: PouchDB.Database;
    logger: typeof appLogger;
  },
): Promise<
  Array<DataTypeWithAdditionalInfo<T> | InvalidDataTypeWithAdditionalInfo<T>>
> {
  return await getGetData(context)(type, conditions, options);
}
