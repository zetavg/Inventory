import { SafeParseReturnType, ZodError } from 'zod';

import { ValidationError } from '../validation';

export function getValidationErrorFromZodError(zodError: ZodError) {
  return new ValidationError(zodError.issues);
}

export function getValidationErrorFromZodSafeParseReturnValue(
  result: SafeParseReturnType<unknown, unknown>,
) {
  if (result.success) return null;

  return new ValidationError(result.error.issues);
}
