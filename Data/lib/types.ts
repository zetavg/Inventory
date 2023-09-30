import {
  DataRelationName,
  DataRelationType,
  DataTypeWithRelationDefsName,
} from './relations';
import { ConfigType, DataType, DataTypeName } from './schema';
export type { DataTypeName } from './schema';

export type DataTypeWithID<T extends DataTypeName> = DataType<T> & {
  __type: T;
  __id?: string;
  __rev?: string;
  __deleted?: boolean;
  __created_at?: number;
  __updated_at?: number;
  __valid: true;
  __raw?: unknown;
};

export type InvalidDataTypeWithID<T extends DataTypeName> = {
  __type: T;
  __id?: string;
  __valid: false;
  __raw?: unknown;
  __errors?: unknown;
  __error_details?: unknown;
} & { [key: string]: unknown };

export type GetConfig = (options?: {
  /** Set to true to not allow using the default, unsaved config. */
  ensureSaved?: boolean;
}) => Promise<ConfigType>;

type PartialWithExists<T> = {
  [K in keyof T]?: T[K] | { $exists: boolean };
};

type SortOrder = 'asc' | 'desc';

type DataDateProperties = '__created_at' | '__updated_at';
type Sort<T> =
  | {
      [K in keyof T]?: SortOrder;
    }
  | { [key in DataDateProperties]?: SortOrder };

export type SortOption<T> = ReadonlyArray<Sort<T>>;

export type GetData = <T extends DataTypeName>(
  type: T,
  /** Array of IDs, or a partial match of the data */
  conditions?: ReadonlyArray<string> | PartialWithExists<DataType<T>>,
  options?: {
    skip?: number;
    limit?: number;
    sort?: SortOption<DataType<T>>;
  },
) => Promise<Array<DataTypeWithID<T> | InvalidDataTypeWithID<T>>>;

export type GetDatum = <T extends DataTypeName>(
  type: T,
  id: string,
) => Promise<DataTypeWithID<T> | InvalidDataTypeWithID<T> | null>;

export type GetRelated = <
  T extends DataTypeWithRelationDefsName,
  N extends DataRelationName<T>,
>(
  d: DataTypeWithID<T> | InvalidDataTypeWithID<T>,
  relationName: N,
  {
    sort,
  }: {
    sort?: SortOption<DataRelationType<T, N>>;
  },
) => Promise<DataRelationType<T, N> | null>;
