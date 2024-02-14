module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['jest', 'simple-import-sort'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    requireConfigFile: false,
  },
  ignorePatterns: ['**/dist/*'],
  rules: {
    'prettier/prettier': [
      'warn',
      {
        singleQuote: true,
      },
    ],
    curly: 'off',
    'no-spaced-func': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    'simple-import-sort/imports': 'warn',
    'simple-import-sort/exports': 'warn',
  },
  overrides: [
    {
      files: [
        './**/.eslintrc.js',
        './**/babel.config.js',
        './**/metro.config.js',
      ],
      env: { node: true },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
