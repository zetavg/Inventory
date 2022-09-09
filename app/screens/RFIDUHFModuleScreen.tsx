import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ScrollView,
  View,
  Switch,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import ModalSelector from 'react-native-modal-selector';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import { usePersistedState } from '@app/hooks/usePersistedState';
import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';

import { MemoryBank, ScanData } from '@app/modules/RFIDWithUHFBaseModule';
import RFIDWithUHFUARTModule from '@app/modules/RFIDWithUHFUARTModule';
import RFIDWithUHFBLEModule, {
  DeviceConnectStatus,
  DeviceConnectStatusPayload,
  ScanDevicesData,
} from '@app/modules/RFIDWithUHFBLEModule';

import useColors from '@app/hooks/useColors';
import commonStyles from '@app/utils/commonStyles';
import useScrollTo from '@app/hooks/useScrollTo';
import useNumberInputChangeHandler from '@app/hooks/useNumberInputChangeHandler';

const DEFAULTS = {
  FILTER_BIT_OFFSET: 32,
  FILTER_BIT_COUNT: 16,
} as const;

const MEMORY_BANK_SELECTOR_DATA = [
  { key: 'RESERVED', label: 'RESERVED' },
  { key: 'EPC', label: 'EPC' },
  { key: 'TID', label: 'TID' },
  { key: 'USER', label: 'USER' },
];

