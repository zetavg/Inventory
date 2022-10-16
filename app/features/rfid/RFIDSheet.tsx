import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  ScrollView,
  useWindowDimensions,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { AutoSizeText, ResizeTextMode } from 'react-native-auto-size-text';
import Slider from '@react-native-community/slider';
import LinearGradient from 'react-native-linear-gradient';
import Modal from 'react-native-modal';

import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetHandle,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetScrollViewMethods,
} from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import Color from 'color';
import commonStyles from '@app/utils/commonStyles';
import InsetGroup from '@app/components/InsetGroup';
import Text from '@app/components/Text';
import ElevatedButton, {
  SecondaryButton,
} from '@app/components/ElevatedButton';
import AppIcon from '@app/components/Icon';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useForwardedRef from '@app/hooks/useForwardedRef';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useColors from '@app/hooks/useColors';

import useDB from '@app/hooks/useDB';
import { ConfigStoredInDB } from '@app/db/types';
import { getConfigInDB } from '@app/db/configUtils';
import { ScanData } from '@app/modules/RFIDWithUHFBaseModule';
import RFIDWithUHFUARTModule from '@app/modules/RFIDWithUHFUARTModule';
import EPCUtils from '@app/modules/EPCUtils';
import { DataType } from '@app/db/schema';

import { getTagAccessPassword } from './utils';
import useBottomSheetDynamicSnapPoints from './hooks/useBottomSheetDynamicSnapPoints';
import { usePersistedState } from '@app/hooks/usePersistedState';
import RFIDWithUHFBLEModule, {
  DeviceConnectStatusPayload,
  ScanDevicesData,
} from '@app/modules/RFIDWithUHFBLEModule';
import ItemItem from '../inventory/components/ItemItem';
import { DataTypeWithID } from '@app/db/relationalUtils';
import { getDataFromDocs } from '@app/db/hooks';

export type OnScannedItemPressFn = (
  data: ScanData,
  loadedItemType: string | null,
  loadedItemId: string | null,
) => void;

export type RenderScannedItemsFn = (
  items: Record<string, ScanData>,
  options: { contentBackgroundColor: string; clearScannedDataCounter: number },
) => JSX.Element;

export type RFIDSheetOptions = {
  power?: number;
  onDone?: () => void;
  onClose?: () => void;
} & (
  | {
      functionality: 'scan';
      scanName?: string;
      resetData?: boolean;
      playSoundOnlyForEpcs?: string[];
      useDefaultFilter?: boolean;
      autoScroll?: boolean;
      onScannedItemPressRef?: React.MutableRefObject<OnScannedItemPressFn | null>;
      renderScannedItemsRef?: React.MutableRefObject<RenderScannedItemsFn | null>;
    }
  | {
      functionality: 'locate';
      epc?: string;
    }
  | {
      functionality: 'read';
    }
  | {
      functionality: 'write';
      epc?: string;
      tagAccessPassword?: string;
      afterWriteSuccessRef?: React.MutableRefObject<(() => void) | null>;
    }
);

type Props = {
  rfidSheetPassOptionsFnRef: React.MutableRefObject<
    ((options: RFIDSheetOptions) => void) | null
  >;
};

const ACTION_BUTTON_PRESS_RETENTION_OFFSET = {
  top: 512,
  bottom: 64,
  left: 32,
  right: 32,
};

