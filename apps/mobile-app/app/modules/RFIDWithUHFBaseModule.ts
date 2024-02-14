import { DeviceEventEmitter } from 'react-native';

import crypto from 'crypto-browserify';

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

export type BasicOptions = {
  power: number;
  soundEnabled: boolean;
  filter?: FilterOptions;
};

export type ScanData = {
  epc: string;
  tid?: string;
  rssi: number;
};

export type ScanOptions = BasicOptions & {
  callback: (data: ScanData[]) => void;
  scanRate?: number;
  eventRate?: number;
  isLocate?: boolean;
  enableReaderSound?: boolean;
  scannedEpcs?: ReadonlyArray<string>;
  playSoundOnlyForEpcs?: ReadonlyArray<string>;
};

export type LocateOptions = BasicOptions & {
  callback: (value: number) => void;
  epc: string;
};

export type ReadOptions = BasicOptions & {
  /** Memory bank from which data is to be read from */
  memoryBank: MemoryBank;
  /** Password to be used for the read operation */
  accessPassword?: string;
  /** The address of the first word to read from the chosen memory bank (ptr) */
  offset: number;
  /** Number of words to read (len) */
  count: number;
};

export type WriteOptions = BasicOptions & {
  /** Memory bank for which data is to be written to */
  memoryBank: MemoryBank;
  /** Password to be used for the write operation */
  accessPassword?: string;
  /** The address of the first word to write from the chosen memory bank (ptr) */
  offset: number;
  /** Number of words to write (len) */
  count: number;
  data: string;
};

export type LockOptions = BasicOptions & {
  /** Password to be used for the lock operation */
  accessPassword?: string;
  code: string;
};

export const MEMORY_BANK_MAP = {
  RESERVED: 0,
  EPC: 1,
  TID: 2,
  USER: 3,
} as const;

export function convertMemoryBank(bankStr: MemoryBank): number {
  return MEMORY_BANK_MAP[bankStr];
}

