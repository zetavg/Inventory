/**
 * @format
 */

import 'react-native-get-random-values';
import { shim as rnQuickBase64Shim } from 'react-native-quick-base64';

import { AppRegistry, LogBox, Platform, UIManager } from 'react-native';
import App from '@app/App';
// import StorybookUIRoot from '@app/StorybookUIRoot';
import { name as appName } from './app.json';

rnQuickBase64Shim();

require('events').EventEmitter.defaultMaxListeners = 32;

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

AppRegistry.registerComponent(appName, () => App);
// AppRegistry.registerComponent(appName, () => StorybookUIRoot);

LogBox.ignoreLogs([
  'Unhandled promise rejection RangeError: Maximum call stack size exceeded (native stack depth)',
  "AsyncStorage has been extracted from react-native core and will be removed in a future release. It can now be installed and imported from '@react-native-async-storage/async-storage' instead of 'react-native'. See https://github.com/react-native-async-storage/async-storage",
  'Could not find Fiber with id',
  'Non-serializable values were found in the navigation state.',
  'Require cycle: node_modules/react-native-paper/src/components/Appbar',
  'Require cycle: node_modules/pouchdb-utils/lib/index-browser.js',
  'Require cycle: node_modules/@craftzdog/pouchdb-adapter-websql-core',
  'Require cycle: node_modules/pouchdb-find/node_modules/pouchdb-utils/lib/index-browser.js',
  'Require cycle: node_modules/pouchdb-selector-core/node_modules/pouchdb-utils/lib/index-browser.js',
  'node_modules/pouchdb-abstract-mapreduce/node_modules/pouchdb-utils/lib/index-browser.js',
]);