function RFIDSheet(
  { rfidSheetPassOptionsFnRef }: Props,
  ref: React.ForwardedRef<BottomSheetModal>,
) {
  const innerRef = useForwardedRef(ref);
  // #region Options Processing //
  const [options, setOptions] = useState<RFIDSheetOptions | null>(null);
  const handlePassedOptions = useCallback((opts: RFIDSheetOptions) => {
    setOptions(opts);
  }, []);
  rfidSheetPassOptionsFnRef.current = handlePassedOptions;
  // #endregion //

  // #region Styles //
  const windowDimensions = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();
  const isDarkMode = useIsDarkMode();
  const {
    sheetBackgroundColor,
    contentSecondaryTextColor,
    green2,
    yellow2,
    orange2,
    red2,
    blue2,
  } = useColors();
  const insetGroupBackgroundColor = useMemo(
    () => Color(sheetBackgroundColor).lighten(0.5).hexa(),
    [sheetBackgroundColor],
  );

  const [footerHeight, setFooterHeight] = useState(0);
  const footerBottomInset = safeAreaInsets.bottom;
  const footerLinearGradientHeight = 32;
  const contentBottomInset =
    footerBottomInset + footerHeight + footerLinearGradientHeight / 10;

  const initialSnapPoints = useMemo(
    () => [
      // Disabled
      // 150,
      'CONTENT_HEIGHT',
    ],
    [],
  );

  const {
    animatedHandleHeight,
    animatedSnapPoints,
    animatedContentHeight,
    animatedScrollViewStyles,
    handleContentLayout,
  } = useBottomSheetDynamicSnapPoints(initialSnapPoints);

  const scrollViewRef = useRef<BottomSheetScrollViewMethods>(null);
  // #endregion //

  // #region Sheet Open/Close Handlers //
  const [sheetOpened, setSheetOpened] = useState(false);
  const [sheetHalfClosed, setSheetHalfClosed] = useState(false);
  const [devShowDetailsCounter, setDevShowDetailsCounter] = useState(0);
  const closeByDone = useRef(false);
  const handleChange = useCallback(
    (index: number) => {
      if (index >= 0) {
        setSheetOpened(true);
        closeByDone.current = false;
      }

      if (index < 0) {
        setSheetOpened(false);
        setDevShowDetailsCounter(0);
        if (!closeByDone.current && options?.onClose) options?.onClose();
      }

      if (index >= 0 && index < initialSnapPoints.length - 1) {
        setSheetHalfClosed(true);
      } else {
        setSheetHalfClosed(false);
      }
    },
    [initialSnapPoints.length, options],
  );

  const handleDismiss = useCallback(() => {
    //   console.warn('Dismiss');
  }, []);
  // #endregion //

  // #region RFID Device Connect & Power Control //

  const [useBuiltinReader, setUseBuiltinReader] = usePersistedState(
    'RFIDSheet-useBuiltinReader',
    false,
  );

  const [isWorking, setIsWorking] = useState(false);

  // Built-in Reader

  const [builtinReaderPowerOn, setBuiltinReaderPowerOn] = useState(false);
  const [builtinReaderAutoFree, setBuiltinReaderAutoFree] = useState(true);
  const [builtinReaderAutoFreeTimeout, setBuiltinReaderAutoFreeTimeout] =
    useState(180);
  const rfidLastFreedAt = useRef(0);
  const initBuiltinRfid = useCallback(async () => {
    if (await RFIDWithUHFUARTModule.isPowerOn()) {
      setBuiltinReaderPowerOn(true);
      return;
    }

    const lastFreedBefore = Date.now() - rfidLastFreedAt.current;
    if (lastFreedBefore < 5000) {
      // console.warn(
      //   `RFID: Device is recently freed, wait ${
      //     5000 - lastFreedBefore
      //   } to init...`,
      // );
      await new Promise(resolve => setTimeout(resolve, 5000 - lastFreedBefore));
    }

    try {
      await RFIDWithUHFUARTModule.init();
      setBuiltinReaderPowerOn(await RFIDWithUHFUARTModule.isPowerOn());
    } catch (e: any) {
      setBuiltinReaderPowerOn(await RFIDWithUHFUARTModule.isPowerOn());
    }
  }, []);
  const freeBuiltinRfid = useCallback(async () => {
    rfidLastFreedAt.current = Date.now();
    setBuiltinReaderPowerOn(false);
    try {
      // console.warn('freeBuiltinRfid');
      RFIDWithUHFUARTModule.free();
    } catch (e) {
      // TODO: Log error
    }
  }, []);

  const freeBuiltinRfidTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (sheetOpened) {
      if (!useBuiltinReader) return;
      if (freeBuiltinRfidTimer.current)
        clearTimeout(freeBuiltinRfidTimer.current);
      initBuiltinRfid();
    } else {
      if (freeBuiltinRfidTimer.current)
        clearTimeout(freeBuiltinRfidTimer.current);
      if (builtinReaderAutoFree) {
        const timer = setTimeout(() => {
          freeBuiltinRfid();
        }, builtinReaderAutoFreeTimeout * 1000);
        freeBuiltinRfidTimer.current = timer;
      }
    }
  }, [
    builtinReaderAutoFree,
    builtinReaderAutoFreeTimeout,
    freeBuiltinRfid,
    initBuiltinRfid,
    sheetOpened,
    useBuiltinReader,
  ]);

  // BLE Reader

  const [scanBleDevicesData, setScanBleDevicesData] = useState<
    Record<string, ScanDevicesData>
  >({});
  const receiveScanDeviceData = useCallback((d: ScanDevicesData[]) => {
    setScanBleDevicesData(data => ({
      ...data,
      ...Object.fromEntries(d.map(dd => [dd.address, dd])),
    }));
  }, []);
  const scanBleDevices = useCallback(async () => {
    setScanBleDevicesData({});
    RFIDWithUHFBLEModule.scanDevices(true, { callback: receiveScanDeviceData });
  }, [receiveScanDeviceData]);
  const stopScanBleDevices = useCallback(async () => {
    RFIDWithUHFBLEModule.scanDevices(false, {
      callback: receiveScanDeviceData,
    });
  }, [receiveScanDeviceData]);
  const clearScanDevicesData = useCallback(async () => {
    setScanBleDevicesData({});
  }, []);

  const [pairedBleDeviceAddress, setPairedBleDeviceAddress] = usePersistedState<
    null | string
  >('RFIDSheet-pairedBleDeviceAddress', null);
  const [pairedBleDeviceName, setPairedBleDeviceName] = usePersistedState<
    null | string
  >('RFIDSheet-pairedBleDeviceName', null);

  const pairDevice = useCallback(
    (d: ScanDevicesData) => {
      clearScanDevicesData();
      setPairedBleDeviceAddress(d.address);
      setPairedBleDeviceName(d.name || d.address);
      setBleDeviceConnectionStatus(null);
      setShowReaderSetup(false);
    },
    [clearScanDevicesData, setPairedBleDeviceAddress, setPairedBleDeviceName],
  );

  const [bleDeviceConnectionStatus, setBleDeviceConnectionStatus] =
    useState<DeviceConnectStatusPayload | null>(null);
  const prevBleDeviceConnectionStatus =
    useRef<DeviceConnectStatusPayload | null>(null);
  const [bleDeviceBatteryLevel, setBleDeviceBatteryLevel] = useState<
    null | number
  >(null);
  const receiveConnectStatusChange = useCallback(
    (payload: DeviceConnectStatusPayload) => {
      setBleDeviceConnectionStatus(payload);
      if (
        prevBleDeviceConnectionStatus.current?.status !== 'CONNECTED' &&
        payload.status === 'CONNECTED'
      ) {
        setBleDeviceBatteryLevel(null);
      }
    },
    [],
  );
  useEffect(() => {
    const subscription = RFIDWithUHFBLEModule.addDeviceConnectStatusListener(
      receiveConnectStatusChange,
    );
    return () => {
      subscription.remove();
    };
  }, [receiveConnectStatusChange]);

  // Automatically connect device
  useEffect(() => {
    if (!sheetOpened || useBuiltinReader) return;
    if (bleDeviceConnectionStatus?.status === 'CONNECTED') return;

    const tryToConnect = () => {
      if (!pairedBleDeviceAddress) {
        setShowReaderControls(true);
      } else {
        RFIDWithUHFBLEModule.connectDevice(pairedBleDeviceAddress);
      }
    };
    const timer = setTimeout(tryToConnect, 300);
    const interval = setInterval(tryToConnect, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [
    pairedBleDeviceAddress,
    useBuiltinReader,
    bleDeviceConnectionStatus?.status,
    sheetOpened,
  ]);

  useEffect(() => {
    if (!sheetOpened || isWorking || useBuiltinReader) return;

    const syncNativeBluetoothConnectionStatus = async () => {
      const connectionStatus =
        await RFIDWithUHFBLEModule.getDeviceConnectStatus();
      if (connectionStatus !== bleDeviceConnectionStatus?.status)
        setBleDeviceConnectionStatus(s => ({ ...s, status: connectionStatus }));
    };
    const timer = setTimeout(syncNativeBluetoothConnectionStatus, 100);
    const interval = setInterval(syncNativeBluetoothConnectionStatus, 3000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [
    pairedBleDeviceAddress,
    useBuiltinReader,
    bleDeviceConnectionStatus?.status,
    sheetOpened,
    isWorking,
  ]);

  useEffect(() => {
    if (!sheetOpened || useBuiltinReader) return;
    if (bleDeviceConnectionStatus?.status !== 'CONNECTED') return;
    if (isWorking) return;

    const timer = setTimeout(() => {
      RFIDWithUHFBLEModule.getDeviceBatteryLevel().then(v =>
        setBleDeviceBatteryLevel(v),
      );
    }, 800);

    const interval = setInterval(() => {
      RFIDWithUHFBLEModule.getDeviceBatteryLevel().then(v =>
        setBleDeviceBatteryLevel(v),
      );
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [
    useBuiltinReader,
    bleDeviceConnectionStatus?.status,
    sheetOpened,
    isWorking,
  ]);

  // General

  const rfidReaderDeviceReady = (() => {
    if (useBuiltinReader) {
      return builtinReaderPowerOn;
    }

    return bleDeviceConnectionStatus?.status === 'CONNECTED';
  })();

  const RFIDModule = useMemo(() => {
    if (useBuiltinReader) return RFIDWithUHFUARTModule;
    return RFIDWithUHFBLEModule;
  }, [useBuiltinReader]);
  // #endregion //

  // #region Configs from DB //
  const { db } = useDB();
  const [config, setConfig] = useState<ConfigStoredInDB | null>(null);
  const [defaultFilter, setDefaultFilter] = useState<string | null>(null);
  useEffect(() => {
    getConfigInDB(db).then(c => {
      setConfig(c);
      const [f] = EPCUtils.encodeHexEPC(
        `urn:epc:tag:giai-96:0.${c.epcCompanyPrefix}.${c.epcPrefix}`,
      );
      setDefaultFilter(f.slice(0, 8));
    });
  }, [db]);
  // #endregion //

  // #region Functionalities //

  const [power, setPower] = useState(20);

  useEffect(() => {
    if (options?.power) {
      return setPower(options?.power);
    }

    switch (options?.functionality) {
      case 'scan':
        return setPower(useBuiltinReader ? 28 : 20);
      case 'locate':
        return setPower(28);
      case 'write':
      default:
        return setPower(8);
    }
  }, [options?.power, options?.functionality, useBuiltinReader]);

  const [scanStatus, setScanStatus] = useState('');
  const scanName = useMemo(() => {
    if (options?.functionality !== 'scan') return 'default';

    return options.scanName || 'default';
  }, [options]);
  const [scannedData, setScannedData] = useState<
    Record<string, Record<string, ScanData>>
  >({});
  const [clearScannedDataCounter, setClearScannedDataCounter] = useState<
    Record<string, number | undefined>
  >({});
  // const [scannedDataCount, setScannedDataCount] = useState(0);
  // Will be used if useDefaultFilter is not specified in options
  const [useDefaultFilterFallback, setUseDefaultFilterFallback] =
    useState(true);
  const [enableScanFilter, setEnableScanFilter] = usePersistedState(
    'RFIDSheet-enableScanFilter',
    false,
  );
  const [scanFilterBitOffset, setScanFilterBitOffset] = usePersistedState<
    null | number
  >('RFIDSheet-scanFilterBitOffset', null);
  const [scanFilterBitCount, setScanFilterBitCount] = usePersistedState<
    null | number
  >('RFIDSheet-scanFilterBitCount', null);
  const [scanFilterData, setScanFilterData] = usePersistedState(
    'RFIDSheet-rfid-scanFilterData',
    '',
  );
  const handleChangeScanFilterBitOffsetText = useCallback(
    (text: string) => {
      const number = parseInt(text, 10);
      setScanFilterBitOffset(Number.isNaN(number) ? null : number);
    },
    [setScanFilterBitOffset],
  );
  const handleChangeScanFilterBitCountText = useCallback(
    (text: string) => {
      const number = parseInt(text, 10);
      setScanFilterBitCount(Number.isNaN(number) ? null : number);
    },
    [setScanFilterBitCount],
  );

  const receiveScanData = useCallback(
    (d: ScanData[]) => {
      setScannedData(data => ({
        ...data,
        [scanName]: {
          ...data[scanName],
          ...Object.fromEntries(d.map(dd => [dd.epc, dd])),
        },
      }));
      // setScannedDataCount(c => c + d.length);
    },
    [scanName],
  );
  const scannedDataLength = Object.keys(scannedData[scanName] || {}).length;
  const prevScannedDataLengths = useRef(
    Object.fromEntries(
      Object.entries(scannedData).map(([k, v]) => [k, Object.keys(v).length]),
    ),
  );
  useEffect(() => {
    if (options?.functionality !== 'scan') return;
    if (!options?.autoScroll) return;

    if (scannedDataLength > (prevScannedDataLengths.current[scanName] || -1)) {
      setTimeout(
        () => scrollViewRef.current?.scrollTo({ y: 999999, animated: true }),
        1,
      );
    }

    prevScannedDataLengths.current[scanName] = scannedDataLength;
  }, [options, scanName, scannedDataLength]);

  const startScan = useCallback(async () => {
    if (options?.functionality !== 'scan') return;

    const useDefaultFilter =
      options?.useDefaultFilter !== undefined
        ? options?.useDefaultFilter
        : useDefaultFilterFallback;

    const filterOption = useDefaultFilter
      ? {
          memoryBank: 'EPC' as const,
          bitOffset: 32,
          bitCount: (defaultFilter?.length || 0) * 4,
          data: defaultFilter || '',
        }
      : enableScanFilter
      ? {
          memoryBank: 'EPC' as const,
          bitOffset: scanFilterBitOffset || 32,
          bitCount: scanFilterBitCount || 16,
          data: scanFilterData || '0000',
        }
      : undefined;
    try {
      setIsWorking(true);
      setScanStatus('Scan starting...');
      const scannedEpcs = Object.keys(scannedData[scanName] || {});
      if (scannedEpcs.length <= 0) scannedEpcs.push('z'); // Must have at least 1 item to work
      await RFIDModule.startScan({
        power,
        soundEnabled: true,
        callback: receiveScanData,
        scanRate: 30,
        eventRate: 250,
        filter: filterOption,
        playSoundOnlyForEpcs: options.playSoundOnlyForEpcs,
        scannedEpcs,
      });
      setScanStatus('Scanning...');
    } catch (e: any) {
      setScanStatus(`Error: ${e?.message}`);
      setIsWorking(false);
    }
  }, [
    RFIDModule,
    defaultFilter,
    options,
    scanName,
    scannedData,
    useDefaultFilterFallback,
    enableScanFilter,
    scanFilterBitOffset,
    scanFilterBitCount,
    scanFilterData,
    power,
    receiveScanData,
  ]);

  const stopScan = useCallback(async () => {
    try {
      setScanStatus('Stopping...');
      await RFIDModule.stopScan();
      setScanStatus('');
      setIsWorking(false);
    } catch (e: any) {
      setScanStatus(`Error: ${e?.message}`);
    }
  }, [RFIDModule]);

  const clearScannedData = useCallback(async () => {
    setScannedData(d => ({ ...d, [scanName]: {} }));
    setClearScannedDataCounter(d => ({
      ...d,
      [scanName]: (d[scanName] || 0) + 1,
    }));
    // setScannedDataCount(0);
    // await RFIDModule.clearScannedTags();
  }, [scanName]);
  useEffect(() => {
    if (options?.functionality !== 'scan') return;
    if (!options?.resetData) return;

    clearScannedData();
    // Wait for content to render so that clearScannedDataCounter can have effect
    setTimeout(() => clearScannedData(), 10);
    setTimeout(() => clearScannedData(), 100);
    setTimeout(() => clearScannedData(), 500);
  }, [options, clearScannedData]);

  const scannedItems = scannedData[scanName] || {};

  const [locateReaderSoundEnabled, setLocateReaderSoundEnabled] =
    usePersistedState('RFIDSheet-locateReaderSoundEnabled', true);
  const [locateStatus, setLocateStatus] = useState('');
  const [locateRssi, setLocateRssi] = useState<number | null>(null);
  // Will be used if EPC is not set in options.
  const [locateFallbackEpc, setLocateFallbackEpc] = usePersistedState(
    'RFIDSheet-locateFallbackEpc',
    '',
  );

  const clearLocateRssiTimer = useRef<NodeJS.Timeout | null>(null);
  const receiveLocateData = useCallback(
    (d: ScanData[]) => {
      if (options?.functionality !== 'locate') return;
      const locateEpc = options?.epc || locateFallbackEpc;

      const filteredD = d.filter(({ epc }) => epc?.startsWith(locateEpc));
      const lastD = filteredD[filteredD.length - 1];
      if (!lastD) return;

      if (clearLocateRssiTimer.current)
        clearTimeout(clearLocateRssiTimer.current);
      setLocateRssi(lastD.rssi);
      clearLocateRssiTimer.current = setTimeout(() => {
        setLocateRssi(null);
      }, 1000);
    },
    [options, locateFallbackEpc],
  );

  const startLocate = useCallback(async () => {
    if (options?.functionality !== 'locate') return;
    try {
      setIsWorking(true);
      setLocateStatus('Starting...');
      const epc = options?.epc || locateFallbackEpc;
      await RFIDModule.startScan({
        power,
        soundEnabled: true,
        callback: receiveLocateData,
        scanRate: 12,
        eventRate: 80,
        filter: {
          memoryBank: 'EPC',
          bitOffset: 32,
          bitCount: (epc.length || 0) * 4,
          data: epc,
        },
        isLocate: true,
        enableReaderSound: locateReaderSoundEnabled,
      });
      setLocateStatus('Signals broadcasting, move around to locate');
    } catch (e: any) {
      setLocateStatus(`Error: ${e?.message}`);
      setIsWorking(false);
    }
  }, [
    RFIDModule,
    locateReaderSoundEnabled,
    options,
    locateFallbackEpc,
    power,
    receiveLocateData,
  ]);

  const stopLocate = useCallback(async () => {
    try {
      setLocateStatus('Stopping...');
      await RFIDModule.stopScan();
      setLocateStatus('');
      setIsWorking(false);
    } catch (e: any) {
      setLocateStatus(`Error: ${e?.message}`);
    }
  }, [RFIDModule]);

  const clearWriteAndLockStatusTimer = useRef<NodeJS.Timeout | null>(null);
  const [writeAndLockStatus, setWriteAndLockStatus] = useState('');
  // Will be used if EPC is not set in options.
  const [writeAndLockFallbackEpc, setWriteAndLockFallbackEpc] =
    usePersistedState('RFIDSheet-writeAndLockFallbackEpc', '');
  const [
    writeAndLockFallbackAccessPassword,
    setWriteAndLockFallbackAccessPassword,
  ] = usePersistedState('RFIDSheet-writeAndLockFallbackAccessPassword', '');
  const writeAndLock = useCallback(async () => {
    if (options?.functionality !== 'write') return;
    if (isWorking) return;
    if (!config) return;

    const epc = options.epc || writeAndLockFallbackEpc;
    const accessPassword = options.epc
      ? getTagAccessPassword(
          config.rfidTagAccessPassword,
          options.tagAccessPassword || '00000000',
          config.rfidTagAccessPasswordEncoding,
        )
      : writeAndLockFallbackAccessPassword;

    try {
      if (clearWriteAndLockStatusTimer.current)
        clearTimeout(clearWriteAndLockStatusTimer.current);
      setIsWorking(true);
      await RFIDModule.writeEpcAndLock(epc, accessPassword, {
        power,
        oldAccessPassword: '00000000',
        soundEnabled: true,
        reportStatus: setWriteAndLockStatus,
      });
      if (options?.afterWriteSuccessRef && options.afterWriteSuccessRef.current)
        options.afterWriteSuccessRef.current();
    } catch (e: any) {
      // console.warn(e);
    } finally {
      setIsWorking(false);
      clearWriteAndLockStatusTimer.current = setTimeout(
        () => setWriteAndLockStatus(''),
        3000,
      );
    }
  }, [
    options,
    writeAndLockFallbackEpc,
    writeAndLockFallbackAccessPassword,
    isWorking,
    config,
    RFIDModule,
    power,
  ]);

  const unlockAndReset = useCallback(async () => {
    if (options?.functionality !== 'write') return;
    if (isWorking) return;
    if (!config) return;

    const accessPassword = options.epc
      ? getTagAccessPassword(
          config.rfidTagAccessPassword,
          options.tagAccessPassword || '00000000',
          config.rfidTagAccessPasswordEncoding,
        )
      : writeAndLockFallbackAccessPassword;

    try {
      if (clearWriteAndLockStatusTimer.current)
        clearTimeout(clearWriteAndLockStatusTimer.current);
      setIsWorking(true);
      await RFIDModule.resetEpcAndUnlock(accessPassword, {
        power,
        soundEnabled: true,
        reportStatus: setWriteAndLockStatus,
        // filter: enableFilter
        //   ? {
        //       memoryBank: filterMemoryBank,
        //       bitOffset: filterBitOffset || DEFAULTS.FILTER_BIT_OFFSET,
        //       bitCount: filterBitCount || DEFAULTS.FILTER_BIT_COUNT,
        //       data: filterData,
        //     }
        //   : undefined,
      });
    } catch (e: any) {
      // console.warn(e);
    } finally {
      setIsWorking(false);
      clearWriteAndLockStatusTimer.current = setTimeout(
        () => setWriteAndLockStatus(''),
        3000,
      );
    }
  }, [
    options,
    writeAndLockFallbackAccessPassword,
    config,
    RFIDModule,
    power,
    isWorking,
  ]);

  const [dCounter, setDCounter] = useState(1);
  // #endregion //

  // #region Shared Event Handlers //
  const [actionButtonPressedIn, setActionButtonPressedIn] = useState(false);
  const handleActionButtonPress = useCallback(() => {
    switch (options?.functionality) {
      case 'scan': {
        return;
      }
      case 'write': {
        return;
      }
      case 'locate': {
        return;
      }
      default:
        setDCounter(v => (v >= 4 ? 1 : v + 1));
    }
  }, [options?.functionality]);
  const handleActionButtonPressIn = useCallback(() => {
    setActionButtonPressedIn(true);
    switch (options?.functionality) {
      case 'scan': {
        return startScan();
      }
      case 'locate': {
        return startLocate();
      }
      case 'write': {
        return writeAndLock();
      }
    }
  }, [options?.functionality, startLocate, startScan, writeAndLock]);
  const handleActionButtonPressOut = useCallback(() => {
    setActionButtonPressedIn(false);
    switch (options?.functionality) {
      case 'scan': {
        return stopScan();
      }
      case 'locate': {
        return stopLocate();
      }
    }
  }, [options?.functionality, stopLocate, stopScan]);
  // #endregion //

  // #region Render //
  const [showReaderControls, setShowReaderControls] = useState(false);
  const [showReaderSetup, setShowReaderSetup] = useState(false);
  const Footer = useCallback(
    ({ animatedFooterPosition, ...props }: BottomSheetFooterProps) => {
      const buttonColor = (() => {
        switch (options?.functionality) {
          case 'write':
            return red2;

          case 'scan':
          case 'locate':
          default:
            return yellow2;
        }
      })();
      const buttonLabel = (() => {
        switch (options?.functionality) {
          case 'write':
            return 'Write';

          case 'scan':
            return 'Scan';

          case 'locate':
            return 'Search';

          default:
            return 'Go';
        }
      })();

      return (
        <BottomSheetFooter
          {...props}
          bottomInset={footerBottomInset}
          animatedFooterPosition={animatedFooterPosition}
        >
          <View
            style={[
              styles.sheetFooterBackgroundContainer,
              {
                top: -footerLinearGradientHeight,
                height: contentBottomInset + footerLinearGradientHeight,
              },
            ]}
          >
            <LinearGradient
              colors={[
                Color(sheetBackgroundColor).opaquer(-1).hexa(),
                sheetBackgroundColor,
              ]}
              style={[
                styles.sheetFooterLinearGradient,
                {
                  height: footerLinearGradientHeight,
                },
              ]}
            />
            <View
              style={[
                styles.sheetFooterBackground,
                {
                  top: footerLinearGradientHeight,
                  backgroundColor: sheetBackgroundColor,
                },
              ]}
            />
          </View>

          <View
            onLayout={event => {
              setFooterHeight(event.nativeEvent.layout.height);
            }}
            style={styles.sheetFooterContainer}
          >
            <View style={styles.actionButtonAndStatusTextContainer}>
              <Text style={styles.actionButtonStatusText} numberOfLines={1}>
                {(() => {
                  if (sheetHalfClosed) return 'Slide up to access';
                  if (!useBuiltinReader && !rfidReaderDeviceReady)
                    return 'Trying to connect to RFID reader...';
                  switch (options?.functionality) {
                    case 'scan':
                      return scanStatus;
                    case 'locate':
                      return locateStatus;
                    case 'write':
                      return writeAndLockStatus;
                  }
                })() || '  '}
              </Text>
              <ElevatedButton
                title={buttonLabel}
                color={buttonColor}
                pressRetentionOffset={ACTION_BUTTON_PRESS_RETENTION_OFFSET}
                onPress={handleActionButtonPress}
                onPressIn={handleActionButtonPressIn}
                onPressOut={handleActionButtonPressOut}
                down={(() => {
                  switch (options?.functionality) {
                    case 'write':
                      return isWorking;
                    default:
                      return false;
                  }
                })()}
                disabled={(() => {
                  if (sheetHalfClosed) return true;
                  if (!rfidReaderDeviceReady) return true;

                  switch (options?.functionality) {
                    default:
                      return false;
                  }
                })()}
                loading={(() => {
                  switch (options?.functionality) {
                    case 'write':
                      return isWorking;
                    default:
                      return false;
                  }
                })()}
              />
            </View>
            <View
              style={[
                styles.moreControlsContainer,
                { paddingTop: safeAreaInsets.bottom / 2 },
              ]}
            >
              <View style={styles.secondaryButtonContainer}>
                {(() => {
                  switch (options?.functionality) {
                    case 'scan':
                      return (
                        <SecondaryButton
                          title="Reset"
                          onPress={clearScannedData}
                        />
                      );
                    case 'write':
                      return (
                        <SecondaryButton
                          title="Wipe"
                          onPress={unlockAndReset}
                          disabled={!rfidReaderDeviceReady}
                        />
                      );
                    default:
                      return null;
                  }
                })()}
              </View>
              <View style={styles.readerDeviceContainer}>
                <TouchableOpacity onPress={() => setShowReaderControls(true)}>
                  <View style={styles.readerDeviceNameContainer}>
                    <ReaderIcon
                      size={20}
                      loading={!rfidReaderDeviceReady}
                      isBluetooth={!useBuiltinReader}
                    />
                    <Text style={styles.readerDeviceNameText}>
                      {' '}
                      {(() => {
                        if (useBuiltinReader) return 'Built-In UHF';
                        return pairedBleDeviceName || 'Not Configured';
                      })()}
                    </Text>
                  </View>
                  <View style={styles.readerStatusContainer}>
                    {!useBuiltinReader &&
                      rfidReaderDeviceReady &&
                      bleDeviceBatteryLevel !== null && (
                        <>
                          <BatteryIcon
                            percentage={bleDeviceBatteryLevel}
                            size={18}
                          />
                          <Text style={styles.readerStatusText}>
                            {' '}
                            {bleDeviceBatteryLevel}%{'  '}
                          </Text>
                        </>
                      )}
                    <DbmPowerIcon size={18} />
                    <Text style={styles.readerStatusText}>
                      {' '}
                      {power}
                      <Text style={commonStyles.fs8}> </Text>
                      dBm
                      {/* */}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.secondaryButtonContainer}>
                {(() => {
                  switch (options?.functionality) {
                    default:
                      return (
                        <SecondaryButton
                          title="Done"
                          onPress={() => {
                            if (options?.onDone) options?.onDone();
                            closeByDone.current = true;
                            innerRef.current?.dismiss();
                          }}
                        />
                      );
                  }
                })()}
              </View>
            </View>
          </View>
        </BottomSheetFooter>
      );
    },
    [
      footerBottomInset,
      contentBottomInset,
      sheetBackgroundColor,
      handleActionButtonPress,
      handleActionButtonPressIn,
      handleActionButtonPressOut,
      safeAreaInsets.bottom,
      sheetHalfClosed,
      rfidReaderDeviceReady,
      useBuiltinReader,
      bleDeviceBatteryLevel,
      power,
      options,
      red2,
      yellow2,
      scanStatus,
      locateStatus,
      writeAndLockStatus,
      isWorking,
      clearScannedData,
      unlockAndReset,
      pairedBleDeviceName,
      innerRef,
    ],
  );

  const renderHandle = useCallback(
    (props: React.ComponentProps<typeof BottomSheetHandle>) => (
      <BottomSheetHandle
        {...props}
        style={[
          styles.sheetHandle,
          {
            backgroundColor: sheetBackgroundColor,
          },
        ]}
        // eslint-disable-next-line react-native/no-inline-styles
        indicatorStyle={{
          backgroundColor: isDarkMode
            ? 'rgba(255, 255, 255, 0.5)'
            : 'rgba(0, 0, 0, 0.75)',
        }}
      />
    ),
    [isDarkMode, sheetBackgroundColor],
  );

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={initialSnapPoints.length - 2}
        appearsOnIndex={initialSnapPoints.length - 1}
        opacity={0.4}
        pressBehavior="collapse"
        // pressBehavior="close"
      />
    ),
    [initialSnapPoints.length],
  );

  return (
    <>
      <BottomSheetModal
        ref={innerRef}
        enableContentPanningGesture={!actionButtonPressedIn}
        // detached={true}
        // style={{ marginHorizontal: 16 }}
        // bottomInset={safeAreaInsets.bottom + 32}
        index={initialSnapPoints.length - 1}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: sheetBackgroundColor }}
        handleComponent={renderHandle}
        backdropComponent={renderBackdrop}
        footerComponent={Footer}
        snapPoints={animatedSnapPoints}
        handleHeight={animatedHandleHeight}
        contentHeight={animatedContentHeight}
        style={[styles.modal, isDarkMode && styles.modalDarkMode]}
        onChange={handleChange}
        onDismiss={handleDismiss}
      >
        {(() => {
          switch (options?.functionality) {
            case 'scan': {
              const scannedItemsCount = Object.keys(scannedItems).length;
              const renderScannedItems = options.renderScannedItemsRef?.current;
              return (
                <BottomSheetScrollView
                  style={animatedScrollViewStyles}
                  automaticallyAdjustKeyboardInsets
                  ref={scrollViewRef}
                  // contentInset={{ bottom: contentBottomInset }}
                >
                  <View
                    style={[
                      commonStyles.flex1,
                      commonStyles.pt16,
                      { paddingBottom: contentBottomInset },
                    ]}
                    onLayout={handleContentLayout}
                  >
                    {renderScannedItems ? (
                      renderScannedItems(scannedItems, {
                        contentBackgroundColor: insetGroupBackgroundColor,
                        clearScannedDataCounter:
                          clearScannedDataCounter[scanName] || 0,
                      })
                    ) : (
                      <>
                        {scannedItemsCount <= 0 ? (
                          <InsetGroup
                            style={[
                              {
                                backgroundColor: insetGroupBackgroundColor,
                              },
                              commonStyles.centerChildren,
                              commonStyles.ph16,
                              commonStyles.pv40,
                            ]}
                          >
                            <Text
                              style={[commonStyles.opacity05, commonStyles.tac]}
                            >
                              Press and hold the Scan button to start scanning
                            </Text>
                          </InsetGroup>
                        ) : (
                          <InsetGroup
                            style={{
                              backgroundColor: insetGroupBackgroundColor,
                            }}
                            label={`${scannedItemsCount} Item${
                              scannedItemsCount > 1 ? 's' : ''
                            }`}
                            // labelRight={
                            //   <InsetGroup.GroupLabelRightButton
                            //     label="Clear"
                            //     onPress={clearScannedData}
                            //   />
                            // }
                          >
                            {Object.values(scannedItems)
                              .flatMap(d => [
                                <ScannedItem
                                  key={d.epc}
                                  item={d}
                                  onPressRef={options?.onScannedItemPressRef}
                                />,
                                <InsetGroup.ItemSeperator
                                  key={`s-${d.epc}`}
                                  leftInset={60}
                                />,
                              ])
                              .slice(0, -1)}
                          </InsetGroup>
                        )}
                        {options?.useDefaultFilter === undefined && (
                          <InsetGroup
                            label="Scan Settings"
                            style={{
                              backgroundColor: insetGroupBackgroundColor,
                            }}
                            footerLabel={
                              useDefaultFilterFallback
                                ? 'Will only scan tags that are likely to be recognizable by this app.'
                                : undefined
                            }
                          >
                            <InsetGroup.Item
                              label="Use Default Filter"
                              detail={
                                <Switch
                                  value={useDefaultFilterFallback}
                                  onChange={() =>
                                    setUseDefaultFilterFallback(v => !v)
                                  }
                                />
                              }
                            />
                            {!useDefaultFilterFallback && (
                              <>
                                <InsetGroup.ItemSeperator />
                                <InsetGroup.Item
                                  label="Enable Custom Filter"
                                  detail={
                                    <Switch
                                      value={enableScanFilter}
                                      onChange={() =>
                                        setEnableScanFilter(v => !v)
                                      }
                                    />
                                  }
                                />
                                {enableScanFilter && (
                                  <>
                                    <InsetGroup.ItemSeperator />
                                    <InsetGroup.Item
                                      label="Filter Bit Offset (ptr)"
                                      detail={
                                        <InsetGroup.TextInput
                                          alignRight
                                          keyboardType="number-pad"
                                          placeholder="32"
                                          returnKeyType="done"
                                          value={scanFilterBitOffset?.toString()}
                                          onChangeText={
                                            handleChangeScanFilterBitOffsetText
                                          }
                                        />
                                      }
                                    />
                                    <InsetGroup.ItemSeperator />
                                    <InsetGroup.Item
                                      label="Filter Bit Count (len)"
                                      detail={
                                        <InsetGroup.TextInput
                                          alignRight
                                          keyboardType="number-pad"
                                          placeholder="16"
                                          returnKeyType="done"
                                          value={scanFilterBitCount?.toString()}
                                          onChangeText={
                                            handleChangeScanFilterBitCountText
                                          }
                                        />
                                      }
                                    />
                                    <InsetGroup.ItemSeperator />
                                    <InsetGroup.Item
                                      label="Filter Data"
                                      vertical2
                                      detail={
                                        <InsetGroup.TextInput
                                          placeholder="0000"
                                          autoCapitalize="characters"
                                          autoCorrect={false}
                                          clearButtonMode="while-editing"
                                          returnKeyType="done"
                                          style={commonStyles.monospaced}
                                          value={scanFilterData}
                                          keyboardType="ascii-capable"
                                          onChangeText={t =>
                                            setScanFilterData(
                                              t
                                                .replace(/[^0-9a-fA-F]/gm, '')
                                                .toUpperCase(),
                                            )
                                          }
                                        />
                                      }
                                    />
                                  </>
                                )}
                              </>
                            )}
                          </InsetGroup>
                        )}
                      </>
                    )}
                  </View>
                </BottomSheetScrollView>
              );
            }
            case 'write': {
              return (
                <BottomSheetScrollView
                  style={animatedScrollViewStyles}
                  automaticallyAdjustKeyboardInsets
                  // contentInset={{ bottom: contentBottomInset }}
                >
                  <View
                    style={[
                      commonStyles.flex1,
                      commonStyles.pt16,
                      { paddingBottom: contentBottomInset },
                    ]}
                    onLayout={handleContentLayout}
                  >
                    <InsetGroup
                      // label="Write Data"
                      footerLabel={
                        'Hold the RFID tag near the reader and press "Write" to write and lock it. To reset and unlock a written tag, press "Wipe".'
                      }
                      style={{
                        backgroundColor: insetGroupBackgroundColor,
                      }}
                    >
                      {options?.epc ? (
                        <>
                          <TouchableWithoutFeedback
                            onPress={() => setDevShowDetailsCounter(v => v + 1)}
                          >
                            <InsetGroup.Item
                              vertical2
                              label="EPC"
                              detailAsText
                              detailTextStyle={commonStyles.monospaced}
                              detail={
                                <AutoSizeText
                                  fontSize={InsetGroup.FONT_SIZE}
                                  mode={ResizeTextMode.max_lines}
                                  numberOfLines={1}
                                >
                                  {(() => {
                                    try {
                                      const [epc] = EPCUtils.decodeHexEPC(
                                        options.epc,
                                      );
                                      return epc;
                                    } catch (e) {
                                      return options.epc;
                                    }
                                  })()}
                                </AutoSizeText>
                              }
                            />
                          </TouchableWithoutFeedback>
                          {devShowDetailsCounter > 10 && (
                            <>
                              <InsetGroup.ItemSeperator />
                              <InsetGroup.Item
                                vertical2
                                label="Raw EPC"
                                detailTextStyle={commonStyles.monospaced}
                                detail={options.epc}
                              />
                              <InsetGroup.ItemSeperator />
                              <InsetGroup.Item
                                vertical2
                                label="Access Password"
                                detailTextStyle={commonStyles.monospaced}
                                detail={
                                  config
                                    ? getTagAccessPassword(
                                        config.rfidTagAccessPassword,
                                        options.tagAccessPassword || '00000000',
                                        config.rfidTagAccessPasswordEncoding,
                                      )
                                    : 'Config Not Ready'
                                }
                              />
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <InsetGroup.Item
                            vertical2
                            label="EPC (Hex)"
                            detail={
                              <InsetGroup.TextInput
                                autoFocus={!writeAndLockFallbackEpc}
                                placeholder="Enter EPC Hex"
                                autoCapitalize="characters"
                                autoCorrect={false}
                                clearButtonMode="while-editing"
                                returnKeyType="done"
                                value={writeAndLockFallbackEpc}
                                style={commonStyles.monospaced}
                                keyboardType="ascii-capable"
                                onChangeText={t =>
                                  setWriteAndLockFallbackEpc(
                                    t
                                      .replace(/[^0-9a-fA-F]/gm, '')
                                      .toUpperCase(),
                                  )
                                }
                              />
                            }
                          />
                          <InsetGroup.ItemSeperator />
                          <InsetGroup.Item
                            vertical2
                            label="Access Password (Hex)"
                            detail={
                              <InsetGroup.TextInput
                                autoFocus={
                                  !!writeAndLockFallbackEpc &&
                                  !writeAndLockFallbackAccessPassword
                                }
                                placeholder="Enter access password (8 digits)"
                                autoCapitalize="characters"
                                autoCorrect={false}
                                clearButtonMode="while-editing"
                                returnKeyType="done"
                                style={commonStyles.monospaced}
                                value={writeAndLockFallbackAccessPassword}
                                onChangeText={v =>
                                  setWriteAndLockFallbackAccessPassword(v)
                                }
                              />
                            }
                          />
                        </>
                      )}
                    </InsetGroup>
                  </View>
                </BottomSheetScrollView>
              );
            }
            case 'locate': {
              return (
                <BottomSheetScrollView
                  style={animatedScrollViewStyles}
                  automaticallyAdjustKeyboardInsets
                  // contentInset={{ bottom: contentBottomInset }}
                >
                  <View
                    style={[
                      commonStyles.flex1,
                      commonStyles.pt16,
                      { paddingBottom: contentBottomInset },
                    ]}
                    onLayout={handleContentLayout}
                  >
                    <InsetGroup
                      style={{
                        backgroundColor: insetGroupBackgroundColor,
                      }}
                    >
                      {options?.epc ? (
                        <InsetGroup.Item
                          vertical2
                          label="EPC"
                          detailAsText
                          detailTextStyle={commonStyles.monospaced}
                          detail={
                            <AutoSizeText
                              fontSize={InsetGroup.FONT_SIZE}
                              mode={ResizeTextMode.max_lines}
                              numberOfLines={1}
                            >
                              {(() => {
                                try {
                                  const [epc] = EPCUtils.decodeHexEPC(
                                    options.epc,
                                  );
                                  return epc;
                                } catch (e) {
                                  return options.epc;
                                }
                              })()}
                            </AutoSizeText>
                          }
                        />
                      ) : (
                        <InsetGroup.Item
                          vertical2
                          label="EPC (Hex)"
                          detail={
                            <InsetGroup.TextInput
                              autoFocus={!locateFallbackEpc}
                              placeholder="Enter EPC Hex"
                              autoCapitalize="characters"
                              autoCorrect={false}
                              clearButtonMode="while-editing"
                              returnKeyType="done"
                              value={locateFallbackEpc}
                              style={commonStyles.monospaced}
                              keyboardType="ascii-capable"
                              onChangeText={t =>
                                setLocateFallbackEpc(
                                  t.replace(/[^0-9a-fA-F]/gm, '').toUpperCase(),
                                )
                              }
                            />
                          }
                        />
                      )}
                    </InsetGroup>
                    <InsetGroup
                      footerLabel={
                        'Press and hold the "Search" button, move the RFID reader slowly and observe the change of RSSI to locate a tag.'
                      }
                      style={{
                        backgroundColor: insetGroupBackgroundColor,
                      }}
                    >
                      <InsetGroup.Item
                        vertical2
                        label="RSSI"
                        detailAsText
                        detail={
                          <Text
                            style={
                              locateRssi === null && commonStyles.opacity02
                            }
                          >
                            {locateRssi || 'No Signal'}
                          </Text>
                        }
                      />
                    </InsetGroup>
                  </View>
                </BottomSheetScrollView>
              );
            }
            default:
              return (
                <BottomSheetScrollView
                  style={animatedScrollViewStyles}
                  // contentInset={{ bottom: contentBottomInset }}
                >
                  <View
                    style={[
                      commonStyles.flex1,
                      commonStyles.pt16,
                      { paddingBottom: contentBottomInset },
                    ]}
                    onLayout={handleContentLayout}
                  >
                    {Array.from(new Array(dCounter)).map((_, i) => (
                      <InsetGroup
                        key={i}
                        label="Info"
                        style={{
                          backgroundColor: insetGroupBackgroundColor,
                        }}
                      >
                        <InsetGroup.Item
                          label="RFID Status"
                          detail={rfidReaderDeviceReady ? 'Ready' : 'Not Ready'}
                        />
                        <InsetGroup.ItemSeperator />
                        <InsetGroup.Item
                          label="Config Ready"
                          detail={config ? 'Yes' : 'No'}
                        />
                        <InsetGroup.ItemSeperator />
                        <InsetGroup.Item
                          label="Default Filter"
                          detail={defaultFilter}
                        />
                        <InsetGroup.ItemSeperator />
                        <InsetGroup.Item
                          label="Status"
                          detail={(() => {
                            // if (options?.functionality === 'write') {
                            //   return writeAndLockStatus;
                            // }
                            return 'null';
                          })()}
                        />
                        <InsetGroup.ItemSeperator />
                        <InsetGroup.Item
                          label="Options"
                          vertical2
                          detail={JSON.stringify(options, null, 2)}
                        />
                        <InsetGroup.ItemSeperator />
                        <InsetGroup.Item
                          label="Config"
                          vertical2
                          detail={JSON.stringify(config, null, 2)}
                        />
                      </InsetGroup>
                    ))}
                  </View>
                </BottomSheetScrollView>
              );
          }
        })()}
        <LinearGradient
          colors={[
            sheetBackgroundColor,
            Color(sheetBackgroundColor).opaquer(-1).hexa(),
          ]}
          style={styles.sheetUpperLinearGradient}
        />
      </BottomSheetModal>

      <Modal
        isVisible={showReaderControls}
        onBackdropPress={() => setShowReaderControls(false)}
      >
        {(() => {
          if (showReaderSetup) {
            return (
              <ScrollView
                style={[
                  styles.controlsModelContent,
                  {
                    backgroundColor: sheetBackgroundColor,
                    maxHeight:
                      (windowDimensions.height -
                        safeAreaInsets.top -
                        safeAreaInsets.bottom) *
                      0.8,
                  },
                ]}
              >
                <InsetGroup
                  style={[
                    commonStyles.mt32,
                    {
                      backgroundColor: insetGroupBackgroundColor,
                    },
                  ]}
                >
                  <InsetGroup.Item
                    button
                    label="Back"
                    onPress={() => setShowReaderSetup(false)}
                  />
                </InsetGroup>
                {pairedBleDeviceAddress && (
                  <InsetGroup
                    label="Paired Device"
                    style={{ backgroundColor: insetGroupBackgroundColor }}
                  >
                    <InsetGroup.Item
                      label="Name"
                      detail={pairedBleDeviceName}
                    />
                    <InsetGroup.ItemSeperator />
                    <InsetGroup.Item
                      label="ID"
                      detail={pairedBleDeviceAddress}
                    />
                  </InsetGroup>
                )}

                <InsetGroup
                  label="Connect to New Device"
                  style={{ backgroundColor: insetGroupBackgroundColor }}
                >
                  <InsetGroup.Item
                    button
                    label="Search"
                    onPress={scanBleDevices}
                  />
                  <InsetGroup.ItemSeperator />
                  {Object.values(scanBleDevicesData).length <= 0 && (
                    <InsetGroup.Item
                      disabled
                      label={'Press "Search" to search devices'}
                    />
                  )}
                  {/*{Object.values(scanBleDevicesData).length > 0 && (
                    <>
                      <InsetGroup.Item
                        button
                        label="Clear List"
                        onPress={clearScanDevicesData}
                      />
                      <InsetGroup.ItemSeperator />
                    </>
                  )}*/}
                  {Object.values(scanBleDevicesData)
                    .flatMap(d => [
                      <InsetGroup.Item
                        key={d.address}
                        label={d.name || d.address}
                        vertical
                        detail={[d.address, d.rssi && `RSSI: ${d.rssi}`]
                          .filter(s => s)
                          .join(', ')}
                        onPress={() => pairDevice(d)}
                      />,
                      <InsetGroup.ItemSeperator key={`s-${d.address}`} />,
                    ])
                    .slice(0, -1)}
                </InsetGroup>
              </ScrollView>
            );
          }

          return (
            <View
              style={[
                styles.controlsModelContent,
                { backgroundColor: sheetBackgroundColor },
              ]}
            >
              <InsetGroup
                label="Device"
                labelContainerStyle={commonStyles.mt32}
                style={{
                  backgroundColor: insetGroupBackgroundColor,
                }}
              >
                <InsetGroup.Item
                  label="Use Built-In UHF"
                  detail={
                    <Switch
                      value={useBuiltinReader}
                      onChange={() => setUseBuiltinReader(v => !v)}
                    />
                  }
                />
                {(() => {
                  if (useBuiltinReader) {
                    return (
                      <>
                        <InsetGroup.ItemSeperator />
                        <InsetGroup.Item
                          label="Status"
                          detail={builtinReaderPowerOn ? 'On' : 'Off'}
                        />
                      </>
                    );
                  }

                  return (
                    <>
                      {pairedBleDeviceAddress && (
                        <>
                          <InsetGroup.ItemSeperator />
                          <InsetGroup.Item
                            label="Device Name"
                            detail={pairedBleDeviceName}
                          />
                          <InsetGroup.ItemSeperator />
                          <InsetGroup.Item
                            label="Device ID"
                            detail={pairedBleDeviceAddress}
                          />
                        </>
                      )}
                      <InsetGroup.ItemSeperator />
                      <InsetGroup.Item
                        label="Status"
                        detail={(() => {
                          if (!pairedBleDeviceAddress) return 'Not Configured';
                          if (bleDeviceConnectionStatus?.status === 'CONNECTED')
                            return 'Connected';
                          if (
                            bleDeviceConnectionStatus?.status === 'CONNECTING'
                          )
                            return 'Connecting';
                          return 'Not Connected';
                        })()}
                      />
                      <InsetGroup.ItemSeperator />
                      <InsetGroup.Item
                        button
                        label="Setup Device Connection"
                        onPress={() => {
                          setShowReaderSetup(true);
                        }}
                      />
                      <InsetGroup.ItemSeperator />
                      <InsetGroup.Item
                        label="Beep while locating"
                        detail={
                          <Switch
                            value={locateReaderSoundEnabled}
                            onChange={() =>
                              setLocateReaderSoundEnabled(v => !v)
                            }
                          />
                        }
                      />
                    </>
                  );
                })()}
              </InsetGroup>
              {useBuiltinReader && (
                <InsetGroup
                  label="Auto Free"
                  footerLabel="If enabled, the built-in RFID module will automatically power off while not being used."
                  style={{ backgroundColor: insetGroupBackgroundColor }}
                >
                  <InsetGroup.Item
                    label="Enabled"
                    detail={
                      <Switch
                        value={builtinReaderAutoFree}
                        onChange={() => setBuiltinReaderAutoFree(v => !v)}
                      />
                    }
                  />
                  <InsetGroup.ItemSeperator />
                  <InsetGroup.Item
                    label="Timeout"
                    detail={`${builtinReaderAutoFreeTimeout}s`}
                  >
                    <Slider
                      style={[commonStyles.flex1]}
                      minimumValue={3}
                      maximumValue={300}
                      step={1}
                      value={builtinReaderAutoFreeTimeout}
                      onValueChange={v => setBuiltinReaderAutoFreeTimeout(v)}
                    />
                  </InsetGroup.Item>
                </InsetGroup>
              )}
              <InsetGroup
                label="Power"
                style={[
                  commonStyles.row,
                  commonStyles.centerChildren,
                  commonStyles.p8,
                  commonStyles.ph16,
                  {
                    backgroundColor: insetGroupBackgroundColor,
                  },
                ]}
              >
                <Slider
                  style={commonStyles.flex1}
                  minimumValue={5}
                  maximumValue={30}
                  step={1}
                  value={power}
                  onValueChange={v => setPower(v)}
                />
                <Text
                  style={{
                    color: contentSecondaryTextColor,
                    fontSize: InsetGroup.FONT_SIZE,
                  }}
                >
                  {'  '}
                  {power} dBm
                </Text>
              </InsetGroup>
            </View>
          );
        })()}
      </Modal>
    </>
  );
  // #endregion //
}

function ScannedItem({
  item,
  onPressRef,
}: {
  item: ScanData;
  onPressRef?: React.MutableRefObject<OnScannedItemPressFn | null>;
}) {
  const { db } = useDB();

  const [loadedItem, setLoadedItem] = useState<DataTypeWithID<any> | null>(
    null,
  );
  const [loadedItemType, setLoadedItemType] = useState<string | null>(null);
  const loadItem = useCallback(async () => {
    try {
      const data = await db.find({
        use_index: 'index-field-actualRfidTagEpcMemoryBankContents',
        selector: {
          'data.actualRfidTagEpcMemoryBankContents': { $eq: item.epc },
        },
      });
      const doc = (data as any)?.docs && (data as any)?.docs[0];

      setLoadedItemType((doc as any).type || null);
      setLoadedItem(getDataFromDocs((doc as any).type, [doc])[0]);
    } catch (e) {
      // TODO: Handle other error
    }
  }, [db, item.epc]);
  useEffect(() => {
    loadItem();
  }, [loadItem]);

  if (loadedItem) {
    if (loadedItemType === 'item') {
      return (
        <ItemItem
          item={loadedItem as any}
          additionalDetails={item.rssi && `RSSI: ${item.rssi}`}
          arrow={false}
          onPress={
            onPressRef
              ? () => {
                  onPressRef.current &&
                    onPressRef.current(item, 'item', loadedItem.id || null);
                }
              : undefined
          }
        />
      );
    }

    // return (
    //   <InsetGroup.Item
    //     key={item.epc}
    //     label={loadedItem.name}
    //     vertical
    //     detail={[
    //       item.rssi && `RSSI: ${item.rssi}`,
    //       loadedItem.individualAssetReference &&
    //         `${loadedItem.individualAssetReference}`,
    //     ]
    //       .filter(s => s)
    //       .join(' | ')}
    //     leftElement={
    //       <AppIcon
    //         name="app-questionmark"
    //         style={styles.scannedItemIcon}
    //         size={30}
    //         showBackground
    //         backgroundPadding={4}
    //       />
    //     }
    //   />
    // );
  }

  return (
    <InsetGroup.Item
      key={item.epc}
      label={item.epc}
      vertical
      detail={[
        item.rssi && `RSSI: ${item.rssi}`,
        item.tid && `TID: ${item.tid}`,
      ]
        .filter(s => s)
        .join(', ')}
      leftElement={
        <AppIcon
          name="app-questionmark"
          style={styles.scannedItemIcon}
          size={30}
          showBackground
          backgroundPadding={4}
        />
      }
      onPress={
        onPressRef
          ? () => {
              onPressRef.current && onPressRef.current(item, null, null);
            }
          : undefined
      }
    />
  );
}

function ReaderIcon({
  color,
  size,
  opacity,
  isBluetooth,
  loading,
}: {
  color?: string;
  size?: number;
  opacity?: number;
  isBluetooth?: boolean;
  loading?: boolean;
}) {
  const { contentTextColor } = useColors();
  const c = color || contentTextColor;

  if (loading) {
    return <ActivityIndicator color={c} size={size} />;
  }

  return (
    <Icon
      name={isBluetooth ? 'bluetooth' : 'cellphone-wireless'}
      size={size || 16}
      color={c}
      style={[
        { opacity: opacity || 0.9 },
        isBluetooth ? { marginHorizontal: -2 } : { marginHorizontal: 1 },
      ]}
    />
  );
}

function BatteryIcon({
  color,
  size,
  opacity,
  percentage,
}: {
  color?: string;
  size?: number;
  opacity?: number;
  percentage?: number;
}) {
  const { contentTextColor } = useColors();
  const c = color || contentTextColor;
  const p = percentage ? Math.ceil(percentage / 10.0 - 0.5) : -10;
  let iconName = 'battery';
  if (p > -10 && p < 10) {
    if (p < 1) {
      iconName = 'battery-10';
    } else {
      iconName = `battery-${p}0`;
    }
  }
  return (
    <Icon
      name={iconName}
      size={size || 16}
      color={c}
      style={{ opacity: opacity || 0.9, transform: [{ rotate: '-90deg' }] }}
    />
  );
}

function DbmPowerIcon({
  color,
  size,
  opacity,
}: {
  color?: string;
  size?: number;
  opacity?: number;
  percentage?: number;
}) {
  const { contentTextColor } = useColors();
  const c = color || contentTextColor;

  return (
    <Icon
      name="access-point"
      size={size || 16}
      color={c}
      style={{ opacity: opacity || 0.9 }}
    />
  );
}

const styles = StyleSheet.create({
  modal: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.58,
    shadowRadius: 16.0,

    elevation: 24,
  },
  modalDarkMode: {
    borderWidth: 1 + StyleSheet.hairlineWidth,
    borderColor: '#eeeeee16',
    borderRadius: 12,
    marginHorizontal: -1 - StyleSheet.hairlineWidth,
  },
  sheetHandle: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  sheetUpperLinearGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 16,
  },
  sheetFooterBackgroundContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  sheetFooterBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetFooterLinearGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  sheetFooterContainer: {
    paddingHorizontal: 16,
  },
  actionButtonAndStatusTextContainer: {
    alignItems: 'stretch',
    paddingTop: 5,
  },
  actionButtonStatusText: {
    marginBottom: 8,
    marginTop: -8,
    opacity: 0.4,
    paddingHorizontal: 16,
    textAlign: 'center',
    fontSize: 12.8,
  },
  powerSliderContainer: {
    alignItems: 'center',
  },
  moreControlsContainer: {
    marginHorizontal: -4,
    height: 100,
    flexDirection: 'row',
  },
  secondaryButtonContainer: { width: 100, justifyContent: 'center' },
  readerDeviceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readerDeviceNameContainer: {
    opacity: 0.3,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  readerDeviceNameText: { fontSize: 14, fontWeight: '500' },
  readerStatusContainer: {
    opacity: 0.2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  readerStatusText: { fontSize: 12, fontWeight: '400' },
  controlsModelContent: {
    borderRadius: 8,
  },
  scannedItemIcon: { marginRight: -2 },
});

export default React.forwardRef(RFIDSheet);
