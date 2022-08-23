// `queryInverse` must be used to avoid the need of adding foreign keys on both sides.

export const schema = [
  {
    singular: 'post',
    plural: 'posts',
    titleField: 'title',
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
    sample: {
      author: 'id_of_author',
      title: 'Rails is Unagi',
      text: 'Delicious unagi. Mmmmmm.',
    },
    optionalFields: [],
  },
  {
    singular: 'author',
    plural: 'authors',
    titleField: 'name',
    relations: {
      posts: { hasMany: { type: 'post', options: { queryInverse: 'author' } } },
    },
    sample: {
      name: 'Nobody',
      description: 'No body is perfect.' as undefined | string,
    },
  },
  {
    singular: 'comment',
    plural: 'comments',
    titleField: 'content',
    relations: {
      post: { belongsTo: 'post' },
    },
    sample: {
      content: 'Awesome!',
    },
    optionalFields: [],
  },
  // Many to many is not very useful
  // {
  //   singular: 'tag',
  //   plural: 'tags',
  //   titleField: 'name',
  //   relations: {
  //     posts: { hasMany: { type: 'post', options: { queryInverse: 'author' } } },
  //   },
  //   sample: {
  //     name: 'Awesome Tag',
  //   },
  //   optionalFields: [],
  // },
] as const;

export type Type = typeof schema[number]['singular'];

export default schema;