export const EPC_SIZE_PC_VALUE_MAP = [
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

export const SOUND_MAP = {
  success: 1,
  error: 3,
} as const;

const RFIDWithUHFBaseModule = {
  NativeModule: {} as any,
  _initPromise: null as any,
  _scanListener: null as any,
  _locateListener: null as any,
  init(): Promise<void> {
    const prevPromise = this._initPromise;
    if (prevPromise) return prevPromise;

    const promise = this.NativeModule.init();
    this._initPromise = promise;
    promise.then(() => {
      this._initPromise = null;
    });
    promise.catch(() => {
      this._initPromise = null;
    });
    return promise;
  },
  free(): Promise<void> {
    this._scanListener?.remove();
    return this.NativeModule.free();
  },
  isWorking(): Promise<boolean> {
    return this.NativeModule.isWorking();
  },
  setFrequencyMode(mode: number): Promise<void> {
    return this.NativeModule.setFrequencyMode(mode);
  },
  getFrequencyMode(): Promise<number> {
    return this.NativeModule.getFrequencyMode();
  },
  setPower(power: number): Promise<number> {
    return this.NativeModule.setPower(power);
  },
  startScan(options: ScanOptions): Promise<void> {
    this.NativeModule.setFeedbackMinimumDelay(50);
    this._scanListener?.remove();
    this._scanListener = DeviceEventEmitter.addListener(
      'uhfScanData',
      options.callback,
    );
    // if (Platform.OS === 'ios') {
    //   (this as any).startGetLabMessageTimer = setTimeout(() => {
    //     (this as any).getLabMessageTimer = setInterval(async () => {
    //       try {
    //         await this.NativeModule.getLabMessage();
    //       } catch (e) {
    //         console.warn(e);
    //       }
    //     }, 80);
    //   }, 500);
    // }
    return this.NativeModule.startScan(
      options.power,
      !!options.filter,
      convertMemoryBank(options.filter?.memoryBank || 'EPC'),
      options.filter?.bitOffset || 0,
      options.filter?.bitCount || 0,
      options.filter?.data || '',
      options.scanRate || 30,
      options.eventRate || 250,
      !!options.isLocate,
      !!options.soundEnabled,
      !!options.enableReaderSound,
      options.scannedEpcs || [],
      options.playSoundOnlyForEpcs || [],
    );
  },
  stopScan(): Promise<void> {
    const currentScanListener = this._scanListener;
    setTimeout(() => {
      currentScanListener?.remove();
    }, 1000);

    // if (Platform.OS === 'ios') {
    //   clearTimeout((this as any).startGetLabMessageTimer);
    //   clearInterval((this as any).getLabMessageTimer);
    // }

    return this.NativeModule.stopScan();
  },
  clearScannedTags(): Promise<void> {
    return this.NativeModule.clearScannedTags();
  },
  startLocate(options: LocateOptions): Promise<void> {
    this._locateListener?.remove();
    this._locateListener = DeviceEventEmitter.addListener(
      'uhfLocateValue',
      options.callback,
    );
    return this.NativeModule.startLocate(
      options.epc,
      options.power,
      !!options.soundEnabled,
    );
  },
  stopLocate(): Promise<void> {
    this._locateListener?.remove();
    return this.NativeModule.stopLocate();
  },
  read(options: ReadOptions): Promise<string> {
    return this.NativeModule.read(
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
  write(options: WriteOptions): Promise<void> {
    return this.NativeModule.write(
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
  lock(options: LockOptions): Promise<void> {
    return this.NativeModule.lock(
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
    this.NativeModule.playSound(SOUND_MAP[soundName]);
  },
  writeEpcAndLock: async function writeEpcAndLock(
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

      await new Promise(resolve => {
        setTimeout(resolve, 1);
      });

      // Write data
      await this.write({
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
      if (soundEnabled) this.playSound('error');
      throw e;
    }

    const newFilter = {
      memoryBank: 'EPC' as const,
      bitOffset: 16 * 2,
      bitCount: epc.length * 4,
      data: epc,
    };

    try {
      reportStatus && reportStatus('Setting password...');
      // Set password
      await this.write({
        power,
        accessPassword: oldAccessPassword,
        memoryBank: 'RESERVED',
        offset: 0,
        count: 4,
        data: `${newAccessPassword}${newAccessPassword}`,
        filter: newFilter,
        soundEnabled: false,
      });
    } catch (e) {
      reportStatus && reportStatus('Failed on setting password');
      if (soundEnabled) this.playSound('error');
      throw e;
    }

    try {
      reportStatus && reportStatus('Locking tag...');
      // Lock tag
      await this.lock({
        power,
        accessPassword: newAccessPassword,
        code: '0a82a0', // Locks kill, access and EPC
        filter: newFilter,
        soundEnabled: false,
      });
    } catch (e) {
      reportStatus && reportStatus('Failed on locking tag');
      if (soundEnabled) this.playSound('error');
      throw e;
    }

    reportStatus && reportStatus('Done');
    if (soundEnabled) this.playSound('success');
  },
  resetEpcAndUnlock: async function unlockAndResetEpc(
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
    reportStatus && reportStatus('Resetting data...');

    await new Promise(resolve => {
      setTimeout(resolve, 1);
    });

    /** Used to ensure that we're working with the same tag on subsequent operations */
    const randHex = crypto.randomBytes(4).toString('hex');

    const writeResetOptions = {
      memoryBank: 'EPC' as MemoryBank,
      offset: 1,
      count: 4,
      data: '08000000' + randHex,
      power,
      filter,
      soundEnabled: false,
    };
    let isLocked = true;

    try {
      await this.write({
        ...writeResetOptions,
        accessPassword: oldAccessPassword,
      });
    } catch (_e) {
      try {
        // Try again with default password
        await this.write({
          ...writeResetOptions,
          accessPassword: '00000000',
        });
        isLocked = false;
      } catch (e) {
        reportStatus && reportStatus('Failed while resetting data');
        if (soundEnabled) this.playSound('error');
        throw e;
      }
    }

    const newFilter = {
      memoryBank: 'EPC' as const,
      bitOffset: 16 * 2,
      bitCount: 16 * 3,
      data: '0000' + randHex,
    };

    try {
      reportStatus && reportStatus('Unlocking tag...');
      // Unlock tag
      await this.lock({
        power,
        filter: newFilter,
        accessPassword: isLocked ? oldAccessPassword : '00000000',
        soundEnabled: false,
        code: '000000',
      });
    } catch (e) {
      if (isLocked) {
        reportStatus && reportStatus('Failed while unlocking tag');
        if (soundEnabled) this.playSound('error');
        throw e;
      } else {
        // Newer device models will throw an error when trying to unlock a tag with access password 00000000. But as long as the tag is already unlocked, we can ignore this error.
        reportStatus && reportStatus('Unlocking tag... skipped');
        await new Promise(resolve => {
          setTimeout(resolve, 300);
        });
      }
    }

    try {
      if (isLocked) {
        reportStatus && reportStatus('Removing password...');
        // Remove password
        await this.write({
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
    } catch (e) {
      reportStatus && reportStatus('Failed while removing password');
      if (soundEnabled) this.playSound('error');
      throw e;
    }

    reportStatus && reportStatus('Done');
    if (soundEnabled) this.playSound('success');
  },
};

export default RFIDWithUHFBaseModule;
