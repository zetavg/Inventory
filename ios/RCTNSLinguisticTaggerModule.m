#import "RCTNSLinguisticTaggerModule.h"

@implementation RCTNSLinguisticTaggerModule

RCT_EXPORT_MODULE(NSLinguisticTaggerModule);

- (void)initTaggerIfNeeded
{
  if (!taggerOptions) {
    taggerOptions = NSLinguisticTaggerOmitWhitespace | NSLinguisticTaggerOmitPunctuation | NSLinguisticTaggerJoinNames;
  }
  if (!tagger) {
    tagger = [[NSLinguisticTagger alloc] initWithTagSchemes: [NSLinguisticTagger availableTagSchemesForLanguage:@"en"] options:taggerOptions];
  }
}

RCT_EXPORT_METHOD(initTagger)
{
  [self initTaggerIfNeeded];
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(cut:(NSString *)str)
{
  [self initTaggerIfNeeded];

  tagger.string = str;
  
  NSMutableArray *words = [NSMutableArray array];

  [tagger enumerateTagsInRange:NSMakeRange(0, [str length])
                        scheme:NSLinguisticTagSchemeNameTypeOrLexicalClass
                       options:taggerOptions
                    usingBlock:^(NSString *tag, NSRange tokenRange, NSRange sentenceRange, BOOL *stop) {
    NSString *token = [str substringWithRange:tokenRange];
    // NSLog(@"enumerateTagsInRange - %@: %@", token, tag);
    [words addObject:token];
  }];
  
  return words;
}

@end
