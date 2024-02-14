import { useMemo } from 'react';

import useColors from '@app/hooks/useColors';

export function useStyles() {
  const { backgroundColor } = useColors();

  return useMemo(
    () => ({
      container: {
        backgroundColor,
      },
    }),
    [backgroundColor],
  );
}
