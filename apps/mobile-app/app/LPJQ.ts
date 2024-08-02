import appLogger from '@app/logger';

const logger = appLogger.for({ module: 'LPJQ' });

type QueueItem = [() => Promise<any>, boolean];
const queue: Array<QueueItem> = [];

let timer: NodeJS.Timeout | null = null;

async function doWork() {
  try {
    const it = queue.shift();
    if (it) {
      const [f, canceled] = it;
      if (f && !canceled) {
        await f();
      } else {
        // logger.debug('Task canceled. Skipping.');
      }
    }
  } catch (e) {
    logger.error(e);
  } finally {
    if (queue.length > 0) {
      timer = setTimeout(doWork, 8);
    } else {
      timer = null;
    }
  }
}

function push(fn: () => Promise<any>): () => void {
  const it: QueueItem = [fn, false];
  queue.push(it);

  if (!timer) {
    timer = setTimeout(doWork, 2);
  }

  return () => {
    it[1] = true;
  };
}

/** Low Priority Job Queue. */
export const LPJQ = { push, queue };
export default LPJQ;
