#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
cd ..
cd ios
echo "Cocoapods version: $(pod --version)"
pod update hermes-engine --no-repo-update # It seems like you've changed the version of the dependency `hermes-engine` and it differs from the version stored in `Pods/Local Podspecs`. You should run `pod update hermes-engine --no-repo-update` to apply changes made locally. - IDK why commiting the updated Podfile.lock doesn't work, so we're doing this here
pod install
