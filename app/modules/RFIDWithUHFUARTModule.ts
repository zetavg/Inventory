import { DeviceEventEmitter, NativeModules } from 'react-native';

export type MemoryBank = 'RESERVED' | 'EPC' | 'TID' | 'USER';

/**
 * Filter criteria for operations like scan, read, write, lock, etc.
 */
type FilterOptions = {
  /** Memory bank to be considered for filtering */
  memoryBank: MemoryBank;
  /** The address of the first bit to compare with the filter data (ptr) */
  bitOffset: number;
  /** Number of bits to be taken for filter comparison (len) */
  bitCount: number;
  /** Data to be matched */
  data: string;
};

type BasicOptions = {
  power: number;
  soundEnabled: boolean;
  filter?: FilterOptions;
};

export type ScanData = {
  epc: string;
  tid?: string;
  rssi: number;
};

type ScanOptions = BasicOptions & {
  callback: (data: ScanData[]) => void;
  scanRate?: number;
  eventRate?: number;
};

type LocateOptions = BasicOptions & {
  callback: (value: number) => void;
  epc: string;
};

type ReadOptions = BasicOptions & {
  /** Memory bank from which data is to be read from */
  memoryBank: MemoryBank;
  /** Password to be used for the read operation */
  accessPassword?: string;
  /** The address of the first word to read from the chosen memory bank (ptr) */
  offset: number;
  /** Number of words to read (len) */
  count: number;
};

type WriteOptions = BasicOptions & {
  /** Memory bank for which data is to be writed to */
  memoryBank: MemoryBank;
  /** Password to be used for the write operation */
  accessPassword?: string;
  /** The address of the first word to write from the chosen memory bank (ptr) */
  offset: number;
  /** Number of words to write (len) */
  count: number;
  data: string;
};

type LockOptions = BasicOptions & {
  /** Password to be used for the lock operation */
  accessPassword?: string;
  code: string;
};

const { RFIDWithUHFUARTModule: NativeRFIDWithUHFUARTModule } = NativeModules;

const MEMORY_BANK_MAP = {
  RESERVED: 0,
  EPC: 1,
  TID: 2,
  USER: 3,
} as const;

function convertMemoryBank(bankStr: MemoryBank): number {
  return MEMORY_BANK_MAP[bankStr];
}

const EPC_SIZE_PC_VALUE_MAP = [
  '0000',
  '0800',
  '1000',
  '1800',
  '2000',
  '2800',
  '3000',
  '3800',
  '4000',
  '4800',
  '5000',
  '5800',
  '6000',
  '6800',
  '7000',
  '7800',
];

const SOUND_MAP = {
  success: 1,
  error: 3,
} as const;

