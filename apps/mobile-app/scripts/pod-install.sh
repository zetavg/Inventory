#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
cd ..
cd ios
echo "Cocoapods version: $(pod --version)"
pod install
