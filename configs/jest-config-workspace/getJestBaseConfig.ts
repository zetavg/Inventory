import { readFileSync } from 'fs';
import type { Config } from 'jest';
import JSON5 from 'json5';
import { resolve } from 'path';
import { pathsToModuleNameMapper } from 'ts-jest';

export const getJestBaseConfig = ({ dirname }: { dirname: string }): Config => {
  const tsConfig = JSON5.parse(
    readFileSync(resolve(dirname, 'tsconfig.json'), 'utf8'),
  );
  const { compilerOptions } = tsConfig;

  const config: Config = {
    preset: 'ts-jest',
    verbose: true,
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions?.paths || {}, {
      prefix: '<rootDir>/',
    }),
    transform: {
      // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
      // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
      '^.+\\.tsx?$': [
        'ts-jest',
        {
          // ts-jest options
          isolatedModules: true, // Disables type-checking when running tests
        },
      ],
    },
  };

  return config;
};

export default getJestBaseConfig;
