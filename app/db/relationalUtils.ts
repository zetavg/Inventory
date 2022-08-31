import Ajv, {
  _,
  ErrorObject,
  KeywordCxt,
  ValidateFunction,
} from 'ajv/dist/jtd';
import { Database } from './pouchdb';
import schema, { Schema, TypeName, DataType, RelationDef } from './schema';

// ==== Validators ==== //

let ajv: Ajv | undefined;
export function getAjv(): Ajv {
  if (ajv) return ajv;

  ajv = new Ajv({ allErrors: true });

  ajv.addKeyword({
    keyword: 'trimAndNotEmpty',
    type: 'string',
    schemaType: 'boolean',
    code: (cxt: KeywordCxt) => {
      if (cxt.schema) {
        cxt.gen.assign(cxt.data, _`${cxt.data}.trim()`);
        cxt.gen.assign(
          _`${cxt.it.parentData}[${cxt.it.parentDataProperty}]`,
          cxt.data,
        );
        cxt.fail(_`${cxt.data} === ''`);
      }
    },
  });

  return ajv;
}

const cachedValidators: {
  [cacheKey: string]: ValidateFunction<any>;
} = {};

export function getValidator<T extends TypeName>(
  key: T,
): ValidateFunction<DataType<T>> {
  if (cachedValidators[key]) {
    return cachedValidators[key];
  }

  const dataSchema: any = schema[key].dataSchema;

  const validator: any = getAjv().compile({
    ...dataSchema,
    optionalProperties: {
      id: { type: 'string' },
      rev: { type: 'string' },
      ...dataSchema.optionalProperties,
    },
  });
  cachedValidators[key] = validator;

  return validator;
}

// ==== Types ==== //

export type DataTypeWithID<T extends TypeName> = {
  id?: string;
  rev?: string;
} & DataType<T>;

export type FindWithRelationsReturnedData<T extends TypeName> = {
  data: DataTypeWithID<T> | null;
  getRelated: <T extends TypeName>(
    field: string,
    options: { arrElementType: T },
  ) => ReadonlyArray<DataTypeWithID<T>>;
};

// ==== Util Functions ==== //

/**
 * A wrapper of `db.rel.find` with better types and returned data format.
 */
export async function find<T extends TypeName>(
  db: Database,
  type: T,
): Promise<DataTypeWithID<T>[]> {
  const typeDef = schema[type];
  if (!typeDef) throw new Error(`No such type: ${type}`);

  const data = await db.rel.find(type);

  const docs = data && data[typeDef.plural];

  return docs;
}

/**
 * A wrapper of `db.rel.find` with better types and returned data format.
 * @type {[type]}
 */
export async function findWithRelations<T extends TypeName>(
  db: Database,
  type: T,
  id: number | string,
): Promise<FindWithRelationsReturnedData<T>> {
  const typeDef = schema[type];
  if (!typeDef) throw new Error(`No such type: ${type}`);

  const data = await db.rel.find(type, id);
  const doc =
    data &&
    data[typeDef.plural] &&
    data[typeDef.plural].find((d: any) => d?.id === id);

  if (!doc) return { data: null, getRelated: () => [] };

  const relatedData: Record<
    string,
    undefined | Array<DataType<any>> | DataType<any>
  > = {};

  Object.entries(data).forEach(([relationDataTypePlural, relationData]) => {
    const relationDataTypeNameAndDef = Object.entries(schema).find(
      ([__, def]) => def.plural === relationDataTypePlural,
    );
    if (!relationDataTypeNameAndDef) return;

    const [relationDataTypeName, _relationDataTypeDef] =
      relationDataTypeNameAndDef;

    const relatedRelations = Object.entries(typeDef.relations || {}).filter(
      ([_field, relation]) =>
        relation?.belongsTo === relationDataTypeName ||
        relation?.belongsTo?.type === relationDataTypeName ||
        relation?.hasMany === relationDataTypeName ||
        relation?.hasMany?.type === relationDataTypeName,
    );

    // Check each datum against each relation and see where they belongs to.
    (relationData as any).forEach((relationD: any) => {
      relatedRelations.forEach(([field, relation]) => {
        const relationDefValue =
          (relation as any).belongsTo || (relation as any).hasMany;
        if (Array.isArray(doc[field]) && doc[field].includes(relationD.id)) {
          // Has many relation without queryInverse
          if (!relatedData[field]) relatedData[field] = [];
          (relatedData[field] as any)?.push(relationD);
        } else if (doc[field] === relationD.id) {
          // belongsTo
          relatedData[field] = relationD;
        } else if (
          typeof relationDefValue === 'object' &&
          (relationDefValue as any).options?.queryInverse &&
          relationD[(relationDefValue as any).options?.queryInverse] === doc.id
        ) {
          // Has many relation with queryInverse
          if (!relatedData[field]) relatedData[field] = [];
          (relatedData[field] as any)?.push(relationD);
        }
      });
    });
  });

  const getRelated: FindWithRelationsReturnedData<T>['getRelated'] = field => {
    const d = relatedData[field];
    if (!d) return [];

    if (Array.isArray(d)) return d;
    return [d];
  };

  return { data: doc, getRelated };
}

