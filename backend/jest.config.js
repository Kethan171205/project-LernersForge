// jest.config.js — Jest configuration for the backend test suite
module.exports = {
  // Use Node environment (not browser/jsdom)
  testEnvironment: 'node',

  // Look for tests in the tests/ folder
  testMatch: ['**/tests/**/*.test.js'],

  // Show each individual test name in the output
  verbose: true,

  // Give each test file up to 15 seconds (integration tests start Express)
  testTimeout: 15000,

  // Clear mocks between tests so they don't bleed into each other
  clearMocks: true,
};
