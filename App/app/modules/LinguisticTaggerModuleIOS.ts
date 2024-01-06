import { NativeModules } from 'react-native';

import { PUNCTUATION_REGEX } from '@app/consts/chars';

const { NSLinguisticTaggerModule } = NativeModules;

const LinguisticTaggerModuleIOS = {
  initTagger() {
    if (NSLinguisticTaggerModule) {
      return NSLinguisticTaggerModule.initTagger();
    }
  },
  cut(string: string): ReadonlyArray<string> {
    if (NSLinguisticTaggerModule) {
      return NSLinguisticTaggerModule.cut(string);
    } else {
      return string.split(PUNCTUATION_REGEX).filter(s => !!s);
    }
  },
};

export default LinguisticTaggerModuleIOS;
