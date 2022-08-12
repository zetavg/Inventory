/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import App from '@app/App';
// import StorybookUIRoot from '@app/StorybookUIRoot';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
// AppRegistry.registerComponent(appName, () => StorybookUIRoot);

LogBox.ignoreLogs([
  'Require cycle: node_modules/react-native-paper/src/components/Appbar',
  'Require cycle: node_modules/pouch-db-utils/lib/index-browser.js',
]);
