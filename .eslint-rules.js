const path = require('path');

module.exports = {
  curly: 'off',
  'no-spaced-func': 'off',
  '@typescript-eslint/no-unused-vars': [
    'warn',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    },
  ],
  'simple-import-sort/imports': [
    'warn',
    {
      groups: [
        // Side effect imports.
        ['^\\u0000'],
        // `react` related packages.
        [
          '^react$',
          '^react-native$',
          '^@expo.*',
          '^redux$',
          '^@reduxjs.*',
          '^react-redux$',
          '^redux-persist.*',
          '@react-navigation.*',
          '^react-native.*',
          '^react.*',
        ],
        // Installed packages.
        require(path.join(__dirname, '.all-dependencies')).map(d => `^${d}`),
        // Internal packages.
        ['^@deps/.*'],
        ['^@[^a][^p][^p]\\w'],
        // @app
        ['^@app/logger.*'],
        ['^@app/consts.*'],
        ['^@app/lib.*'],
        ['^@app/redux.*', '^@app/features.*'],
        ['^@app/data.*'],
        ['^@app/db.*'],
        ['^@app/utils.*'],
        ['^@app/modules.*'],
        ['^@app/navigation.*'],
        ['^@app/screens.*'],
        ['^@app/hooks.*'],
        ['^@app/components.*'],
        ['^@app/theme.*', '^@app/images.*'],
        // Other packages.
        ['^@?\\w'],
        // Parent imports. Put `..` last.
        ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
        // Other relative imports. Put same-folder imports and `.` last.
        ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
      ],
    },
  ],
  'simple-import-sort/exports': 'warn',
};
