# ESLint Config

This package provides some shared ESLint configurations for all workspaces.

## Usage

```bash
yarn add eslint-config-workspace 'eslint@*' --dev
```

Then, add the following to your `.eslintrc.js`:

```js
module.exports = {
  root: true,
  extends: ['workspace/base'],
};
```

## Available Configurations

### `workspace/base`

The base configuration across all workspaces.
