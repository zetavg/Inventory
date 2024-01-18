#import "RFIDBlutoothManager.h"
#import <AudioToolbox/AudioToolbox.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCTRFIDWithUHFBLEModule
    : RCTEventEmitter <RCTBridgeModule, FatScaleBluetoothManager> {

  NSMutableArray *getDeviceBatteryLevelResolveFns;
  NSMutableArray *getDeviceTemperatureResolveFns;

  NSMutableArray *scanDevicesData;
  double scanDevicesEventRate;
  double lastScanDevicesEventEmittedAt;
  NSString *searchForConnectToIdentifier;

  NSMutableArray *scanTagsData;
  double scanTagsEventRate;
  double lastScanTagsEventEmittedAt;

  BOOL working;
  BOOL isWaitingRead;
  NSTimer *readTimeoutTimer;
  NSMutableArray *readResolveFns;
  NSMutableArray *readRejectFns;
  BOOL isWaitingWrite;
  NSTimer *writeTimeoutTimer;
  NSMutableArray *writeResolveFns;
  NSMutableArray *writeRejectFns;
  BOOL isWaitingLock;
  NSTimer *lockTimeoutTimer;
  NSMutableArray *lockResolveFns;
  NSMutableArray *lockRejectFns;

  NSMutableSet *scannedEpcs;
  BOOL soundEnabled;
  NSMutableSet *playSoundOnlyForEpcs;

  BOOL scanIsLocate;
}

@property(nonatomic, strong) NSTimer *untilPowerOnTimer;

@end
