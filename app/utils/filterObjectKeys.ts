export default function filterObjectKeys<
  T extends Record<string, unknown>,
  KS extends ReadonlyArray<keyof T>,
>(obj: T, keys: KS): Pick<T, KS[number]> {
  const filtered = Object.keys(obj)
    .filter(key => keys.includes(key))
    .reduce((o, key) => {
      (o as any)[key] = obj[key];
      return o;
    }, {});
  return filtered as any;
}
