export default function hasChanges(
  existingData: Record<string, unknown>,
  newData: Record<string, unknown>,
) {
  const keys = Array.from(
    new Set([...Object.keys(existingData), ...Object.keys(newData)]),
  );

  for (const key of keys) {
    if (key === '__rev' || key === '__raw') {
      continue;
    }

    const existingValue = existingData[key];
    const newValue = newData[key];

    if (typeof existingValue !== typeof newValue) return true;
    if (typeof existingValue === 'object') {
      if (JSON.stringify(existingValue) !== JSON.stringify(newValue)) {
        return true;
      }
    } else {
      if (existingValue !== newValue) {
        return true;
      }
    }
  }

  return false;
}
