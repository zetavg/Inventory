#!/usr/bin/env bash
#
# Compile pouchdb-adapter-websql-core so that it can be required in repl.ts,
# fixes "SyntaxError: Cannot use import statement outside a module".

set -e
cd "$(dirname "$0")"
cd ..

if [ ! -d "node_modules/@craftzdog/pouchdb-adapter-websql-core/src_compiled" ]; then
  echo "compiling pouchdb-adapter-websql-core"
  sed s#./src/index.js#./src_compiled/index.js#g node_modules/@craftzdog/pouchdb-adapter-websql-core/package.json > node_modules/@craftzdog/pouchdb-adapter-websql-core/package.json-patched
  rm -rf node_modules/@craftzdog/pouchdb-adapter-websql-core/package.json
  mv node_modules/@craftzdog/pouchdb-adapter-websql-core/package.json-patched node_modules/@craftzdog/pouchdb-adapter-websql-core/package.json
  node_modules/.bin/tsc node_modules/@craftzdog/pouchdb-adapter-websql-core/src/* --outDir node_modules/@craftzdog/pouchdb-adapter-websql-core/src_compiled --allowJs > /dev/null || true
else
  echo "pouchdb-adapter-websql-core already compiled"
fi
