module.exports = {
  extends: ["@workspace/eslint-config/base"],
  env: {
    node: true,
    es2023: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {},
};
