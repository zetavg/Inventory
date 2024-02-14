# Package Patches

## `websql`

It is patched to print debug logs if `global.getLogLevels` is a function and returns a array that includes `debug`:

## `@craftzdog/pouchdb-adapter-websql-core`

This package only provides ESM module, so it cannot be used in Node.js environments such as Jest. It will cause an `SyntaxError: Cannot use import statement outside a module` error when trying to import it.

To address this issue, we need to patch the package to export CommonJS module.

This is done by running the following in the package directory:

```bash
tsc src/* --outDir src-cjs --allowJs
jq '.main = "./src-cjs/index.js"' package.json > package.json.tmp && mv package.json.tmp package.json
jq '.module = "./src/index.js"' package.json > package.json.tmp && mv package.json.tmp package.json
```
