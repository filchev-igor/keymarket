import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettier from 'eslint-config-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2023, globals: globals.browser },
    plugins: { react, 'react-refresh': reactRefresh },
    settings: { react: { version: 'detect' } },
    rules: {
      // Fast refresh only works when a file exports components (constants are fine).
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Components, hooks and helpers are arrow functions: `export const Name = () => { ... }`.
      'react/function-component-definition': [
        'error',
        { namedComponents: 'arrow-function', unnamedComponents: 'arrow-function' },
      ],
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
    },
  },
  // Must stay last: turns off every formatting rule that would fight with Prettier.
  prettier,
])
