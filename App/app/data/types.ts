import { DataType, DataTypeName } from './schema';

export type DataTypeWithAdditionalInfo<T extends DataTypeName> = DataType<T> & {
  __id: string;
  __type: T;
  __created_at?: number;
  __updated_at?: number;
};
