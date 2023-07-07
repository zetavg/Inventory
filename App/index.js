import './ignore-logs';

import { AppRegistry, LogBox, Platform, UIManager } from 'react-native';
import { shim as rnQuickBase64Shim } from 'react-native-quick-base64';

import App from '@app/App';

// import StorybookUIRoot from '@app/StorybookUIRoot';
import { name as appName } from './app.json';

rnQuickBase64Shim();

// Polyfill (used by `pouchdb-mapreduce-utils` (promisedCallback), `pouchdb-mapreduce-no-ddocs` from `pouchdb-quick-search`)
process.nextTick = setImmediate;

require('events').EventEmitter.defaultMaxListeners = 32;

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    // Currently causes error "The specified child already has a parent. You must call removeView() on the child's parent first."
    UIManager.setLayoutAnimationEnabledExperimental(false);
  }
}

AppRegistry.registerComponent(appName, () => App);
// AppRegistry.registerComponent(appName, () => StorybookUIRoot);
