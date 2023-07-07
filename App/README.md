# Inventory

## Setup

See https://reactnative.dev/docs/environment-setup, select "React Native CLI Quickstart".

And, run `yarn install`.

## Develop

First, start Metro:

```bash
yarn start
```

### For iOS

1. `cp ios/config.xcconfig.sample ios/config.xcconfig` and modify the content of `ios/config.xcconfig` to fit your setup.
2. `open ios/Inventory.xcworkspace`.
3. In Xcode, select a scheme and target, then run.

### For Android

```bash
npx react-native run-android --appIdSuffix dev
```

## Build

### iOS

1. Setup iOS project by going through the steps in "Develop" "For iOS" section.
2. In Xcode, select a scheme and choose "Any iOS Device" as the target, then select "Product" → "Archive" from the app menu.
3. After the build is complete, the Organizer window will open (or select "Window" → "Organizer" from the app menu to open it). Select your archive and click "Distribute App" (or right-click on it and select "Show in Finder").

### Android

First, setup Gradle variables. Edit `~/.gradle/gradle.properties`, and add the following:

```
INVENTORY_APP_UPLOAD_STORE_FILE=/.../sample.keystore
INVENTORY_APP_UPLOAD_KEY_ALIAS=sample-key-alias
INVENTORY_APP_UPLOAD_STORE_PASSWORD=********
INVENTORY_APP_UPLOAD_KEY_PASSWORD=********
```

> Replace `sample.keystore`, `sample-key-alias` and `********` to fit your setup.
> If you do not have a signing key, you can generate one using `keytool`: `keytool -genkey -v -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000`

At last, run the following in a terminal:

```bash
cd android
./gradlew assembleRelease
```

The built APK file can be found at `android/app/build/outputs/apk/release/app-release.apk`. You can use `adb install -r path/to/app-release.apk` to install it on a connected device (use `adb -s <device_serial> install ...` if you have more than one device connected, use `adb devices` to list devices).
