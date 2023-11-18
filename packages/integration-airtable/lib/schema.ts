import { z } from 'zod';

export const schema = {
  config: z
    .object({
      airtable_base_id: z.string().min(1),
      collection_ids_to_sync: z.array(z.string()),
    })
    .catchall(z.unknown()),
};

export default schema;
