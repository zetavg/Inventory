import {
  DeviceEventEmitter,
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';

import RFIDWithUHFBaseModule from './RFIDWithUHFBaseModule';
const { RFIDWithUHFBLEModule: NativeRFIDWithUHFBLEModule } = NativeModules;

const eventEmitter =
  Platform.OS === 'ios'
    ? new NativeEventEmitter(NativeRFIDWithUHFBLEModule)
    : DeviceEventEmitter;

export type DeviceConnectStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';

export type ScanDevicesData = {
  address: string;
  name: string;
  rssi: number;
};

type ScanDevicesOptions = {
  callback: (data: ScanDevicesData[]) => void;
  eventRate?: number;
  stopAfter?: number;
};

export type DeviceConnectStatusPayload = {
  status: DeviceConnectStatus;
  deviceName?: string;
  deviceAddress?: string;
};

const RFIDWithUHFBLEModule = {
  ...RFIDWithUHFBaseModule,
  NativeModule: NativeRFIDWithUHFBLEModule,
  _scanDevicesListener: null as any,
  scanDevices(enable: boolean, options: ScanDevicesOptions): Promise<void> {
    this._scanDevicesListener?.remove();

    this._scanDevicesListener = eventEmitter.addListener(
      'uhfDevicesScanData',
      d => {
        options.callback(d);
      },
    );
    if (enable) {
      setTimeout(() => {
        NativeRFIDWithUHFBLEModule.scanDevices(false, options.eventRate || 500);
      }, options.stopAfter || 1000 * 5);
    }

    // If this did not work, check if the location permission for this app is enabled
    // `ACCESS_FINE_LOCATION` is necessary because, on Android 11 and lower, a Bluetooth scan could potentially be used to gather information about the location of the user.
    return NativeRFIDWithUHFBLEModule.scanDevices(
      enable,
      options.eventRate || 500,
    );
  },
  addDeviceConnectStatusListener(
    callback: (payload: DeviceConnectStatusPayload) => void,
  ): EmitterSubscription {
    return eventEmitter.addListener('uhfDeviceConnectionStatus', callback);
  },
  connectDevice(address: string): Promise<void> {
    return NativeRFIDWithUHFBLEModule.connectDevice(address);
  },
  disconnectDevice(): Promise<void> {
    return NativeRFIDWithUHFBLEModule.disconnectDevice();
  },
  getDeviceConnectStatus(): Promise<DeviceConnectStatus> {
    return NativeRFIDWithUHFBLEModule.getDeviceConnectStatus();
  },
  getDeviceBatteryLevel: async (): Promise<number> => {
    return await new Promise(async resolve => {
      while (true) {
        const { value } =
          await NativeRFIDWithUHFBLEModule.getDeviceBatteryLevel();
        if (value <= 100 && value >= 0) {
          resolve(value);
          return;
        }
        await new Promise(r => setTimeout(r, 2000));
      }
    });
  },
  getDeviceTemperature: async (): Promise<number> => {
    const { value } = await NativeRFIDWithUHFBLEModule.getDeviceTemperature();
    return value;
  },
  triggerBeep: async (s: number): Promise<number> => {
    return NativeRFIDWithUHFBLEModule.triggerBeep(s);
  },
};

export default RFIDWithUHFBLEModule;
