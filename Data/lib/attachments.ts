import { DataTypeName } from './schema';

type AttachmentDefn = {
  content_types: ReadonlyArray<string>;
  required?: boolean;
};

function attachment_defn<
  T extends Partial<{ [n in DataTypeName]: Record<string, AttachmentDefn> }>,
>(defn: T) {
  return defn;
}

export const attachment_definitions = attachment_defn({
  image: {
    'thumbnail-128': {
      content_types: ['image/jpeg', 'image/png'] as const,
      required: true,
    },
    'thumbnail-1024': {
      content_types: ['image/jpeg', 'image/png'] as const,
      required: true,
    },
    'image-2048': {
      content_types: ['image/jpeg', 'image/png'] as const,
      required: true,
    },
  },
});

export type AttachmentNameOfDataType<T extends DataTypeName> =
  typeof attachment_definitions extends {
    [n in T]: unknown;
  }
    ? keyof (typeof attachment_definitions)[T]
    : never;

export type AttachmentContentType<
  T extends DataTypeName,
  N extends AttachmentNameOfDataType<T>,
> = typeof attachment_definitions extends {
  [n in T]: unknown;
}
  ? (typeof attachment_definitions)[T][N] extends { content_types: unknown }
    ? (typeof attachment_definitions)[T][N]['content_types'] extends
        | ReadonlyArray<unknown>
        | Array<unknown>
      ? (typeof attachment_definitions)[T][N]['content_types'][number]
      : never
    : never
  : never;
