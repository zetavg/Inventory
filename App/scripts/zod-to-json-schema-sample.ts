// Run with `npx ts-node scripts/zod-to-json-schema-sample.ts`.

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const mySchema = z
  .object({
    myString: z.string().min(5),
    myUnion: z.union([z.number(), z.boolean()]),
  })
  .describe('My neat object schema');

const jsonSchema = zodToJsonSchema(mySchema, 'mySchema');
console.log(JSON.stringify(jsonSchema, null, 2));