const RFIDWithUHFUARTModule = {
  init: (): Promise<void> => {
    const prevPromise = (RFIDWithUHFUARTModule as any)._initPromise;
    if (prevPromise) return prevPromise;

    const promise = NativeRFIDWithUHFUARTModule.init();
    (RFIDWithUHFUARTModule as any)._initPromise = promise;
    promise.then(() => {
      (RFIDWithUHFUARTModule as any)._initPromise = null;
    });
    promise.catch(() => {
      (RFIDWithUHFUARTModule as any)._initPromise = null;
    });
    return promise;
  },
  free: (): Promise<void> => {
    (RFIDWithUHFUARTModule as any)._scanListener?.remove();
    return NativeRFIDWithUHFUARTModule.free();
  },
  setFrequencyMode: (mode: number): Promise<void> => {
    return NativeRFIDWithUHFUARTModule.setFrequencyMode(mode);
  },
  getFrequencyMode: (): Promise<number> => {
    return NativeRFIDWithUHFUARTModule.getFrequencyMode();
  },
  startScan: (options: ScanOptions): Promise<void> => {
    (RFIDWithUHFUARTModule as any)._scanListener?.remove();
    (RFIDWithUHFUARTModule as any)._scanListener =
      DeviceEventEmitter.addListener('uhfScanData', options.callback);
    return NativeRFIDWithUHFUARTModule.startScan(
      options.power,
      !!options.filter,
      convertMemoryBank(options.filter?.memoryBank || 'EPC'),
      options.filter?.bitOffset || 0,
      options.filter?.bitCount || 0,
      options.filter?.data || '',
      options.scanRate || 30,
      options.eventRate || 250,
      !!options.soundEnabled,
    );
  },
  stopScan: (): Promise<void> => {
    (RFIDWithUHFUARTModule as any)._scanListener?.remove();
    return NativeRFIDWithUHFUARTModule.stopScan();
  },
  clearScannedTags: (): Promise<void> => {
    return NativeRFIDWithUHFUARTModule.clearScannedTags();
  },
  startLocate: (options: LocateOptions): Promise<void> => {
    (RFIDWithUHFUARTModule as any)._locateListener?.remove();
    (RFIDWithUHFUARTModule as any)._locateListener =
      DeviceEventEmitter.addListener('uhfLocateValue', options.callback);
    return NativeRFIDWithUHFUARTModule.startLocate(
      options.epc,
      options.power,
      !!options.soundEnabled,
    );
  },
  stopLocate: (): Promise<void> => {
    (RFIDWithUHFUARTModule as any)._locateListener?.remove();
    return NativeRFIDWithUHFUARTModule.stopLocate();
  },
  read: (options: ReadOptions): Promise<string> => {
    return NativeRFIDWithUHFUARTModule.read(
      options.power,
      convertMemoryBank(options.memoryBank),
      options.offset,
      options.count,
      options.accessPassword || '00000000',
      !!options.filter,
      convertMemoryBank(options.filter?.memoryBank || 'EPC'),
      options.filter?.bitOffset || 0,
      options.filter?.bitCount || 0,
      options.filter?.data || '',
      !!options.soundEnabled,
    );
  },
  write: (options: WriteOptions): Promise<void> => {
    return NativeRFIDWithUHFUARTModule.write(
      options.power,
      convertMemoryBank(options.memoryBank),
      options.offset,
      options.count,
      options.accessPassword || '00000000',
      options.data,
      !!options.filter,
      convertMemoryBank(options.filter?.memoryBank || 'EPC'),
      options.filter?.bitOffset || 0,
      options.filter?.bitCount || 0,
      options.filter?.data || '',
      !!options.soundEnabled,
    );
  },
  lock: (options: LockOptions): Promise<void> => {
    return NativeRFIDWithUHFUARTModule.lock(
      options.power,
      options.accessPassword || '00000000',
      options.code,
      !!options.filter,
      convertMemoryBank(options.filter?.memoryBank || 'EPC'),
      options.filter?.bitOffset || 0,
      options.filter?.bitCount || 0,
      options.filter?.data || '',
      !!options.soundEnabled,
    );
  },
  playSound(soundName: keyof typeof SOUND_MAP) {
    NativeRFIDWithUHFUARTModule.playSound(SOUND_MAP[soundName]);
  },
};

