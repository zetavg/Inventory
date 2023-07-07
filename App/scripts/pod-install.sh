#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
cd ..
cd ios
pod install
