// Keys to be treated as metadata.
const metadataKeysSet = new Set(['integrations']);

export default function hasChanges(
  existingData: Record<string, unknown>,
  newData: Record<string, unknown>,
): number {
  // 0: no change, 1: metadata change, 11: user data change
  let changeLevel = 0;

  const keys = Array.from(
    new Set([...Object.keys(existingData), ...Object.keys(newData)]),
  );

  for (const key of keys) {
    if (key === '__rev' || key === '__raw') {
      continue;
    }

    const existingValue = existingData[key];
    const newValue = newData[key];

    if (typeof existingValue !== typeof newValue) {
      if (metadataKeysSet.has(key)) {
        changeLevel = 1;
      } else {
        changeLevel = 11;
        return changeLevel;
      }
    } else if (typeof existingValue === 'object') {
      if (JSON.stringify(existingValue) !== JSON.stringify(newValue)) {
        if (metadataKeysSet.has(key)) {
          changeLevel = 1;
        } else {
          changeLevel = 11;
          return changeLevel;
        }
      }
    } else {
      if (existingValue !== newValue) {
        if (metadataKeysSet.has(key)) {
          changeLevel = 1;
        } else {
          changeLevel = 11;
          return changeLevel;
        }
      }
    }
  }

  return changeLevel;
}