/**
 * A wrapper of `db.rel.save` with better types and returned data format.
 */
export async function save<T extends TypeName>(
  db: Database,
  type: T,
  data: any,
): Promise<void> {
  const typeDef = schema[type];
  if (!typeDef) throw new Error(`No such type: ${type}`);

  await validate(db, type, data);

  // TODO: pre-process

  await db.rel.save(type, data);

  // TODO: post-process
}

export function validateData<T extends TypeName>(
  type: T,
  data: unknown,
): data is DataTypeWithID<T> {
  const v = getValidator(type);
  const valid = v(data);

  if (!valid) {
    const errors = v.errors;
    if (errors) validateData.errors = errors;
  }

  return valid;
}

validateData.errors = [] as ErrorObject[];

export async function validate<T extends TypeName>(
  db: Database,
  type: T,
  data: any,
): Promise<void> {
  const typeDef = schema[type];
  if (!typeDef) throw new Error(`No such type: ${type}`);

  if (!validateData(type, data)) {
    const error: any = new Error(
      validateData.errors.map(e => e.message).join(', '),
    );
    error.errors = validateData.errors;
    throw error;
  }

  const relations = typeDef.relations;

  for (const [field, relationDef] of Object.entries(relations)) {
    const relationType = Object.keys(relationDef)[0];
    const value = (data as any)[field];
    if (!value) continue;

    switch (relationType) {
      case 'belongsTo': {
        const foreignTypeName = relationDef[relationType];
        const foreignTypeDef = (schema as any)[foreignTypeName];
        if (!foreignTypeDef)
          throw new Error(
            `No such type: ${foreignTypeName}, check the relations definition of type ${type}`,
          );

        const exists = await db
          .get(`${foreignTypeName}-${2}-${value}`)
          .then(() => true)
          .catch(() => false);
        if (!exists) throw new Error(`${field} of ${value} does not exist`);
        break;
      }
    }
  }
}

// ==== Base Util Functions ==== //

/**
 * Get related data type name from relation definition
 */
export function getDataTypeNameFromRelation(
  relation: any,
): TypeName | undefined {
  if (typeof relation?.belongsTo === 'string') return relation.belongsTo;
  if (typeof relation?.hasMany === 'string') return relation.hasMany;
  if (typeof relation?.belongsTo?.type === 'string')
    return relation?.belongsTo?.type;
  if (typeof relation?.hasMany?.type === 'string')
    return relation?.hasMany?.type;
}

/**
 * Get relation type (`hasMany`, `belongsTo`) name from relation definition
 */
export function getTypeFromRelation(relation: RelationDef): string | undefined {
  return Object.keys(relation)[0];
}

export function getQueryInverseFromRelation(
  relation: any,
): TypeName | undefined {
  if (
    typeof relation?.hasMany === 'object' &&
    relation.hasMany?.options?.queryInverse
  )
    return relation.hasMany?.options?.queryInverse;
}

// ==== Schema Util Functions ==== //

/**
 * Translate schema to relational-pouch schema.
 */
export function translateSchema(s: Schema) {
  return Object.entries(s).map(([singular, { relations, ...typeDef }]) => ({
    ...typeDef,
    singular,
    relations: Object.fromEntries(
      Object.entries(relations).filter(([_field, relDef]) => {
        const t = Object.keys(relDef)[0];
        return t === 'belongsTo' || t === 'hasMany';
      }),
    ),
  }));
}
