import {
  z,
  ZodBoolean,
  ZodNullable,
  ZodNumber,
  ZodOptional,
  ZodString,
} from 'zod';

import { schema } from './generated-schema';

export default schema;

export const plurals: Record<keyof typeof schema, string> = {
  collection: 'collections',
  item: 'items',
};

export type DataTypeName = keyof typeof schema;
export const DATA_TYPE_NAMES: ReadonlyArray<DataTypeName> = Object.keys(
  schema,
) as any;

export type DataType<T extends DataTypeName> = z.infer<(typeof schema)[T]>;

export function getPropertyNames<T extends DataTypeName>(
  type: T,
): ReadonlyArray<keyof (typeof schema)[T]['shape']> {
  return Object.keys(schema[type].shape) as any;
}

type TypeName = 'string' | 'number' | 'boolean' | 'unknown';

function getTypeFromZodTypeDef(t: unknown): [TypeName, ReadonlyArray<string>] {
  if (t instanceof ZodOptional || t instanceof ZodNullable) {
    return getTypeFromZodTypeDef(t.unwrap());
  }

  if (t instanceof ZodString) {
    return ['string', []];
  }

  if (t instanceof ZodNumber) {
    return ['number', []];
  }

  if (t instanceof ZodBoolean) {
    return ['boolean', []];
  }

  return ['unknown', []];
}

export function getPropertyType<T extends DataTypeName>(
  type: T,
  propertyName: keyof (typeof schema)[T]['shape'],
): [TypeName, ReadonlyArray<string>] {
  const zodType = (schema[type].shape as any)[propertyName];
  return getTypeFromZodTypeDef(zodType);
}
