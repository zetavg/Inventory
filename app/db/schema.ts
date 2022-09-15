import type { Schema as JTDSchema } from 'jtd';
import { JTDDataType } from 'ajv/dist/jtd';
import EPCUtils from '@app/modules/EPCUtils';
import { ICON_COLORS, ICON_NAMES } from '@app/consts/icons';

// ==== Type of Schema ==== //

export type RelationDef =
  | { belongsTo: string }
  // `queryInverse` must be used to avoid the need of adding foreign keys on both sides.
  | { hasMany: { type: string; options: { queryInverse: string } } };

export type TypeDef = Readonly<{
  plural: string;
  dataSchema: JTDSchema;
  relations: {
    [field: string]: RelationDef;
  };
  /** The title field of this type, mainly used in auto UI generation */
  titleField: string;
}>;

export type Schema = Readonly<{ [type: string]: TypeDef }>;

// ==== Util Functions ==== //

/**
 * For type-checking the JTD schema while the constant type of the schema can be infered.
 */
function jtdSchema<T extends JTDSchema>(schema: T): T {
  return schema;
}

/**
 * For type-checking the relational schema while the constant type of the schema can be infered.
 */
function s<T extends Schema>(schema: T): T {
  return schema;
}

// ==== Schema ==== //

export const schema = s({
  site: {
    plural: 'sites',
    dataSchema: jtdSchema({
      properties: {
        name: { type: 'string', metadata: { trimAndNotEmpty: true } },
      },
      additionalProperties: false,
    }),
    relations: {
      rooms: {
        hasMany: { type: 'room', options: { queryInverse: 'site' } },
      },
    },
    titleField: 'name',
  },
  room: {
    plural: 'rooms',
    dataSchema: jtdSchema({
      properties: {
        name: { type: 'string', metadata: { trimAndNotEmpty: true } },
        // relations
        site: { type: 'string' },
      },
      additionalProperties: false,
    }),
    relations: {
      site: { belongsTo: 'site' },
      locations: {
        hasMany: { type: 'location', options: { queryInverse: 'room' } },
      },
    },
    titleField: 'name',
  },
  location: {
    plural: 'locations',
    dataSchema: jtdSchema({
      properties: {
        name: { type: 'string', metadata: { trimAndNotEmpty: true } },
        // relations
        room: { type: 'string' },
      },
      additionalProperties: false,
    }),
    relations: {
      room: { belongsTo: 'room' },
    },
    titleField: 'name',
  },
  collection: {
    plural: 'collections',
    dataSchema: jtdSchema({
      properties: {
        name: { type: 'string', metadata: { trimAndNotEmpty: true } },
        iconName: { type: 'string' /* , enum: ICON_NAMES */ },
        iconColor: { type: 'string' /* , enum: ICON_COLORS */ },
        collectionReferenceNumber: {
          type: 'string',
          metadata: { match: EPCUtils.COLLECTION_REFERENCE_REGEX },
        },
      },
      optionalProperties: {
        itemDefaultIconName: { type: 'string' /* , enum: ICON_NAMES */ },
      },
      additionalProperties: true,
    }),
    relations: {
      items: {
        hasMany: { type: 'item', options: { queryInverse: 'collection' } },
      },
    },
    titleField: 'name',
  },
  item: {
    plural: 'items',
    dataSchema: jtdSchema({
      properties: {
        name: { type: 'string', metadata: { trimAndNotEmpty: true } },
        iconName: { type: 'string' /* , enum: ICON_NAMES */ },
        iconColor: { type: 'string' /* , enum: ICON_COLORS */ },
        // relations
        collection: { type: 'string' },
      },
      optionalProperties: {
        itemReferenceNumber: {
          type: 'string',
          metadata: { match: EPCUtils.ITEM_REFERENCE_REGEX },
        },
        serial: {
          type: 'uint16',
          // TODO: validate range
        },
        individualAssetReference: {
          type: 'string',
          metadata: { editable: false },
        },
        computedRfidTagEpcMemoryBankContents: {
          type: 'string',
          metadata: { editable: false },
        },
        actualRfidTagEpcMemoryBankContents: {
          type: 'string',
          metadata: { editable: false },
        },
        rfidTagAccessPassword: {
          type: 'string',
          metadata: { editable: false },
        },
        createdAt: { type: 'uint32' },
        updatedAt: { type: 'uint32' },
        isContainer: { type: 'boolean' },
        // relations
        dedicatedContainer: { type: 'string' },
        container: { type: 'string' },
      },
      additionalProperties: true,
    }),
    relations: {
      collection: { belongsTo: 'collection' },
      // container
      dedicatedContainer: { belongsTo: 'item' },
      container: { belongsTo: 'item' },
      dedicatedContents: {
        hasMany: {
          type: 'item',
          options: { queryInverse: 'dedicatedContainer' },
        },
      },
      items: {
        hasMany: { type: 'item', options: { queryInverse: 'container' } },
      },
      // travelContainer: { belongsTo: 'item' },
    },
    titleField: 'name',
  },
  // room: {
  //   plural: 'rooms',
  //   relations: {
  //     site: { belongsTo: 'site' },
  //     locations: {
  //       hasMany: { type: 'location', options: { queryInverse: 'room' } },
  //     },
  //   },
  //   titleField: 'name',
  //   sample: {
  //     site: 'id_of_site',
  //     name: 'New Room',
  //   },
  // },
  // location: {
  //   plural: 'locations',
  //   relations: {
  //     room: { belongsTo: 'room' },
  //     // fixedThings: {
  //     //   hasMany: { type: 'thing', options: { queryInverse: 'fixedLocation' } },
  //     // },
  //     // things: {
  //     //   hasMany: { type: 'tthing', options: { queryInverse: 'location' } },
  //     // },
  //     // Do not use temporary? A thing that has fixed but also has location is temp.
  //     // temporaryThings: {
  //     //   hasMany: {
  //     //     type: 'tthing',
  //     //     options: { queryInverse: 'temporaryLocation' },
  //     //   },
  //     // },
  //   },
  //   titleField: 'name',
  //   sample: {
  //     room: 'id_of_room',
  //     name: 'New Shelf',
  //   },
  // },
  // collection: {
  //   plural: 'collections',
  //   relations: {
  //     items: {
  //       hasMany: { type: 'item', options: { queryInverse: 'collection' } },
  //     },
  //   },
  //   titleField: 'name',
  //   sample: {
  //     name: 'New Collection',
  //   },
  // },
  // item: {
  //   plural: 'items',
  //   relations: {
  //     collection: { belongsTo: 'collection' },
  //     // location
  //     // fixedLocation: { belongsTo: 'tlocation' },
  //     // location: { belongsTo: 'tlocation' },
  //     // temporaryLocation: { belongsTo: 'tlocation' },
  //     // container
  //     dedicatedItems: {
  //       hasMany: {
  //         type: 'item',
  //         options: { queryInverse: 'dedicatedContainer' },
  //       },
  //     },
  //     dedicatedContainer: { belongsTo: 'item' },
  //     items: {
  //       hasMany: { type: 'item', options: { queryInverse: 'container' } },
  //     },
  //     container: { belongsTo: 'item' },
  //     // travelContainer: { belongsTo: 'item' },
  //   },
  //   titleField: 'name',
  //   sample: {
  //     name: 'New Item',
  //     // location, container, accessoryOf
  //     // storageType: 'location',
  //     // container: false,
  //   },
  // },
  // post: {
  //   plural: 'posts',
  //   relations: {
  //     author: { belongsTo: 'author' },
  //     comments: {
  //       hasMany: { type: 'comment', options: { queryInverse: 'post' } },
  //     },
  //     parentPost: { belongsTo: 'post' },
  //     childPosts: {
  //       hasMany: { type: 'post', options: { queryInverse: 'parentPost' } },
  //     },
  //   },
  //   titleField: 'title',
  //   sample: {
  //     author: 'id_of_author',
  //     title: 'Post #1',
  //     text: 'Hello world, this is a post.',
  //   },
  // },
  // author: {
  //   plural: 'authors',
  //   relations: {
  //     posts: { hasMany: { type: 'post', options: { queryInverse: 'author' } } },
  //   },
  //   titleField: 'name',
  //   sample: {
  //     name: 'Nobody',
  //     description: 'No body is perfect.',
  //   },
  // },
  // comment: {
  //   singular: 'comment',
  //   plural: 'comments',
  //   titleField: 'content',
  //   relations: {
  //     post: { belongsTo: 'post' },
  //   },
  //   sample: {
  //     content: 'Awesome!',
  //   },
  // },
} as const);

// type GeneralizeConstantFields<T> = {
//   [P in keyof T]: T[P] extends boolean
//     ? boolean
//     : T[P] extends string
//     ? string
//     : never;
// };

// type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };

export type TypeName = keyof typeof schema;

// export type DataType<T extends TypeName> = GeneralizeConstantFields<
//   DeepWriteable<typeof schema[T]['sample']>
// >;
export type DataType<T extends TypeName> = JTDDataType<
  typeof schema[T]['dataSchema']
>;

export default schema;
