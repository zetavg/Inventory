import { AttachmentContentType, AttachmentNameOfDataType } from './attachments';
import {
  DataRelationName,
  DataRelationType,
  DataTypeWithRelationDefsName,
} from './relations';
import { ConfigType, DataType, DataTypeName } from './schema';
export type { DataTypeName } from './schema';

export type DataMeta<T extends DataTypeName> = {
  __type: T;
  __id?: string;
  __rev?: string;
  __deleted?: boolean;
  __created_at?: number;
  __updated_at?: number;
  __raw?: unknown;
};

export type DataTypeWithID<T extends DataTypeName> = DataMeta<T> & DataType<T>;

export type ValidationIssue = {
  message: string;
  code?: string;
  path?: (string | number)[];
};

export type ValidDataTypeWithID<T extends DataTypeName> = DataTypeWithID<T> & {
  __valid: true;
};

export type InvalidDataTypeWithID<T extends DataTypeName> = DataMeta<T> & {
  __valid: false;
  __issues?: ValidationIssue[];
  __error?: Error;
  __error_details?: unknown;
} & { [key: string]: unknown };

export type DataHistory<T extends DataTypeName> = {
  created_by?: string;
  batch?: number;
  event_name?: string;
  data_type: T;
  data_id: string;
  timestamp: number;
  original_data: { [key: string]: unknown };
  new_data: { [key: string]: unknown };
};

export type GetConfig = (options?: {
  /** Set to true to not allow using the default, unsaved config. */
  ensureSaved?: boolean;
}) => Promise<ConfigType>;

export type UpdateConfig = (config: Partial<ConfigType>) => Promise<ConfigType>;

export type GetDatum = <T extends DataTypeName>(
  type: T,
  id: string,
) => Promise<ValidDataTypeWithID<T> | InvalidDataTypeWithID<T> | null>;

type PartialWithCond<T> = {
  [K in keyof T]?:
    | T[K]
    | { $exists: boolean }
    | { $lt: T[K] }
    | { $gt: T[K] }
    | { $lte: T[K] }
    | { $gte: T[K] };
};

export type ConditionsObject<T extends DataTypeName> = PartialWithCond<
  DataType<T>
>;

export type GetDataConditions<T extends DataTypeName> =
  | ReadonlyArray<string>
  | ConditionsObject<T>;

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
  conditions?: GetDataConditions<T>,
  options?: {
    skip?: number;
    limit?: number;
    sort?: SortOption<DataType<T>>;
    debug?: boolean;
  },
) => Promise<Array<ValidDataTypeWithID<T> | InvalidDataTypeWithID<T>>>;

export type GetDataCount = <T extends DataTypeName>(
  type: T,
  conditions?: ConditionsObject<T>,
) => Promise<number>;

export type GetRelated = <
  T extends DataTypeWithRelationDefsName,
  N extends DataRelationName<T>,
>(
  d: DataMeta<T> & { [key: string]: unknown },
  relationName: N,
  {
    sort,
  }: {
    sort?: SortOption<DataRelationType<T, N>>;
  },
) => Promise<DataRelationType<T, N> | null>;

/**
 * Create, update or delete a datum.
 *
 * It will return the saved datum or throw if anything fails.
 */
export type SaveDatum = <T extends DataTypeName>(
  /**
   * The data to create, update or delete.
   *
   * * For creation, if `__id` is omitted, a random one will be assigned automatically.
   * * For updating, data can be provided partially, just make sure that `__type` and `__id` is valid.
   *     * A updater function can also be used by providing a tuple of the data type, ID and the updater function. In such case, `ignoreConflict` will be assumed as `true`.
   * * For deletion, set `__deleted` to `true` while making sure that `__type` and `__id` is valid. Other fields are not necessary for deletion.
   */
  data:
    | (DataMeta<T> &
        (
          | { [key: string]: unknown } // Since the data will be validated, we can accept unknown user input.
          // Adding this just for editor auto-complete
          | DataType<T>
        ))
    | [
        T,
        string,
        (
          d: Readonly<DataMeta<T> & { [key: string]: unknown }>,
        ) => Partial<DataType<T>>,
      ],
  options?: {
    /** Set to true to not update the `__updated_at` field. */
    noTouch?: boolean;
    /** Set to true to force ignore data conflicts and override the data. */
    ignoreConflict?: boolean;
    /** By default, if no changes has been made, the data will not be touched. Set this to true to force update the `__updated_at` field even if no data has been changed. */
    forceTouch?: boolean;
    skipValidation?: boolean;
    skipCallbacks?: boolean;
    createHistory?: {
      createdBy?: string;
      batch?: number;
      eventName?: string;
    };
  },
) => Promise<DataMeta<T> & { [key: string]: unknown }>;

export type AttachAttachmentToDatum = <
  T extends DataTypeName,
  N extends AttachmentNameOfDataType<T>,
>(
  d: DataMeta<T>,
  attachmentName: N,
  contentType: AttachmentContentType<T, N>,
  data: string,
) => Promise<DataType<T>>;

export type GetAttachmentInfoFromDatum = <T extends DataTypeName>(
  d: DataMeta<T>,
  attachmentName: AttachmentNameOfDataType<T>,
) => Promise<null | { content_type: string; size: number; digest?: string }>;
export type GetAttachmentFromDatum = <T extends DataTypeName>(
  d: DataMeta<T>,
  attachmentName: AttachmentNameOfDataType<T>,
) => Promise<null | {
  content_type: string;
  size: number;
  digest?: string;
  data: string | Blob | Buffer;
}>;
export type GetAllAttachmentInfoFromDatum = <T extends DataTypeName>(
  d: DataMeta<T>,
) => Promise<{
  [name: string]: { content_type: string; size: number; digest?: string };
}>;

export type GetDatumHistories = <T extends DataTypeName>(
  type: T,
  id: string,
  options?: { limit?: number; after?: number },
) => Promise<Array<DataHistory<T>>>;
export type ListHistoryBatchesCreatedBy = (
  created_by: string,
  options?: { limit?: number; after?: number },
) => Promise<Array<{ batch: number }>>;
export type GetHistoriesInBatch = (
  batch: number,
  options?: { createdBy?: string },
) => Promise<Array<DataHistory<DataTypeName>>>;
export type RestoreHistory = <T extends DataTypeName>(
  history: DataHistory<T>,
  options?: { batch?: number },
) => Promise<DataMeta<T> & { [key: string]: unknown }>;
