import { z } from 'zod';

export const schema = {
  config: z
    .object({
      airtable_base_id: z.string().min(1),
      scope_type: z.enum(['collections', 'containers']),
      collection_ids_to_sync: z.array(z.string()).optional(),
      container_ids_to_sync: z.array(z.string()).optional(),
    })
    .catchall(z.unknown()),
};

export default schema;
