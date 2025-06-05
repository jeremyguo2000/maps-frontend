// eslint.config.js

import globals from "globals";
import pluginJs from "@eslint/js";
import { fixupConfigRules } from "@eslint/compat"; // This might still be useful for older plugins
import tsEslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import pluginPrettier from "eslint-plugin-prettier/recommended"; // This is a flat config object!

export default [
  // Prettier's recommended configuration (must be last to override other formatting rules)
  pluginPrettier, // <--- Add this as a direct item in the array

  {
    files: ["src/**/*.{js,jsx,ts,tsx}"], // Apply this config to these files
    languageOptions: {
      globals: {
        ...globals.browser, // Browser global variables (like `window`, `document`)
        ...globals.node,     // Node.js global variables (like `process`, `module`)
        google: "readonly" // <--- ADD THIS LINE to declare 'google' as a global variable
      },
      parser: tsEslint.parser, // The TypeScript parser
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json", // Still important for type-aware linting
        ecmaFeatures: {
          jsx: true // Enable JSX parsing
        }
      }
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "jsx-a11y": pluginJsxA11y,
      "@typescript-eslint": tsEslint.plugin,
      // prettier: pluginPrettier // You don't need to explicitly list it here if you include pluginPrettier directly
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      // fixupConfigRules might be necessary for plugins not yet fully migrated to flat config
      ...fixupConfigRules(pluginReact.configs.recommended).rules,
      ...fixupConfigRules(pluginReactHooks.configs.recommended).rules,
      ...fixupConfigRules(pluginJsxA11y.configs.recommended).rules,
      ...tsEslint.configs.recommended.rules,

      // Your custom rules:
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/display-name": "off",
      "react/jsx-key": "off"
    }
  }
];