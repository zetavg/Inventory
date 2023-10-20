# Inventory

An RFID asset management solution for home and business.

With an inventory combined with the help of RFID technology, it'll be a breeze to track item availability, prevent loss, and locate them when needed. [See a demo video here on YouTube](https://bit.ly/inventory-demo-yt).

![](https://github.com/zetavg/Inventory/assets/3784687/9647b3cf-4b6d-4385-9059-eb7b85e2e2df)


## Get Inventory

The Inventory iOS/Android app is the mandatory tool we provide for asset tracking and management.

* **iOS TestFlight**: Join via https://testflight.apple.com/join/aXKHypal.
* **Android APK Download**: Please check the `.apk` assets in the [latest release](https://github.com/zetavg/Inventory/releases).

> To leverage the complete functionality of the app, a compatible RFID UHF reader is needed. See a list of the currently supported devices [in the documentation here](https://docs.inventory.z72.io/rfid-hardware/supported-rfid-devices).

Here are some guides for you to get started: [Get Started Guides](https://docs.inventory.z72.io/get-started/setup).


## Documents

See documents on [https://docs.inventory.z72.io](https://docs.inventory.z72.io).


## Development

The majority of the codebase is written in TypeScript, employing React Native to build the mobile app. Java and Objective-C native modules are used for handling UART/Bluetooth communications with RFID devices, and other heavy-lifting tasks such as supporting index build for full-text searching. 

For more details on each project component, check the following directories:

* `App/` - the React Native iOS/Android app.
* `Data/` - data schema and data logic.
* `packages/` - other shared modules.


## Get In Touch

* Telegram Channel: https://t.me/inventory_app.
* Telegram Group: https://t.me/inventory_app_discussions.