function RFIDUHFModuleScreen({
  navigation,
}: StackScreenProps<StackParamList, 'RFIDUHFModule'>) {
  const { iosTintColor } = useColors();
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollTo = useScrollTo(scrollViewRef);

  /////////////////////////////
  // RFID Device Type Select //
  /////////////////////////////

  const [useBuiltInReader, setUseBuiltInReader] = useState(false);

  const deviceTypeSelectUi = useMemo(
    () => (
      <InsetGroup label="Device Type">
        <InsetGroup.Item
          label="Use Built-in Reader"
          detail={
            <Switch
              value={useBuiltInReader}
              onChange={() => setUseBuiltInReader(v => !v)}
            />
          }
        />
      </InsetGroup>
    ),
    [useBuiltInReader],
  );

  const RFIDWithUHFModule = useBuiltInReader
    ? RFIDWithUHFUARTModule
    : RFIDWithUHFBLEModule;

  ///////////////////////////////
  // Search and Connect Device //
  ///////////////////////////////

  // const [uhfInitStatus, setUhfInitStatus] = useState('N/A');

  const [deviceConnectionStatus, setDeviceConnectionStatus] =
    useState<DeviceConnectStatusPayload | null>(null);
  const receiveConnectStatusChange = useCallback(
    (payload: DeviceConnectStatusPayload) => {
      setDeviceConnectionStatus(payload);
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

  const [scanDevicesData, setScanDevicesData] = useState<
    Record<string, ScanDevicesData>
  >({});
  const receiveScanDeviceData = useCallback((d: ScanDevicesData[]) => {
    setScanDevicesData(data => ({
      ...data,
      ...Object.fromEntries(d.map(dd => [dd.address, dd])),
    }));
  }, []);
  const scanDevices = useCallback(async () => {
    setScanDevicesData({});
    RFIDWithUHFBLEModule.scanDevices(true, { callback: receiveScanDeviceData });
  }, [receiveScanDeviceData]);
  const stopScanDevices = useCallback(async () => {
    RFIDWithUHFBLEModule.scanDevices(false, {
      callback: receiveScanDeviceData,
    });
  }, [receiveScanDeviceData]);
  const clearScanDevicesData = useCallback(async () => {
    setScanDevicesData({});
  }, []);

  const prevDeviceConnectionStatus = useRef<DeviceConnectStatusPayload | null>(
    null,
  );
  const [prevConnectedDeviceAddress, setPrevConnectedDeviceAddress] =
    usePersistedState<null | string>(
      'devtools-rfid-prevConnectedDeviceAddress',
      null,
    );
  useEffect(() => {
    if (
      deviceConnectionStatus?.status ===
      prevDeviceConnectionStatus.current?.status
    )
      return;

    if (
      deviceConnectionStatus?.status === 'CONNECTED' &&
      prevDeviceConnectionStatus.current?.status !== 'CONNECTED'
    ) {
      if (deviceConnectionStatus?.deviceAddress) {
        stopScanDevices();
        setPrevConnectedDeviceAddress(deviceConnectionStatus?.deviceAddress);
        clearScanDevicesData();
      }
    }

    prevDeviceConnectionStatus.current = deviceConnectionStatus;
  }, [
    clearScanDevicesData,
    deviceConnectionStatus,
    setPrevConnectedDeviceAddress,
    stopScanDevices,
  ]);
  const prevConnectedDeviceAddressRef = useRef(prevConnectedDeviceAddress);
  prevConnectedDeviceAddressRef.current = prevConnectedDeviceAddress;
  useEffect(() => {
    const timer = setTimeout(() => {
      if (useBuiltInReader) return;
      if (!prevConnectedDeviceAddressRef.current) return;
      RFIDWithUHFBLEModule.connectDevice(prevConnectedDeviceAddressRef.current);
    }, 500 /* wait for persisted state to load */);

    return () => {
      clearTimeout(timer);
    };
  }, [useBuiltInReader]);

  const [beepS, setBeepS] = useState<number | null>(500);
  const handleBeepSChangeText = useNumberInputChangeHandler(setBeepS);

  const searchAndConnectDeviceUi = useMemo(
    () => (
      <>
        <InsetGroup label="Connect RFID Reader">
          <InsetGroup.Item
            label="Status"
            detail={deviceConnectionStatus?.status || 'N/A'}
          />
          <InsetGroup.ItemSeperator />
          {deviceConnectionStatus?.deviceName && (
            <>
              <InsetGroup.Item
                label="Deivce Name"
                vertical2
                detail={deviceConnectionStatus?.deviceName}
              />
              <InsetGroup.ItemSeperator />
            </>
          )}
          {deviceConnectionStatus?.deviceAddress && (
            <>
              <InsetGroup.Item
                label="Deivce Address"
                vertical2
                detail={deviceConnectionStatus?.deviceAddress}
              />
              <InsetGroup.ItemSeperator />
            </>
          )}
          {deviceConnectionStatus?.status !== 'DISCONNECTED' && (
            <>
              <InsetGroup.Item
                button
                label="Disconnect"
                onPress={() => RFIDWithUHFBLEModule.disconnectDevice()}
              />
              <InsetGroup.ItemSeperator />
            </>
          )}
          {deviceConnectionStatus?.status !== 'CONNECTED' &&
            prevConnectedDeviceAddress && (
              <>
                <InsetGroup.Item
                  button
                  label="Re-connect"
                  onPress={() =>
                    RFIDWithUHFBLEModule.connectDevice(
                      prevConnectedDeviceAddress,
                    )
                  }
                />
                <InsetGroup.ItemSeperator />
              </>
            )}
          <InsetGroup.Item button label="Search" onPress={scanDevices} />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            button
            label="Stop Search"
            onPress={stopScanDevices}
          />
          <InsetGroup.ItemSeperator />
          {Object.values(scanDevicesData).length <= 0 && (
            <InsetGroup.Item
              disabled
              label={'Press "Search" to search devices'}
            />
          )}
          {Object.values(scanDevicesData).length > 0 && (
            <>
              <InsetGroup.Item
                button
                label="Clear List"
                onPress={clearScanDevicesData}
              />
              <InsetGroup.ItemSeperator />
            </>
          )}
          {Object.values(scanDevicesData)
            .flatMap(d => [
              <InsetGroup.Item
                key={d.address}
                label={d.name || d.address}
                vertical
                detail={[d.address, d.rssi && `RSSI: ${d.rssi}`]
                  .filter(s => s)
                  .join(', ')}
                onPress={() => RFIDWithUHFBLEModule.connectDevice(d.address)}
              />,
              <InsetGroup.ItemSeperator key={`s-${d.address}`} />,
            ])
            .slice(0, -1)}
        </InsetGroup>
        <InsetGroup label="Device Status">
          <InsetGroup.Item
            button
            label="Get Connect Status"
            onPress={async () => {
              try {
                const result =
                  await RFIDWithUHFBLEModule.getDeviceConnectStatus();
                Alert.alert('Result', result);
              } catch (e: any) {
                Alert.alert('Error', e.message);
              }
            }}
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            button
            label="Get Battery Level"
            onPress={async () => {
              try {
                const result =
                  await RFIDWithUHFBLEModule.getDeviceBatteryLevel();
                Alert.alert('Result', result.toString());
              } catch (e: any) {
                Alert.alert('Error', e.message);
              }
            }}
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            button
            label="Get Temperature"
            onPress={async () => {
              try {
                const result =
                  await RFIDWithUHFBLEModule.getDeviceTemperature();
                Alert.alert('Result', result.toString());
              } catch (e: any) {
                Alert.alert('Error', e.message);
              }
            }}
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            button
            label="Get Temperature"
            onPress={async () => {
              try {
                const result =
                  await RFIDWithUHFBLEModule.getDeviceTemperature();
                Alert.alert('Result', result.toString());
              } catch (e: any) {
                Alert.alert('Error', e.message);
              }
            }}
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            label="Beep S"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="500"
                value={beepS?.toString()}
                onChangeText={handleBeepSChangeText}
              />
            }
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            button
            label="Trigger Beep"
            onPress={async () => {
              try {
                await RFIDWithUHFBLEModule.triggerBeep(beepS || 500);
              } catch (e: any) {
                Alert.alert('Error', e.message);
              }
            }}
          />
        </InsetGroup>
      </>
    ),
    [
      beepS,
      clearScanDevicesData,
      deviceConnectionStatus?.deviceAddress,
      deviceConnectionStatus?.deviceName,
      deviceConnectionStatus?.status,
      handleBeepSChangeText,
      prevConnectedDeviceAddress,
      scanDevices,
      scanDevicesData,
      stopScanDevices,
    ],
  );

  /////////////////
  // Init / Free //
  /////////////////

  const [uhfInitStatus, setUhfInitStatus] = useState('N/A');

  const initUhf = useCallback(async () => {
    try {
      setUhfInitStatus('Initializing...');
      await RFIDWithUHFUARTModule.init();
      setUhfInitStatus('Initialized');
    } catch (e: any) {
      setUhfInitStatus(`Error: ${e?.message}`);
    }
  }, []);

  const freeUhf = useCallback(async () => {
    try {
      setUhfInitStatus('Freeing...');
      await RFIDWithUHFUARTModule.free();
      setUhfInitStatus('Freed');
    } catch (e: any) {
      setUhfInitStatus(`Error: ${e?.message}`);
    }
  }, []);

  const isPowerOn = useCallback(async () => {
    try {
      const result = await RFIDWithUHFUARTModule.isPowerOn();
      Alert.alert('isPowerOn', result.toString());
    } catch (e: any) {
      Alert.alert('isPowerOn Error', e?.message);
    }
  }, []);

  const isWorking = useCallback(async () => {
    try {
      const result = await RFIDWithUHFUARTModule.isWorking();
      Alert.alert('isWorking', result.toString());
    } catch (e: any) {
      Alert.alert('isWorking Error', e?.message);
    }
  }, []);

  const initFreeUi = useMemo(
    () => (
      <InsetGroup label="Device Status">
        <InsetGroup.Item button label="Init" onPress={initUhf} />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item button label="Free" onPress={freeUhf} />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item label="Status" detail={uhfInitStatus} />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item button label="Is Power On?" onPress={isPowerOn} />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item button label="Is Working?" onPress={isWorking} />
      </InsetGroup>
    ),
    [freeUhf, initUhf, isPowerOn, isWorking, uhfInitStatus],
  );

  useEffect(() => {
    if (!useBuiltInReader) return;

    initUhf();
    return () => {
      freeUhf();
    };
  }, [freeUhf, initUhf, useBuiltInReader]);

  ///////////////////
  // Shared Config //
  ///////////////////

  const [power, setPower] = useState<null | number>(28);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const handleChangePowerText = useCallback((text: string) => {
    const number = parseInt(text, 10);
    setPower(Number.isNaN(number) ? null : number);
  }, []);
  const toggleSoundEnabled = useCallback(() => {
    setSoundEnabled(enabled => !enabled);
  }, []);

  const [enableFilter, setEnableFilter] = usePersistedState(
    'devtools-rfid-enableFilter',
    false,
  );
  const [filterMemoryBank, setFilterMemoryBank] = usePersistedState<MemoryBank>(
    'devtools-rfid-filterMemoryBank',
    'EPC',
  );
  const [filterBitOffset, setFilterBitOffset] = usePersistedState<
    null | number
  >('devtools-rfid-filterBitOffset', DEFAULTS.FILTER_BIT_OFFSET);
  const [filterBitCount, setFilterBitCount] = usePersistedState<null | number>(
    'devtools-rfid-filterBitCount',
    DEFAULTS.FILTER_BIT_COUNT,
  );
  const [filterData, setFilterData] = usePersistedState(
    'devtools-rfid-filterData',
    '',
  );
  const toggleFilterEnabled = useCallback(() => {
    setEnableFilter(enabled => !enabled);
  }, [setEnableFilter]);
  const handleChangeFilterBitOffsetText = useCallback(
    (text: string) => {
      const number = parseInt(text, 10);
      setFilterBitOffset(Number.isNaN(number) ? null : number);
    },
    [setFilterBitOffset],
  );
  const handleChangeFilterBitCountText = useCallback(
    (text: string) => {
      const number = parseInt(text, 10);
      setFilterBitCount(Number.isNaN(number) ? null : number);
    },
    [setFilterBitCount],
  );
  const handleChangeFilterDataText = useCallback(
    (data: string) => {
      setFilterData(data.toLowerCase());
    },
    [setFilterData],
  );

  const sharedConfigUi = useMemo(
    () => (
      <InsetGroup
        label="Shared Config"
        footerLabel={
          enableFilter
            ? 'While filtering with EPC, the offset should be 32 while the count being a mutiple of 8, for example, "0000" with count set to 16.'
            : ''
        }
      >
        <InsetGroup.Item
          label="Power"
          detail={
            <InsetGroup.TextInput
              alignRight
              keyboardType="number-pad"
              placeholder="0"
              value={power?.toString()}
              onChangeText={handleChangePowerText}
            />
          }
        />
        <InsetGroup.ItemSeperator />
        {/*Not useful, can't set power during scan anyway*/}
        {/*<InsetGroup.Item
          button
          label="Set Power"
          disabled={!power}
          onPress={async () => {
            if (!power) return;
            try {
              await RFIDWithUHFBLEModule.setPower(power);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          }}
        />
        <InsetGroup.ItemSeperator />*/}
        <InsetGroup.Item
          label="Sound"
          detail={<Switch value={soundEnabled} onChange={toggleSoundEnabled} />}
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item
          label="Filter"
          detail={
            <Switch value={enableFilter} onChange={toggleFilterEnabled} />
          }
        />
        {enableFilter && (
          <>
            <InsetGroup.ItemSeperator />
            <InsetGroup.Item
              label="Filter Memory Bank"
              detail={
                <ModalSelector
                  data={MEMORY_BANK_SELECTOR_DATA}
                  onChange={option => {
                    setFilterMemoryBank(option.key as any);
                  }}
                >
                  <InsetGroup.TextInput
                    alignRight
                    placeholder="EPC"
                    value={filterMemoryBank}
                    // onChangeText={setReadMemoryBank}
                  />
                </ModalSelector>
              }
            />
            <InsetGroup.ItemSeperator />
            <InsetGroup.Item
              label="Filter Bit Offset (ptr)"
              detail={
                <InsetGroup.TextInput
                  alignRight
                  keyboardType="number-pad"
                  placeholder={DEFAULTS.FILTER_BIT_OFFSET.toString()}
                  value={filterBitOffset?.toString()}
                  onChangeText={handleChangeFilterBitOffsetText}
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
                  placeholder={DEFAULTS.FILTER_BIT_COUNT.toString()}
                  value={filterBitCount?.toString()}
                  onChangeText={handleChangeFilterBitCountText}
                />
              }
            />
            <InsetGroup.ItemSeperator />
            <InsetGroup.Item
              label="Filter Data"
              detail={
                <InsetGroup.TextInput
                  alignRight
                  placeholder="0000"
                  value={filterData}
                  onChangeText={handleChangeFilterDataText}
                />
              }
            />
          </>
        )}
      </InsetGroup>
    ),
    [
      power,
      handleChangePowerText,
      soundEnabled,
      toggleSoundEnabled,
      enableFilter,
      toggleFilterEnabled,
      filterMemoryBank,
      filterBitOffset,
      handleChangeFilterBitOffsetText,
      filterBitCount,
      handleChangeFilterBitCountText,
      filterData,
      handleChangeFilterDataText,
      setFilterMemoryBank,
    ],
  );

  ///////////////
  // Scan Tags //
  ///////////////

  const [scanRate, setScanRate] = usePersistedState<null | number>(
    'devtools-rfid-scanRate',
    30,
  );
  const [scanCallbackRate, setScanCallbackRate] = usePersistedState<
    null | number
  >('devtools-rfid-scanCallbackRate', 128);
  const handleChangeScanRateText = useCallback(
    (text: string) => {
      const number = parseInt(text, 10);
      setScanRate(Number.isNaN(number) ? null : number);
    },
    [setScanRate],
  );
  const handleChangeScanCallbackRateText = useCallback(
    (text: string) => {
      const number = parseInt(text, 10);
      setScanCallbackRate(Number.isNaN(number) ? null : number);
    },
    [setScanCallbackRate],
  );
  const [uhfScanStatus, setUhfScanStatus] = useState('N/A');
  const [scannedData, setScannedData] = useState<Record<string, ScanData>>({});
  const [scannedDataCount, setScannedDataCount] = useState(0);

  const receiveUhfScanData = useCallback((d: ScanData[]) => {
    setScannedData(data => ({
      ...data,
      ...Object.fromEntries(d.map(dd => [dd.epc, dd])),
    }));
    setScannedDataCount(c => c + d.length);
  }, []);

  const scannedDataRef = useRef<View>(null);

  const startScan = useCallback(async () => {
    try {
      setUhfScanStatus('Starting scan...');
      await RFIDWithUHFModule.startScan({
        power: power || 1,
        soundEnabled,
        callback: receiveUhfScanData,
        scanRate: scanRate || 30,
        eventRate: scanCallbackRate || 128,
        filter: enableFilter
          ? {
              memoryBank: filterMemoryBank,
              bitOffset: filterBitOffset || DEFAULTS.FILTER_BIT_OFFSET,
              bitCount: filterBitCount || DEFAULTS.FILTER_BIT_COUNT,
              data: filterData,
            }
          : undefined,
      });
      setUhfScanStatus('Scanning');
    } catch (e: any) {
      setUhfScanStatus(`Error: ${e?.message}`);
    }
  }, [
    RFIDWithUHFModule,
    power,
    soundEnabled,
    receiveUhfScanData,
    scanRate,
    scanCallbackRate,
    enableFilter,
    filterMemoryBank,
    filterBitOffset,
    filterBitCount,
    filterData,
  ]);

  const stopScan = useCallback(async () => {
    try {
      setUhfScanStatus('Stopping scan...');
      await RFIDWithUHFModule.stopScan();
      setUhfScanStatus('Scan stopped');
    } catch (e: any) {
      setUhfScanStatus(`Error: ${e?.message}`);
    }
  }, [RFIDWithUHFModule]);

  const scannedDataUniqueCount = Object.keys(scannedData).length;
  const prevScannedDataUniqueCount = useRef(0);
  useEffect(() => {}, [scannedDataUniqueCount]);

  const clearScannedData = useCallback(async () => {
    setScannedData({});
    setScannedDataCount(0);
    prevScannedDataUniqueCount.current = 0;
    await RFIDWithUHFModule.clearScannedTags();
  }, [RFIDWithUHFModule]);

  useEffect(() => {
    if (scannedDataUniqueCount > 5) return;
    if (scannedDataUniqueCount === prevScannedDataUniqueCount.current) return;

    const timer = setTimeout(() => {
      scrollTo(scannedDataRef);
    }, 100);
    prevScannedDataUniqueCount.current = scannedDataUniqueCount;

    return () => {
      clearTimeout(timer);
    };
  }, [scannedDataUniqueCount, scrollTo]);

  const scanTagsUi = useMemo(
    () => (
      <>
        <InsetGroup label="Scan Tags">
          <InsetGroup.Item
            label="Scan Rate"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="30"
                keyboardType="number-pad"
                value={scanRate?.toString()}
                onChangeText={handleChangeScanRateText}
              />
            }
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            label="Scan Callback Rate"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="128"
                keyboardType="number-pad"
                value={scanCallbackRate?.toString()}
                onChangeText={handleChangeScanCallbackRateText}
              />
            }
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item button label="Start Scan" onPress={startScan} />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item button label="Stop Scan" onPress={stopScan} />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item label="Status" detail={uhfScanStatus} />
        </InsetGroup>

        <InsetGroup
          ref={scannedDataRef}
          label="Scanned Data"
          labelRight={
            Object.values(scannedData).length > 0 ? (
              <TouchableOpacity onPress={clearScannedData}>
                <Text
                  style={{
                    fontSize: InsetGroup.GROUP_LABEL_FONT_SIZE,
                    color: iosTintColor,
                  }}
                >
                  Clear
                </Text>
              </TouchableOpacity>
            ) : undefined
          }
        >
          {Object.values(scannedData).length > 0 ? (
            <>
              <InsetGroup.Item label="All Count" detail={scannedDataCount} />
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item
                label="Unique Count"
                detail={Object.keys(scannedData).length.toString()}
              />
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item
                button
                label="Clear"
                onPress={clearScannedData}
              />
              <InsetGroup.ItemSeperator />
              {Object.values(scannedData)
                .flatMap(d => [
                  <InsetGroup.Item
                    key={d.epc}
                    label={d.epc}
                    vertical
                    detail={[
                      d.rssi && `RSSI: ${d.rssi}`,
                      d.tid && `TID: ${d.tid}`,
                    ]
                      .filter(s => s)
                      .join(', ')}
                    onPress={() => setLocateEpc(d.epc)}
                  />,
                  <InsetGroup.ItemSeperator key={`s-${d.epc}`} />,
                ])
                .slice(0, -1)}
            </>
          ) : (
            <InsetGroup.Item disabled label="No Data" />
          )}
        </InsetGroup>
      </>
    ),
    // setLocateEpc is not needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      clearScannedData,
      handleChangeScanCallbackRateText,
      handleChangeScanRateText,
      iosTintColor,
      scanCallbackRate,
      scanRate,
      scannedData,
      scannedDataCount,
      // setLocateEpc,
      startScan,
      stopScan,
      uhfScanStatus,
    ],
  );

  ////////////////
  // Locate Tag //
  ////////////////

  const [locateStatus, setLocateStatus] = useState('N/A');
  const [locateEpc, setLocateEpc] = usePersistedState(
    'devtools-rfid-locateEpc',
    '',
  );
  const [locateValue, setLocateValue] = useState(0);

  const receiveLocateValue = useCallback((value: number) => {
    setLocateValue(value);
  }, []);

  const startLocate = useCallback(async () => {
    try {
      setLocateStatus('Starting locate...');
      await RFIDWithUHFModule.startLocate({
        epc: locateEpc,
        power: power || 1,
        soundEnabled,
        callback: receiveLocateValue,
      });
      setLocateStatus('Locating');
    } catch (e: any) {
      setLocateStatus(`Error: ${e?.message}`);
    }
  }, [RFIDWithUHFModule, locateEpc, power, soundEnabled, receiveLocateValue]);

  const stopLocate = useCallback(async () => {
    try {
      setLocateStatus('Stopping locate...');
      await RFIDWithUHFModule.stopScan();
      setLocateStatus('Locate stopped');
    } catch (e: any) {
      setLocateStatus(`Error: ${e?.message}`);
    }
  }, [RFIDWithUHFModule]);

  const locateTagUi = useMemo(
    () => (
      <InsetGroup label="Locate Tag">
        <InsetGroup.Item
          vertical2
          label="EPC"
          detail={
            <InsetGroup.TextInput
              value={locateEpc}
              placeholder="FEDCBA98765432101234567800000001"
              onChangeText={setLocateEpc}
            />
          }
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item label="Status" detail={locateStatus} />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item button label="Start Locate" onPress={startLocate} />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item button label="Stop Locate" onPress={stopLocate} />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item label="Value" detail={locateValue} />
      </InsetGroup>
    ),
    [
      locateEpc,
      locateStatus,
      locateValue,
      setLocateEpc,
      startLocate,
      stopLocate,
    ],
  );

  //////////////
  // Read Tag //
  //////////////

  const [readPower, setReadPower] = useState<null | number>(10);
  const [readMemoryBank, setReadMemoryBank] = usePersistedState<MemoryBank>(
    'devtools-rfid-readMemoryBank',
    'EPC',
  );
  const [readOffset, setReadOffset] = usePersistedState<number | null>(
    'devtools-rfid-readOffset',
    2,
  );
  const [readCount, setReadCount] = usePersistedState<number | null>(
    'devtools-rfid-readCount',
    6,
  );
  const [readAccessPassword, setReadAccessPassword] = usePersistedState(
    'devtools-rfid-readAccessPassword',
    '00000000',
  );
  const [readData, setReadData] = useState('');
  const handleChangeReadPowerText = useCallback((text: string) => {
    const number = parseInt(text, 10);
    setReadPower(Number.isNaN(number) ? null : number);
  }, []);
  const handleChangeReadMemoryBank = useCallback(
    (v: string | { key: string }) => {
      const memoryBank = typeof v === 'string' ? v : v.key;
      setReadMemoryBank(memoryBank as MemoryBank);

      switch (memoryBank) {
        case 'RESERVED':
          setReadOffset(0);
          setReadCount(4);
          break;

        case 'EPC':
          setReadOffset(2);
          setReadCount(6);
          break;
      }
    },
    [setReadCount, setReadMemoryBank, setReadOffset],
  );
  const handleChangeReadOffsetText = useCallback(
    (text: string) => {
      const number = parseInt(text, 10);
      setReadOffset(Number.isNaN(number) ? null : number);
    },
    [setReadOffset],
  );
  const handleChangeReadCountText = useCallback(
    (text: string) => {
      const number = parseInt(text, 10);
      setReadCount(Number.isNaN(number) ? null : number);
    },
    [setReadCount],
  );
  const read = useCallback(async () => {
    try {
      const data = await RFIDWithUHFModule.read({
        power: readPower || 1,
        soundEnabled,
        memoryBank: readMemoryBank || 'EPC',
        accessPassword: readAccessPassword || '00000000',
        offset: readOffset || 2,
        count: readCount || 6,
        filter: enableFilter
          ? {
              memoryBank: filterMemoryBank,
              bitOffset: filterBitOffset || DEFAULTS.FILTER_BIT_OFFSET,
              bitCount: filterBitCount || DEFAULTS.FILTER_BIT_COUNT,
              data: filterData,
            }
          : undefined,
      });
      setReadData(data);
    } catch (e: any) {
      setReadData('');
    }
  }, [
    RFIDWithUHFModule,
    readPower,
    soundEnabled,
    readMemoryBank,
    readAccessPassword,
    readOffset,
    readCount,
    enableFilter,
    filterMemoryBank,
    filterBitOffset,
    filterBitCount,
    filterData,
  ]);

  const readTagUi = useMemo(
    () => (
      <InsetGroup label="Read Tag">
        <InsetGroup.Item
          label="Power"
          detail={
            <InsetGroup.TextInput
              alignRight
              keyboardType="number-pad"
              placeholder="0"
              value={readPower?.toString()}
              onChangeText={handleChangeReadPowerText}
            />
          }
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item
          label="Memory Bank"
          detail={
            <ModalSelector
              data={MEMORY_BANK_SELECTOR_DATA}
              onChange={handleChangeReadMemoryBank}
            >
              <InsetGroup.TextInput
                alignRight
                placeholder="EPC"
                value={readMemoryBank}
                // onChangeText={setReadMemoryBank}
              />
            </ModalSelector>
          }
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item
          label="Offset (ptr)"
          detail={
            <InsetGroup.TextInput
              alignRight
              placeholder="2"
              keyboardType="number-pad"
              value={readOffset?.toString()}
              onChangeText={handleChangeReadOffsetText}
            />
          }
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item
          label="Count (len)"
          detail={
            <InsetGroup.TextInput
              alignRight
              placeholder="6"
              keyboardType="number-pad"
              value={readCount?.toString()}
              onChangeText={handleChangeReadCountText}
            />
          }
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item
          label="Access Password"
          detail={
            <InsetGroup.TextInput
              alignRight
              placeholder="00000000"
              value={readAccessPassword}
              onChangeText={setReadAccessPassword}
            />
          }
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item button label="Read" onPress={read} />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item vertical2 label="Data" detail={readData} />
      </InsetGroup>
    ),
    [
      readPower,
      handleChangeReadPowerText,
      handleChangeReadMemoryBank,
      readMemoryBank,
      readOffset,
      handleChangeReadOffsetText,
      readCount,
      handleChangeReadCountText,
      readAccessPassword,
      setReadAccessPassword,
      read,
      readData,
    ],
  );

  ///////////////
  // Write Tag //
  ///////////////

  const [writePower, setWritePower] = useState<null | number>(8);
  const [writeMemoryBank, setWriteMemoryBank] = usePersistedState<MemoryBank>(
    'devtools-rfid-writeMemoryBank',
    'EPC',
  );
  const [writeOffset, setWriteOffset] = usePersistedState<number | null>(
    'devtools-rfid-writeOffset',
    2,
  );
  const [writeCount, setWriteCount] = usePersistedState<number | null>(
    'devtools-rfid-writeCount',
    6,
  );
  const [writeAccessPassword, setWriteAccessPassword] = usePersistedState(
    'devtools-rfid-writeAccessPassword',
    '00000000',
  );
  const [writeData, setWriteData] = usePersistedState(
    'devtools-rfid-writeData',
    '',
  );
  const handleChangeWritePowerText = useCallback((text: string) => {
    const number = parseInt(text, 10);
    setWritePower(Number.isNaN(number) ? null : number);
  }, []);
  const handleChangeWriteMemoryBank = useCallback(
    (v: string | { key: string }) => {
      const memoryBank = typeof v === 'string' ? v : v.key;
      setWriteMemoryBank(memoryBank as MemoryBank);

      switch (memoryBank) {
        case 'RESERVED':
          setWriteOffset(0);
          setWriteCount(4);
          break;

        case 'EPC':
          setWriteOffset(2);
          setWriteCount(6);
          break;
      }
    },
    [setWriteCount, setWriteMemoryBank, setWriteOffset],
  );
  const handleChangeWriteOffsetText = useCallback(
    (text: string) => {
      const number = parseInt(text, 10);
      setWriteOffset(Number.isNaN(number) ? null : number);
    },
    [setWriteOffset],
  );
  const handleChangeWriteCountText = useCallback(
    (text: string) => {
      const number = parseInt(text, 10);
      setWriteCount(Number.isNaN(number) ? null : number);
    },
    [setWriteCount],
  );
  const write = useCallback(async () => {
    try {
      await RFIDWithUHFModule.write({
        power: writePower || 1,
        soundEnabled,
        memoryBank: writeMemoryBank || 'EPC',
        accessPassword: writeAccessPassword || '00000000',
        offset: writeOffset || 2,
        count: writeCount || 6,
        data: writeData,
        filter: enableFilter
          ? {
              memoryBank: filterMemoryBank,
              bitOffset: filterBitOffset || DEFAULTS.FILTER_BIT_OFFSET,
              bitCount: filterBitCount || DEFAULTS.FILTER_BIT_COUNT,
              data: filterData,
            }
          : undefined,
      });
    } catch (e: any) {
      console.warn(e);
    }
  }, [
    RFIDWithUHFModule,
    writePower,
    soundEnabled,
    writeMemoryBank,
    writeAccessPassword,
    writeOffset,
    writeCount,
    writeData,
    enableFilter,
    filterMemoryBank,
    filterBitOffset,
    filterBitCount,
    filterData,
  ]);

  const writeTagUi = useMemo(
    () => (
      <InsetGroup label="Write Tag">
        <InsetGroup.Item
          label="Power"
          detail={
            <InsetGroup.TextInput
              alignRight
              keyboardType="number-pad"
              placeholder="0"
              value={writePower?.toString()}
              onChangeText={handleChangeWritePowerText}
            />
          }
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item
          label="Memory Bank"
          detail={
            <ModalSelector
              data={MEMORY_BANK_SELECTOR_DATA}
              onChange={handleChangeWriteMemoryBank}
            >
              <InsetGroup.TextInput
                alignRight
                placeholder="EPC"
                value={writeMemoryBank}
                // onChangeText={setWriteMemoryBank}
              />
            </ModalSelector>
          }
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item
          label="Offset (ptr)"
          detail={
            <InsetGroup.TextInput
              alignRight
              placeholder="2"
              keyboardType="number-pad"
              value={writeOffset?.toString()}
              onChangeText={handleChangeWriteOffsetText}
            />
          }
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item
          label="Count (len)"
          detail={
            <InsetGroup.TextInput
              alignRight
              placeholder="6"
              keyboardType="number-pad"
              value={writeCount?.toString()}
              onChangeText={handleChangeWriteCountText}
            />
          }
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item
          label="Access Password"
          detail={
            <InsetGroup.TextInput
              alignRight
              placeholder="00000000"
              value={writeAccessPassword}
              onChangeText={setWriteAccessPassword}
            />
          }
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item
          vertical2
          label="Data"
          detail={
            <InsetGroup.TextInput
              placeholder={Array.from(new Array(writeCount))
                .map(_ => '0000')
                .join('')}
              value={writeData}
              onChangeText={setWriteData}
            />
          }
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item button label="Write" onPress={write} />
      </InsetGroup>
    ),
    [
      writePower,
      handleChangeWritePowerText,
      handleChangeWriteMemoryBank,
      writeMemoryBank,
      writeOffset,
      handleChangeWriteOffsetText,
      writeCount,
      handleChangeWriteCountText,
      writeAccessPassword,
      setWriteAccessPassword,
      writeData,
      setWriteData,
      write,
    ],
  );

  //////////////
  // Lock Tag //
  //////////////

  const [lockPower, setLockPower] = useState<null | number>(8);
  const [lockAccessPassword, setLockAccessPassword] = usePersistedState(
    'devtools-rfid-lockAccessPassword',
    '00000000',
  );
  const [lockCode, setLockCode] = usePersistedState(
    'devtools-rfid-lockCode',
    '0a82a0',
  );
  const handleChangeLockPowerText = useCallback((text: string) => {
    const number = parseInt(text, 10);
    setLockPower(Number.isNaN(number) ? null : number);
  }, []);
  const lock = useCallback(async () => {
    try {
      await RFIDWithUHFModule.lock({
        power: lockPower || 1,
        soundEnabled,
        accessPassword: lockAccessPassword || '00000000',
        code: lockCode || '0a82a0',
        filter: enableFilter
          ? {
              memoryBank: filterMemoryBank,
              bitOffset: filterBitOffset || DEFAULTS.FILTER_BIT_OFFSET,
              bitCount: filterBitCount || DEFAULTS.FILTER_BIT_COUNT,
              data: filterData,
            }
          : undefined,
      });
    } catch (e: any) {
      console.warn(e);
    }
  }, [
    RFIDWithUHFModule,
    lockPower,
    soundEnabled,
    lockAccessPassword,
    lockCode,
    enableFilter,
    filterMemoryBank,
    filterBitOffset,
    filterBitCount,
    filterData,
  ]);

  const lockTagUi = useMemo(
    () => (
      <InsetGroup
        label="Lock Tag"
        footerLabel={
          'Tips: Use the Read/Write functionality on the RESERVED bank to get/set the password (8 hex digits of kill password + 8 hex digits of access password, e.g. for "00abcdef12345678", kill password is "00abcdef" and access password is "12345678").'
        }
      >
        <InsetGroup.Item
          label="Power"
          detail={
            <InsetGroup.TextInput
              alignRight
              keyboardType="number-pad"
              placeholder="0"
              value={lockPower?.toString()}
              onChangeText={handleChangeLockPowerText}
            />
          }
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item
          label="Access Password"
          detail={
            <InsetGroup.TextInput
              alignRight
              placeholder="00000000"
              value={lockAccessPassword}
              onChangeText={setLockAccessPassword}
            />
          }
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item
          vertical2
          label="Code"
          detail={
            <InsetGroup.TextInput
              placeholder="0a82a0"
              value={lockCode}
              onChangeText={setLockCode}
            />
          }
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item button label="Lock" onPress={lock} />
      </InsetGroup>
    ),
    [
      lockPower,
      handleChangeLockPowerText,
      lockAccessPassword,
      setLockAccessPassword,
      lockCode,
      setLockCode,
      lock,
    ],
  );

  ////////////////////////
  // Write and Lock Tag //
  ////////////////////////

  const [writeAndLockStatus, setWriteAndLockStatus] = useState('N/A');
  const [writeAndLockPower, setWriteAndLockPower] = useState<null | number>(8);
  const [writeAndLockData, setWriteAndLockData] = usePersistedState(
    'devtools-rfid-writeAndLockData',
    '',
  );
  const [writeAndLockNewAccessPassword, setWriteAndLockNewAccessPassword] =
    usePersistedState('devtools-rfid-writeAndLockNewAccessPassword', '');
  const handleChangeWriteAndLockPowerText = useCallback((text: string) => {
    const number = parseInt(text, 10);
    setWriteAndLockPower(Number.isNaN(number) ? null : number);
  }, []);
  const writeAndLock = useCallback(async () => {
    try {
      await RFIDWithUHFModule.writeEpcAndLock(
        writeAndLockData || '0000',
        writeAndLockNewAccessPassword || '12345678',
        {
          power: writeAndLockPower || 1,
          oldAccessPassword: '00000000',
          soundEnabled,
          reportStatus: setWriteAndLockStatus,
          filter: enableFilter
            ? {
                memoryBank: filterMemoryBank,
                bitOffset: filterBitOffset || DEFAULTS.FILTER_BIT_OFFSET,
                bitCount: filterBitCount || DEFAULTS.FILTER_BIT_COUNT,
                data: filterData,
              }
            : undefined,
        },
      );
    } catch (e: any) {
      console.warn(e);
    }
  }, [
    RFIDWithUHFModule,
    writeAndLockData,
    writeAndLockNewAccessPassword,
    writeAndLockPower,
    soundEnabled,
    enableFilter,
    filterMemoryBank,
    filterBitOffset,
    filterBitCount,
    filterData,
  ]);
  const unlockAndReset = useCallback(async () => {
    try {
      await RFIDWithUHFModule.resetEpcAndUnlock(
        writeAndLockNewAccessPassword || '12345678',
        {
          power: writeAndLockPower || 1,
          soundEnabled,
          reportStatus: setWriteAndLockStatus,
          filter: enableFilter
            ? {
                memoryBank: filterMemoryBank,
                bitOffset: filterBitOffset || DEFAULTS.FILTER_BIT_OFFSET,
                bitCount: filterBitCount || DEFAULTS.FILTER_BIT_COUNT,
                data: filterData,
              }
            : undefined,
        },
      );
    } catch (e: any) {
      console.warn(e);
    }
  }, [
    RFIDWithUHFModule,
    writeAndLockNewAccessPassword,
    writeAndLockPower,
    soundEnabled,
    enableFilter,
    filterMemoryBank,
    filterBitOffset,
    filterBitCount,
    filterData,
  ]);

  const writeAndLockUi = useMemo(
    () => (
      <InsetGroup
        label="Write and Lock"
        footerLabel={
          'This is the high-level API of writing tag data, for normal write and lock operations, use the "Write Tag" and "Lock Tag" functionalities. "Write and Lock" writes the EPC to the tag, and locks it with the access password, "Unlock and Reset" will use the access password to unlock the tag and writes the EPC as "0000".'
        }
      >
        <InsetGroup.Item
          label="Power"
          detail={
            <InsetGroup.TextInput
              alignRight
              keyboardType="number-pad"
              placeholder="0"
              value={writeAndLockPower?.toString()}
              onChangeText={handleChangeWriteAndLockPowerText}
            />
          }
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item
          label="Access Password"
          detail={
            <InsetGroup.TextInput
              alignRight
              placeholder="12345678"
              value={writeAndLockNewAccessPassword}
              onChangeText={setWriteAndLockNewAccessPassword}
            />
          }
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item
          vertical2
          label="EPC"
          detail={
            <InsetGroup.TextInput
              placeholder="0000"
              value={writeAndLockData}
              onChangeText={setWriteAndLockData}
            />
          }
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item button label="Write and Lock" onPress={writeAndLock} />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item
          button
          label="Unlock and Reset"
          onPress={unlockAndReset}
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item label="Status" detail={writeAndLockStatus} />
      </InsetGroup>
    ),
    [
      writeAndLockPower,
      handleChangeWriteAndLockPowerText,
      writeAndLockNewAccessPassword,
      setWriteAndLockNewAccessPassword,
      writeAndLockData,
      setWriteAndLockData,
      writeAndLock,
      unlockAndReset,
      writeAndLockStatus,
    ],
  );

  ///////////
  // Sound //
  ///////////

  const soundUi = useMemo(
    () => (
      <InsetGroup label="Sound">
        <InsetGroup.Item
          button
          label="Play Success Sound"
          onPress={() => RFIDWithUHFModule.playSound('success')}
        />
        <InsetGroup.ItemSeperator />
        <InsetGroup.Item
          button
          label="Play Error Sound"
          onPress={() => RFIDWithUHFModule.playSound('error')}
        />
      </InsetGroup>
    ),
    [RFIDWithUHFModule],
  );

  return (
    <ScreenContent navigation={navigation} title="RFID UHF Module">
      <ScrollView keyboardDismissMode="interactive" ref={scrollViewRef}>
        <View style={commonStyles.mt16} />
        {deviceTypeSelectUi}
        {!useBuiltInReader && searchAndConnectDeviceUi}
        {useBuiltInReader && initFreeUi}
        {sharedConfigUi}
        {scanTagsUi}
        {writeAndLockUi}
        {locateTagUi}
        {readTagUi}
        {writeTagUi}
        {lockTagUi}
        {soundUi}
      </ScrollView>
    </ScreenContent>
  );
}

export default RFIDUHFModuleScreen;
