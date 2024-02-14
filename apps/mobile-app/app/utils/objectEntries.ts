/**
 * "Better" type for Object.entries. **Beware that this might not be type-safe**,
 * since the actual value of type `Record<K, V>` might contain more keys that
 * aren't in K or values that aren't in V.
 *
 * See: https://github.com/microsoft/TypeScript/issues/35101
 *      https://github.com/microsoft/TypeScript/pull/12253#issuecomment-263132208
 */
export default function objectEntries<K extends string, V>(
  object: Record<K, V>,
): [K, V][] {
  return (Object.entries as any)(object);
}
