import useData from './hooks/useData';
import schema, { DataType, plurals as typePlurals } from './schema';
import { getHumanTypeName, toTitleCase } from './utils';
export { getHumanTypeName, schema, toTitleCase, typePlurals, useData };
export type { DataType };
