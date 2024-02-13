import { z } from 'zod';

export const schema = {
  config: z
    .object({
      airtable_base_id: z.string().min(1),
      scope_type: z.enum(['collections', 'containers']),
      collection_ids_to_sync: z.array(z.string()).optional(),
      container_ids_to_sync: z.array(z.string()).optional(),
      images_public_endpoint: z.string().optional(),
      disable_uploading_item_images: z.boolean().optional(),
    })
    .catchall(z.unknown()),
};

export default schema;
