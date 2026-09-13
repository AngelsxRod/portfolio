import globals from 'globals';
import base from './base.js';

export default [
  ...base,
  {
    languageOptions: { globals: globals.node },
    rules: {
      // Nest necesita imports de valor para conservar metadatos de inyección.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
