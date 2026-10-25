// Mock localStorage and sessionStorage for tests
const createStorageMock = () => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i) => Object.keys(store)[i] ?? null,
  };
};

const localStorageMock = createStorageMock();
const sessionStorageMock = createStorageMock();

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true, configurable: true });
}
if (typeof globalThis.sessionStorage === 'undefined') {
  Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorageMock, writable: true, configurable: true });
}

if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    localStorage: localStorageMock,
    sessionStorage: sessionStorageMock,
    location: { pathname: '/' },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}
