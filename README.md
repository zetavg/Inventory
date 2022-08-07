# Inventory

## Setup

See https://reactnative.dev/docs/environment-setup, "React Native CLI Quickstart".

## Develop

First, start Metro:

```bash
yarn start
```

### For Android

```bash
npx react-native run-android
```

## Build

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

The built APK file can be found at `android/app/build/outputs/apk/release/app-release.apk`
