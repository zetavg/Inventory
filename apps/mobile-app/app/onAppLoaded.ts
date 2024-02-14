import { NativeModules } from 'react-native';

let onAppLoadedCalled = false;

export default function onAppLoaded() {
  if (onAppLoadedCalled) return;

  onAppLoadedCalled = true;

  // Signal native code that app has loaded, so the native side can do things so such as fade out the launch screen.
  NativeModules.NativeEventEmitterModule?.emitAppLoaded?.();
}
