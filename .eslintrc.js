/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'standard',
    'prettier',
    'prettier/@typescript-eslint',
    'prettier/standard'
  ],
  plugins: ['unicorn', 'standard', '@typescript-eslint', 'prettier'],
  env: {
    node: true,
    es2020: true
  },
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module' // Allows for the use of imports
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    'no-use-before-define': 'off',

    // TypeScript has this functionality by default:
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { args: 'all', argsIgnorePattern: '^_' }],

    /**********************/
    /*   Unicorn Rules    */
    /**********************/

    // Pass error message when throwing errors
    'unicorn/error-message': 'error',

    // Uppercase regex escapes
    'unicorn/escape-case': 'error',

    // Array.isArray instead of instanceof
    'unicorn/no-array-instanceof': 'error',

    // Prevent deprecated `new Buffer()`
    'unicorn/no-new-buffer': 'error',

    // Keep regex literals safe!
    'unicorn/no-unsafe-regex': 'off',

    // Lowercase number formatting for octal, hex, binary (0x12 instead of 0X12)
    'unicorn/number-literal-case': 'error',

    // ** instead of Math.pow()
    'unicorn/prefer-exponentiation-operator': 'error',

    // includes over indexOf when checking for existence
    'unicorn/prefer-includes': 'error',

    // String methods startsWith/endsWith instead of more complicated stuff
    'unicorn/prefer-starts-ends-with': 'error',

    // textContent instead of innerText
    'unicorn/prefer-text-content': 'error',

    // Enforce throwing type error when throwing error while checking typeof
    'unicorn/prefer-type-error': 'error',

    // Use new when throwing error
    'unicorn/throw-new-error': 'error'
  }
}
