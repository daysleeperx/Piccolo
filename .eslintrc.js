module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': ['error'],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
        tsx: 'never',
      },
    ],
    "no-shadow": "off",
    "@typescript-eslint/no-shadow": ["error"],
    "no-console": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" , "destructuredArrayIgnorePattern": "^_"}],
    "operator-linebreak": ["error", "after"],
    "@typescript-eslint/no-namespace": "off",
    "no-return-assign": "off",
    "class-methods-use-this": ["error", { "exceptMethods": ["build", "generate"] }],
    "@typescript-eslint/no-empty-interface": "off",
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true
      },
    },
  },
};
