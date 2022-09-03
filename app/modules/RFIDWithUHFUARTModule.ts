import { NativeModules } from 'react-native';
import RFIDWithUHFBaseModule from './RFIDWithUHFBaseModule';

const { RFIDWithUHFUARTModule: NativeRFIDWithUHFUARTModule } = NativeModules;

const RFIDWithUHFUARTModule = {
  ...RFIDWithUHFBaseModule,
  NativeModule: NativeRFIDWithUHFUARTModule,
  isPowerOn(): Promise<boolean> {
    return this.NativeModule.isPowerOn();
  },
};

export default RFIDWithUHFUARTModule;
