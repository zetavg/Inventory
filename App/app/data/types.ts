import { DataType, DataTypeName } from './schema';

export type DataTypeWithAdditionalInfo<T extends DataTypeName> = DataType<T> & {
  __type: T;
  __id?: string;
  __rev?: string;
  __deleted?: boolean;
  __created_at?: number;
  __updated_at?: number;
  __valid: true;
  __raw: unknown;
};

export type InvalidDataTypeWithAdditionalInfo<T extends DataTypeName> = {
  __type: T;
  __id?: string;
  __valid: false;
  __raw?: unknown;
  __errors?: unknown;
  __error_details?: unknown;
} & { [key: string]: unknown };

export const DATA_ADDITIONAL_INFO_KEYS = [
  '__type',
  '__id',
  '__rev',
  '__deleted',
  '__created_at',
  '__updated_at',
] as const;
