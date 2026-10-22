/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  ...require("@repo/eslint-config/server.js"),
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        babelOptions: {
          parserOpts: {
            plugins: ["decorators-legacy"],
          },
        },
      },
    },
  },
];
