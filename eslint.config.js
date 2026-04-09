import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off', // Allow require in server files
    },
  },
  // Node.js environment for server-side files
  {
    files: [
      'src/config.ts',
      'src/db/**/*.ts',
      'src/lib/**/*.ts',
      'src/mcp/**/*.ts',
      'src/routes/api.**.ts',
      'src/utils/crypto.ts',
      'src/utils/url-validation.ts',
      'src/entry-server.tsx'
    ],
    languageOptions: {
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        require: 'readonly',
        TextEncoder: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        AbortController: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
      },
    },
  },
  // Browser environment for client-side files
  {
    files: [
      'src/entry-client.tsx',
      'src/routes/**/*.tsx',
      'src/integrations/**/*.tsx'
    ],
    languageOptions: {
      globals: {
        document: 'readonly',
        window: 'readonly',
        fetch: 'readonly',
        React: 'readonly',
      },
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '.tanstack/**', 'src/paraglide/**'],
  },
]