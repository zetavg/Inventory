export function applyWhitespaceFix<T extends string | undefined | null>(
  s: T,
): T {
  if (typeof s !== 'string') return s;

  // return (s as any).replace(/\u0020$/, '\u0020\u033a\u0320');
  return s;
}

export function removeWhitespaceFix<T extends string | undefined | null>(
  s: T,
): T {
  if (typeof s !== 'string') return s;

  // return (s as any).replace(/\u0020\u033a\u0320/, '\u0020');
  return s;
}
