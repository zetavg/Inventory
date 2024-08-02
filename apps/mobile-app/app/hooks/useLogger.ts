import { useMemo } from 'react';

import appLogger from '@app/logger';

import { selectors, useAppSelector } from '@app/redux';

export default function useLogger(module: string, fn?: string) {
  const currentProfileUuid = useAppSelector(
    selectors.profiles.currentProfileUuid,
  );
  const logger = useMemo(() => {
    const args: Parameters<typeof appLogger.for>[0] = {
      user: currentProfileUuid,
    };

    if (module) {
      args.module = module;
    }

    if (fn) {
      args.function = fn;
    }

    return appLogger.for(args);
  }, [currentProfileUuid, fn, module]);

  return logger;
}
