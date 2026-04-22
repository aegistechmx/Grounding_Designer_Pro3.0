// src/setupTests.js
import '@testing-library/jest-dom';

// Mock para console.error en tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (args[0]?.includes('Warning: ReactDOM.render is no longer supported')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
