/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Deep merge objects.
 * @param target
 * @param ...sources
 */
export function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();
  const newTarget = { ...target };

  if (isObject(newTarget) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!newTarget[key]) Object.assign(newTarget, { [key]: {} });
        newTarget[key] = deepMerge(newTarget[key], source[key]);
      } else {
        Object.assign(newTarget, { [key]: source[key] });
      }
    }
  }

  return deepMerge(newTarget, ...sources);
}

export default deepMerge;