export async function writeEpcAndLock(
  epc: string,
  newAccessPassword: string,
  {
    power,
    oldAccessPassword = '00000000',
    reportStatus,
    filter,
    soundEnabled = true,
  }: {
    power: number;
    oldAccessPassword?: string;
    filter?: FilterOptions;
    reportStatus?: (status: string) => void;
    soundEnabled: boolean;
  },
) {
  try {
    const epcSize = epc.length;
    const epcWordsCount = Math.ceil(epcSize / 4);

    reportStatus && reportStatus('Writing data...');
    // Write data
    await RFIDWithUHFUARTModule.write({
      memoryBank: 'EPC',
      accessPassword: oldAccessPassword,
      offset: 1,
      count: epcWordsCount + 1,
      data: EPC_SIZE_PC_VALUE_MAP[epcWordsCount] + epc,
      power,
      filter,
      soundEnabled: false,
    });
  } catch (e) {
    reportStatus && reportStatus('Failed on writing data');
    if (soundEnabled) RFIDWithUHFUARTModule.playSound('error');
    throw e;
  }

  const newFilter = {
    memoryBank: 'EPC' as const,
    bitOffset: 16 * 2,
    bitCount: epc.length * 4,
    data: epc,
  };

  try {
    reportStatus && reportStatus('Initializing lock...');
    // Lock tag
    await RFIDWithUHFUARTModule.lock({
      power,
      accessPassword: oldAccessPassword,
      code: '0a82a0', // Locks kill, access and EPC
      filter: newFilter,
      soundEnabled: false,
    });
  } catch (e) {
    reportStatus && reportStatus('Failed on initializing lock');
    if (soundEnabled) RFIDWithUHFUARTModule.playSound('error');
    throw e;
  }

  try {
    reportStatus && reportStatus('Setting password...');
    // Set password
    await RFIDWithUHFUARTModule.write({
      power,
      accessPassword: oldAccessPassword,
      memoryBank: 'RESERVED',
      offset: 0,
      count: 4,
      data: `${newAccessPassword}${newAccessPassword}`,
      filter: newFilter,
      soundEnabled: false,
    });

    reportStatus && reportStatus('Done');
    if (soundEnabled) RFIDWithUHFUARTModule.playSound('success');
  } catch (e) {
    reportStatus && reportStatus('Failed on setting password');
    if (soundEnabled) RFIDWithUHFUARTModule.playSound('error');
    throw e;
  }
}

export async function unlockAndReset(
  oldAccessPassword: string,
  {
    power,
    reportStatus,
    filter,
    soundEnabled = true,
  }: {
    power: number;
    oldAccessPassword?: string;
    filter?: FilterOptions;
    reportStatus?: (status: string) => void;
    soundEnabled: boolean;
  },
) {
  const writeResetOptions = {
    memoryBank: 'EPC' as MemoryBank,
    offset: 1,
    count: 2,
    data: '08000000',
    power,
    filter,
    soundEnabled: false,
  };
  reportStatus && reportStatus('Resetting data...');
  let isLocked = true;

  try {
    await RFIDWithUHFUARTModule.write({
      ...writeResetOptions,
      accessPassword: oldAccessPassword,
    });
  } catch (_e) {
    try {
      // Try again with default password
      await RFIDWithUHFUARTModule.write({
        ...writeResetOptions,
        accessPassword: '00000000',
      });
      isLocked = false;
    } catch (e) {
      reportStatus && reportStatus('Failed while resetting data');
      if (soundEnabled) RFIDWithUHFUARTModule.playSound('error');
      throw e;
    }
  }

  const newFilter = {
    memoryBank: 'EPC' as const,
    bitOffset: 16 * 2,
    bitCount: 16,
    data: '0000',
  };

  try {
    reportStatus && reportStatus('Unlocking tag...');
    // Unlock tag
    await RFIDWithUHFUARTModule.lock({
      power,
      filter: newFilter,
      accessPassword: isLocked ? oldAccessPassword : '00000000',
      soundEnabled: false,
      code: '000000',
    });
  } catch (e) {
    reportStatus && reportStatus('Failed while unlocking tag');
    if (soundEnabled) RFIDWithUHFUARTModule.playSound('error');
    throw e;
  }

  try {
    if (isLocked) {
      reportStatus && reportStatus('Removing password...');
      // Remove password
      await RFIDWithUHFUARTModule.write({
        power,
        filter: newFilter,
        accessPassword: oldAccessPassword,
        memoryBank: 'RESERVED',
        offset: 0,
        count: 4,
        data: '0000000000000000',
        soundEnabled: false,
      });
    }

    reportStatus && reportStatus('Done');
    if (soundEnabled) RFIDWithUHFUARTModule.playSound('success');
  } catch (e) {
    reportStatus && reportStatus('Failed while removing password');
    if (soundEnabled) RFIDWithUHFUARTModule.playSound('error');
    throw e;
  }
}

export default RFIDWithUHFUARTModule;
