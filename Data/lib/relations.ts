import { DataTypeName } from './schema';
import type { DataTypeWithID, InvalidDataTypeWithID } from './types';

export type RelationConfig = {
  type_name: DataTypeName;
  foreign_key: string;
};

export type RelationDefn = {
  belongs_to?: Record<string, RelationConfig>;
  has_many?: Record<string, RelationConfig>;
};

export type RelationType = keyof RelationDefn;

function relation_defn<T extends Record<string, RelationDefn>>(defn: T) {
  return defn;
}

export const relation_definitions = relation_defn({
  collection: {
    has_many: { items: { type_name: 'item', foreign_key: 'collection_id' } },
  },
  item: {
    belongs_to: {
      collection: { type_name: 'collection', foreign_key: 'collection_id' },
      container: {
        type_name: 'item',
        foreign_key: 'container_id',
      },
    },
    has_many: {
      contents: {
        type_name: 'item',
        foreign_key: 'container_id',
      },
    },
  },
} as const);

export type DataTypeWithRelationDefsName = keyof typeof relation_definitions;

export type DataRelationName<T extends DataTypeWithRelationDefsName> =
  | ((typeof relation_definitions)[T] extends { belongs_to: any }
      ? keyof (typeof relation_definitions)[T]['belongs_to']
      : never)
  | ((typeof relation_definitions)[T] extends { has_many: any }
      ? keyof (typeof relation_definitions)[T]['has_many']
      : never);

export type DataRelationTypeName<
  T extends DataTypeWithRelationDefsName,
  DRN extends DataRelationName<T>,
> =
  | ((typeof relation_definitions)[T] extends {
      belongs_to: Record<DRN, { type_name: infer U }>;
    }
      ? U
      : never)
  | ((typeof relation_definitions)[T] extends {
      has_many: Record<DRN, { type_name: infer U }>;
    }
      ? U
      : never);

type DataRelationBaseType<T extends DataTypeName> =
  | DataTypeWithID<T>
  | InvalidDataTypeWithID<T>;

export type DataRelationType<
  T extends DataTypeWithRelationDefsName,
  DRN extends DataRelationName<T>,
> =
  | ((typeof relation_definitions)[T] extends {
      belongs_to: Record<DRN, { type_name: infer U extends DataTypeName }>;
    }
      ? DataRelationBaseType<U> | null
      : never)
  | ((typeof relation_definitions)[T] extends {
      has_many: Record<DRN, { type_name: infer U extends DataTypeName }>;
    }
      ? Array<DataRelationBaseType<U>>
      : never);

export function getRelationTypeAndConfig<
  T extends DataTypeWithRelationDefsName,
>(type: T, relationName: DataRelationName<T>): [RelationType, RelationConfig] {
  const relD = relation_definitions[type] as any;

  if (relD.belongs_to) {
    if (relD.belongs_to[relationName]) {
      return ['belongs_to', relD.belongs_to[relationName]];
    }
  }

  if (relD.has_many) {
    if (relD.has_many[relationName]) {
      return ['has_many', relD.has_many[relationName]];
    }
  }

  throw new Error(
    `Cannot find relation "${String(relationName)}" on defn ${JSON.stringify(
      relD,
    )}`,
  );
}
