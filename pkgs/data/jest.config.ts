import type { Config } from 'jest';
import { getJestBaseConfig } from 'jest-config-workspace';

const baseConfig = getJestBaseConfig({ dirname: __dirname });

const config: Config = {
  ...baseConfig,
};

export default config;
