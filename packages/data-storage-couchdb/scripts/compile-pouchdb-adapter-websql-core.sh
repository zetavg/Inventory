#!/usr/bin/env bash
#
# Compile pouchdb-adapter-websql-core so that it can be required in repl.ts,
# fixes "SyntaxError: Cannot use import statement outside a module".

set -e
cd "$(dirname "$0")"
cd ..

if [ ! -f "node_modules/@craftzdog/pouchdb-adapter-websql-core/compiled.txt" ]; then
  echo "compiling pouchdb-adapter-websql-core"
  node_modules/.bin/tsc node_modules/@craftzdog/pouchdb-adapter-websql-core/src/* --outDir node_modules/@craftzdog/pouchdb-adapter-websql-core/lib --allowJs > /dev/null || true
  mv node_modules/@craftzdog/pouchdb-adapter-websql-core/src node_modules/@craftzdog/pouchdb-adapter-websql-core/src_orig
  mv node_modules/@craftzdog/pouchdb-adapter-websql-core/lib node_modules/@craftzdog/pouchdb-adapter-websql-core/src
  touch node_modules/@craftzdog/pouchdb-adapter-websql-core/compiled.txt
else
  echo "pouchdb-adapter-websql-core already compiled"
fi
