import { z } from 'zod';

export const DataHistoryZod = z.object({
  created_by: z.string().optional(),
  batch: z.number().optional(),
  event_name: z.string().optional(),
  data_type: z.string(),
  data_id: z.string(),
  timestamp: z.number(),
  original_data: z.record(z.unknown()),
  new_data: z.record(z.unknown()),
});
