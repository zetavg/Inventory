import { NativeModules } from 'react-native';

const { NSLinguisticTaggerModule } = NativeModules;

const LinguisticTaggerModuleIOS = {
  initTagger() {
    return NSLinguisticTaggerModule.initTagger();
  },
  cut(string: string): ReadonlyArray<string> {
    return NSLinguisticTaggerModule.cut(string);
  },
};

export default LinguisticTaggerModuleIOS;
