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
2. `yarn run pod-install`.
3. `open ios/Inventory.xcworkspace`.
4. In Xcode, select a scheme and target, then run.

### For Android

```bash
yarn run android
```

## Build

### iOS

1. Setup iOS project by going through the steps in "Develop" "For iOS" section.
2. In Xcode, select a scheme and choose "Any iOS Device" as the target, then select "Product" → "Archive" from the app menu.
3. After the build is complete, the Organizer window will open (or select "Window" → "Organizer" from the app menu to open it). Select your archive and click "Distribute App" (or right-click on it and select "Show in Finder").

#### Using Fastlane

To use Fastlane, you'll need to install Fastlane by running `bundle install` in the `ios` directory. Also, App Store Connect API keys have to be set up in `config.xcconfig`.

The following Fastlane lanes are available, which can be run in the `ios` directory:

* Build a Nightly build and upload it to TestFlight: `bundle exec fastlane nightly`.
* Build and upload to App Store Connect: `bundle exec fastlane release`.

To automatically set the changelog on App Store Connect for the uploaded build, write the changelog in `./changelog.txt` before running the lane.

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
