#import "RCTNativeEventEmitterModule.h"

@implementation RCTNativeEventEmitterModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(emitAppLoaded)
{
  [[NSNotificationCenter defaultCenter] postNotificationName:@"appLoaded" object:nil];
}

@end
