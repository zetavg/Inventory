/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const fs = require('fs');
const JSON5 = require('json5');
const path = require('path');

const tsConfig = JSON5.parse(
  fs.readFileSync(path.resolve(__dirname, 'tsconfig.json'), 'utf8'),
);
const { compilerOptions } = tsConfig;

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false, // https://github.com/facebook/react-native/issues/31969#issuecomment-977827296
      },
    }),
  },
  resolver: {
    resolverMainFields: ['sbmodern', 'react-native', 'browser', 'main'],
  },
  watchFolders: [
    path.resolve(__dirname, '../../node_modules'),
    ...(compilerOptions?.paths && !process.env.RN_DISABLE_TS_PATHS
      ? Object.values(compilerOptions?.paths).flatMap(folders => [
          path.resolve(__dirname, folders[0] || ''),
          path.resolve(__dirname, folders[0] || '', '..', 'node_modules'),
        ])
      : []
    ).filter(folder => fs.existsSync(folder)),
  ],
};
