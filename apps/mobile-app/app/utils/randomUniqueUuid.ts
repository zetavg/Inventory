import 'react-native-get-random-values';

import { v4 as uuidv4 } from 'uuid';

function getNewUuid(config: { short: boolean } = { short: false }) {
  const newUuid = uuidv4();

  if (config.short) {
    return newUuid.split('-')[0];
  }

  return newUuid;
}

export default function randomUniqueUuid(
  existingUuids: ReadonlyArray<string> = [],
  config: { short: boolean } = { short: false },
): string {
  let newUuid: string | undefined;
  while (!newUuid || newUuid in existingUuids) {
    newUuid = getNewUuid({ short: config.short });
  }

  return newUuid;
}
