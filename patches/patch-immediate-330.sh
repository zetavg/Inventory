#!/usr/bin/env bash

# Looks like immediate v3.3.0 is causing a "Possible Unhandled Promise
# Rejection: RangeError: Maximum call stack size exceeded." error.
# Letting it fallback to use "node_modules/immediate" (which is v3.0.6)
# seems to be working fine.
mv node_modules/websql/node_modules/immediate node_modules/websql/node_modules/immediate2 2>/dev/null
mv node_modules/@craftzdog/pouchdb-adapter-websql-core/node_modules/immediate node_modules/@craftzdog/pouchdb-adapter-websql-core/node_modules/immediate2 2>/dev/null
exit 0
