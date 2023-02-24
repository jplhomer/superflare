module.exports = {
  extends: ["turbo", "prettier"],
  env: {
    es6: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {
    "react/jsx-key": "off",
  },
};
