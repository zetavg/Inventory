import { beforeSave } from '../callbacks';
import { DataTypeName } from '../schema';
import {
  DataTypeWithAdditionalInfo,
  InvalidDataTypeWithAdditionalInfo,
} from '../types';

export const mockData: any = {};

export default async function setMockData<T extends DataTypeName>(
  type: T,
  d: Array<
    DataTypeWithAdditionalInfo<T> | InvalidDataTypeWithAdditionalInfo<T>
  >,
) {
  mockData[type] = await Promise.all(
    d.map(async dt => {
      await beforeSave(dt, { db: {} as any });
      return dt;
    }),
  );
}
