import {
  z,
  ZodArray,
  ZodBoolean,
  ZodEnum,
  ZodNullable,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodString,
} from 'zod';

import { schema as generatedSchema } from './generated-schema';

export const schema = filterObject(generatedSchema, ['config']);

export const configSchema = generatedSchema.config;
export type ConfigType = z.infer<typeof configSchema>;

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

type TypeName =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'enum'
  | 'array'
  | 'object'
  | 'unknown';

function getTypeFromZodTypeDef(t: unknown): [TypeName, ReadonlyArray<string>] {
  if (t instanceof ZodOptional || t instanceof ZodNullable) {
    return getTypeFromZodTypeDef(t.unwrap());
  }

  if (t instanceof ZodString) {
    return ['string', []];
  }

  if (t instanceof ZodNumber) {
    if (t._def.checks.some(c => c.kind === 'int')) {
      return ['integer', []];
    }
    return ['number', []];
  }

  if (t instanceof ZodBoolean) {
    return ['boolean', []];
  }

  if (t instanceof ZodEnum) {
    return ['enum', []];
  }

  if (t instanceof ZodArray) {
    return ['array', []];
  }

  if (t instanceof ZodObject) {
    return ['object', []];
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

function filterObject<
  T extends Record<string, unknown>,
  KS extends ReadonlyArray<keyof T>,
>(obj: T, keys: KS): Omit<T, KS[number]> {
  const filtered = Object.keys(obj)
    .filter(key => !keys.includes(key))
    .reduce((o, key) => {
      (o as any)[key] = obj[key];
      return o;
    }, {});
  return filtered as any;
}

export default schema;
