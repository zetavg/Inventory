export * from '@invt/data/types';
import {
  DataTypeName,
  DataTypeWithID,
  InvalidDataTypeWithID,
} from '@invt/data/types';

// Below is for backward compatibility.

export type DataTypeWithAdditionalInfo<T extends DataTypeName> =
  DataTypeWithID<T>;

export type InvalidDataTypeWithAdditionalInfo<T extends DataTypeName> =
  InvalidDataTypeWithID<T>;

export const DATA_ADDITIONAL_INFO_KEYS = [
  '__type',
  '__id',
  '__rev',
  '__deleted',
  '__created_at',
  '__updated_at',
] as const;
