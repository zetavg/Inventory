import { useMemo } from 'react';

import { detailedDiff } from 'deep-object-diff';

export default function useDeepCompare(obj1: unknown, obj2: unknown): boolean {
  return useMemo(() => {
    const diffResult: any = detailedDiff(obj1 as any, obj2 as any);

    if (Object.keys(diffResult.deleted).length > 0) {
      return false;
    }
    if (
      Object.entries(diffResult.added).filter(([_k, v]) => {
        if (typeof v === 'undefined') {
          return false;
        }
        if (typeof v === 'string') {
          return !!v;
        }
        return true;
      }).length > 0
    ) {
      return false;
    }
    if (Object.keys(diffResult.updated).length > 0) {
      return false;
    }

    return true;
  }, [obj1, obj2]);
}
