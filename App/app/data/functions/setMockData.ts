import { DataTypeName } from '../schema';
import {
  DataTypeWithAdditionalInfo,
  InvalidDataTypeWithAdditionalInfo,
} from '../types';

export const mockData: any = {};

export default function setMockData<T extends DataTypeName>(
  type: T,
  d: Array<
    DataTypeWithAdditionalInfo<T> | InvalidDataTypeWithAdditionalInfo<T>
  >,
) {
  mockData[type] = d;
}
