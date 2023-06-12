export default function mapObjectValues<T extends Record<string, any>, T2>(
  obj: T,
  fn: (value: T[keyof T], key: string) => T2,
): { [K in keyof T]: T2 } {
  const keys = Object.keys(obj) as Array<keyof T>;
  const mappedObj: Partial<{ [K in keyof T]: T2 }> = {};

  for (let key of keys) {
    mappedObj[key] = fn(obj[key], key as string);
  }

  return mappedObj as { [K in keyof T]: T2 };
}
