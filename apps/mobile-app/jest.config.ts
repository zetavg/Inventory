import type { Config } from 'jest';
import { getJestBaseConfig } from 'jest-config-workspace';

const baseConfig = getJestBaseConfig({ dirname: __dirname });

const config: Config = {
  ...baseConfig,
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/setup-jest.js'],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    // Force module uuid to resolve with the CJS entry point, because Jest does not support package.json.exports. See https://github.com/uuidjs/uuid/issues/451
    uuid: require.resolve('uuid'),
  },
};

export default config;
