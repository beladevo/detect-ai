// Mock Chrome extension APIs
const chromeMock = {
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        if (callback) callback({});
        return Promise.resolve({});
      }),
      set: jest.fn((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn((message, callback) => {
      if (callback) callback({});
    }),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    lastError: null as { message?: string } | null,
  },
};

// @ts-expect-error - Mocking global chrome object
global.chrome = chromeMock;

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  chromeMock.runtime.lastError = null;
});

export { chromeMock };
