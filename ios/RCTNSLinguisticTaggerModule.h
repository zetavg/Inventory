#import <React/RCTBridgeModule.h>
@interface RCTNSLinguisticTaggerModule : NSObject <RCTBridgeModule> {
  NSLinguisticTaggerOptions taggerOptions;
  NSLinguisticTagger *tagger;
}

@end
