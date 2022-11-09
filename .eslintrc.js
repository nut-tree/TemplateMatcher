module.exports = {
  rules: {
    semi: ['error', 'always'],
    quotes: ['error', 'single'],
  },
  extends: 'eslint:recommended',
  env: {
    commonjs: true,
    es2020: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 12,
  },
};
