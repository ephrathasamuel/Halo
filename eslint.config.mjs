import reactPlugin from 'eslint-plugin-react';

export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      '.vercel/**',
      'public/**',
      'docs/**',
    ],
  },
  {
    files: ['**/*.js', '**/*.jsx', '**/*.mjs'],
    plugins: {
      react: reactPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'off',
      'no-console': 'off',
    },
  },
];
