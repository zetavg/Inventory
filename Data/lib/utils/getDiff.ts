export default function getDiff(
  originalData: Record<string, unknown>,
  newData: Record<string, unknown>,
): {
  original: Record<string, unknown>;
  new: Record<string, unknown>;
} {
  const keys = new Set<string>([
    ...Object.keys(originalData),
    ...Object.keys(newData),
  ]);
  const changedKeys = Array.from(keys).filter(key => {
    const originalValue = originalData[key];
    const newValue = newData[key];

    if (typeof originalValue !== typeof newValue) {
      return true;
    } else if (typeof originalValue === 'object') {
      return JSON.stringify(originalValue) !== JSON.stringify(newValue);
    } else {
      return originalValue !== newValue;
    }
  });

  return {
    original: Object.fromEntries(changedKeys.map(k => [k, originalData[k]])),
    new: Object.fromEntries(changedKeys.map(k => [k, newData[k]])),
  };
}
