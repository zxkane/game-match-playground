module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  rules: {
    'no-empty-pattern': 'off'
  },
  overrides: [
    {
      files: ['amplify/data/**/*.js'],
      extends: 'plugin:@aws-appsync/base',
      plugins: ['@aws-appsync'],
      globals: {
        util: 'readonly',
        context: 'readonly'
      },
    }
  ]
}