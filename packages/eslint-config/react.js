import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import base from './base.js';

export default [
  ...base,
  {
    plugins: { 'react-hooks': reactHooks },
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: reactHooks.configs.flat.recommended.rules,
  },
];
