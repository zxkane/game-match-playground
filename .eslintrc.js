module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  rules: {
    'no-empty-pattern': 'off'
  },
  overrides: [
    {
      files: ['amplify/data/**/*.js'],
      plugins: ['@aws-appsync'],
      globals: {
        util: 'readonly',
        context: 'readonly'
      },
      parserOptions: {
        ecmaVersion: 2018
      },
      rules: {
        '@aws-appsync/no-async': 'error',
        '@aws-appsync/no-await': 'error',
        '@aws-appsync/no-classes': 'error',
        '@aws-appsync/no-for': 'error',
        '@aws-appsync/no-continue': 'error',
        '@aws-appsync/no-generators': 'error',
        '@aws-appsync/no-yield': 'error',
        '@aws-appsync/no-labels': 'error',
        '@aws-appsync/no-this': 'error',
        '@aws-appsync/no-try': 'error',
        '@aws-appsync/no-while': 'error',
        '@aws-appsync/no-disallowed-unary-operators': 'error',
        '@aws-appsync/no-disallowed-binary-operators': 'error',
        '@aws-appsync/no-promise': 'error'
      }
    }
  ]
}
