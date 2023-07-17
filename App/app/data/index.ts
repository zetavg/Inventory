import useConfig from './hooks/useConfig';
import useData from './hooks/useData';
import useDataCount from './hooks/useDataCount';
import useRelated from './hooks/useRelated';
import useSave from './hooks/useSave';
import fixConsistency from './fixConsistency';
import schema, {
  DATA_TYPE_NAMES,
  DataType,
  DataTypeName,
  getPropertyNames,
  getPropertyType,
  plurals as typePlurals,
} from './schema';
import type { DataTypeWithAdditionalInfo } from './types';
import { getHumanTypeName, toTitleCase } from './utils';
export {
  DATA_TYPE_NAMES,
  fixConsistency,
  getHumanTypeName,
  getPropertyNames,
  getPropertyType,
  schema,
  toTitleCase,
  typePlurals,
  useConfig,
  useData,
  useDataCount,
  useRelated,
  useSave,
};
export type { DataType, DataTypeName, DataTypeWithAdditionalInfo };
