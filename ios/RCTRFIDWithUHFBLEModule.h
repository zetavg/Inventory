#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <AudioToolbox/AudioToolbox.h>
#import "RFIDBlutoothManager.h"

@interface RCTRFIDWithUHFBLEModule : RCTEventEmitter <RCTBridgeModule, FatScaleBluetoothManager> {
  NSMutableArray *getDeviceBatteryLevelResolveFns;
  NSMutableArray *getDeviceTemperatureResolveFns;
  
  NSMutableArray *scanDevicesData;
  double scanDevicesEventRate;
  double lastScanDevicesEventEmittedAt;
  NSString *searchForConnectToIdentifier;

  NSMutableArray *scanTagsData;
  double scanTagsEventRate;
  double lastScanTagsEventEmittedAt;
  
  NSMutableSet *scannedEpcs;
  BOOL soundEnabled;
}

@property (nonatomic, strong) NSTimer *untilPowerOnTimer;

@end
