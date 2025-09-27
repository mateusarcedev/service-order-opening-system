import { FlatCompat } from '@eslint/eslintrc'
import globals from 'globals'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({ baseDirectory: __dirname })

export default [
  { ignores: ['node_modules', 'dist', 'coverage', '.prisma', 'generated'] },

  ...compat.config({
    extends: ['@rocketseat/eslint-config/node'],
  }),

  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      'prettier/prettier': 'off',
    },
  },
]
