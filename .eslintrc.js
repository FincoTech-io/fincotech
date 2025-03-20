module.exports = {
  extends: 'next/core-web-vitals',
  rules: {
    // Allow route handlers to have unused parameters
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }]
  }
}; 