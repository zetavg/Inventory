# Jest Config

This package provides some shared Jest configurations for all projects in the workspace.

## Usage

```bash
yarn add jest-config-workspace 'jest@*' '@types/jest@*' --dev
```

Then, add the following to your `jest.config.ts`:

```ts
import type { Config } from 'jest';
import { getJestBaseConfig } from 'jest-config-workspace';

const baseConfig = getJestBaseConfig({ dirname: __dirname });

const config: Config = {
  ...baseConfig,
};

export default config;
```
