export type RelationDef =
  | { belongsTo: string }
  // `queryInverse` must be used to avoid the need of adding foreign keys on both sides.
  | { hasMany: { type: string; options: { queryInverse: string } } };

export type TypeDef = Readonly<{
  plural: string;
  relations: {
    [field: string]: RelationDef;
  };
  /** The title field of this type, mainly used in auto UI generation */
  titleField: string;
  /** A sample of the data of this type */
  sample: any;
}>;

export type Schema = Readonly<{ [type: string]: TypeDef }>;

/**
 * For type-checking the schema while the constant type of the schema can be infered.
 */
function s<T extends Schema>(schema: T): T {
  return schema;
}

export const schema = s({
  tsite: {
    plural: 'tsites',
    relations: {
      rooms: {
        hasMany: { type: 'troom', options: { queryInverse: 'site' } },
      },
    },
    titleField: 'name',
    sample: {
      name: 'My Home',
    },
  },
  troom: {
    plural: 'trooms',
    relations: {
      site: { belongsTo: 'tsite' },
      locations: {
        hasMany: { type: 'tlocation', options: { queryInverse: 'room' } },
      },
    },
    titleField: 'name',
    sample: {
      site: 'id_of_site',
      name: 'My Room',
    },
  },
  tlocation: {
    plural: 'tlocations',
    relations: {
      room: { belongsTo: 'troom' },
      fixedThings: {
        hasMany: { type: 'tthing', options: { queryInverse: 'fixedLocation' } },
      },
      things: {
        hasMany: { type: 'tthing', options: { queryInverse: 'location' } },
      },
      // Do not use temporary? A thing that has fixed but also has location is temp.
      temporaryThings: {
        hasMany: {
          type: 'tthing',
          options: { queryInverse: 'temporaryLocation' },
        },
      },
    },
    titleField: 'name',
    sample: {
      room: 'id_of_room',
      name: 'My Shelf',
    },
  },
  tthing: {
    plural: 'tthings',
    relations: {
      // location
      fixedLocation: { belongsTo: 'tlocation' },
      location: { belongsTo: 'tlocation' },
      temporaryLocation: { belongsTo: 'tlocation' },
      // container
      fixedContains: {
        hasMany: {
          type: 'tthing',
          options: { queryInverse: 'fixedContainer' },
        },
      },
      fixedContainer: { belongsTo: 'tthing' },
      contains: {
        hasMany: { type: 'tthing', options: { queryInverse: 'container' } },
      },
      container: { belongsTo: 'tthing' },
      temporaryContains: {
        hasMany: {
          type: 'tthing',
          options: { queryInverse: 'temporaryContainer' },
        },
      },
      temporaryContainer: { belongsTo: 'tthing' },
      accessories: {
        hasMany: { type: 'tthing', options: { queryInverse: 'accessoryOf' } },
      },
      // accessoryOf
      accessoryOf: { belongsTo: 'tthing' },
    },
    titleField: 'name',
    sample: {
      name: 'My Computer',
      // location, container, accessoryOf
      storageType: 'location',
      container: false,
    },
  },
  post: {
    plural: 'posts',
    relations: {
      author: { belongsTo: 'author' },
      comments: {
        hasMany: { type: 'comment', options: { queryInverse: 'post' } },
      },
      parentPost: { belongsTo: 'post' },
      childPosts: {
        hasMany: { type: 'post', options: { queryInverse: 'parentPost' } },
      },
    },
    titleField: 'title',
    sample: {
      author: 'id_of_author',
      title: 'Post #1',
      text: 'Hello world, this is a post.',
    },
  },
  author: {
    plural: 'authors',
    relations: {
      posts: { hasMany: { type: 'post', options: { queryInverse: 'author' } } },
    },
    titleField: 'name',
    sample: {
      name: 'Nobody',
      description: 'No body is perfect.',
    },
  },
  comment: {
    singular: 'comment',
    plural: 'comments',
    titleField: 'content',
    relations: {
      post: { belongsTo: 'post' },
    },
    sample: {
      content: 'Awesome!',
    },
  },
} as const);

type GeneralizeConstantFields<T> = {
  [P in keyof T]: T[P] extends boolean
    ? boolean
    : T[P] extends string
    ? string
    : never;
};

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };

export type TypeName = keyof typeof schema;
export type DataType<T extends TypeName> = GeneralizeConstantFields<
  DeepWriteable<typeof schema[T]['sample']>
>;

// export type Type = typeof schema[number]['singular'];

export default schema;

// export const schema = [
//   {
//     singular: 'post',
//     plural: 'posts',
//     titleField: 'title',
//     relations: {
//       author: { belongsTo: 'author' },
//       comments: {
//         hasMany: { type: 'comment', options: { queryInverse: 'post' } },
//       },
//       parentPost: { belongsTo: 'post' },
//       childPosts: {
//         hasMany: { type: 'post', options: { queryInverse: 'parentPost' } },
//       },
//     },
//     sample: {
//       author: 'id_of_author',
//       title: 'Rails is Unagi',
//       text: 'Delicious unagi. Mmmmmm.',
//     },
//     optionalFields: [],
//   },
//   {
//     singular: 'author',
//     plural: 'authors',
//     titleField: 'name',
//     relations: {
//       posts: { hasMany: { type: 'post', options: { queryInverse: 'author' } } },
//     },
//     sample: {
//       name: 'Nobody',
//       description: 'No body is perfect.' as undefined | string,
//     },
//   },
//   {
//     singular: 'comment',
//     plural: 'comments',
//     titleField: 'content',
//     relations: {
//       post: { belongsTo: 'post' },
//     },
//     sample: {
//       content: 'Awesome!',
//     },
//     optionalFields: [],
//   },
//   // Many to many is not very useful
//   // {
//   //   singular: 'tag',
//   //   plural: 'tags',
//   //   titleField: 'name',
//   //   relations: {
//   //     posts: { hasMany: { type: 'post', options: { queryInverse: 'author' } } },
//   //   },
//   //   sample: {
//   //     name: 'Awesome Tag',
//   //   },
//   //   optionalFields: [],
//   // },
// ] as const;
