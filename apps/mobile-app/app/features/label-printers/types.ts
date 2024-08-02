import { z } from 'zod';

export const EnumOption = z.object({
  enum: z.array(z.string()),
  default: z.string().optional(),
  saveLastValue: z.boolean().optional(),
});

export const BooleanOption = z.object({
  type: z.literal('boolean'),
  default: z.boolean().optional(),
  saveLastValue: z.boolean().optional(),
});

export const StringOption = z.object({
  type: z.literal('string'),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  default: z.string().optional(),
  choices: z.array(z.string()).optional(),
  saveLastValue: z.boolean().optional(),
});

export const IntegerOption = z.object({
  type: z.literal('integer'),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  default: z.number().optional(),
  choices: z.array(z.number()).optional(),
  saveLastValue: z.boolean().optional(),
});

export const Options = z.record(
  EnumOption.or(BooleanOption).or(StringOption).or(IntegerOption),
);
export type OptionsT = z.infer<typeof Options>;

export const Label = z.record(z.string());
export type LabelT = z.infer<typeof Label>;

export const PrinterConfig = z.object({
  options: Options,
  getLabel: z.function(),
  print: z.function(),
  getPreview: z.function().optional(),
});
export type PrinterConfigT = z.infer<typeof PrinterConfig>;
