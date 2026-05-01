import { renderHook, act } from '@testing-library/react-hooks';
import { useAtom, useSetAtom } from 'jotai';
import { Provider } from 'jotai';
import { authAtom, loginAtom, logoutAtom } from './authStore';
import React from 'react';

// Wrapper to provide a fresh Jotai store for each test
const TestProvider = ({ children }) => <Provider>{children}</Provider>;

describe('authStore', () => {
  let localStorageMock;

  beforeEach(() => {
    localStorageMock = (() => {
      let store = {};
      return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => {
          store[key] = value.toString();
        }),
        removeItem: jest.fn(key => {
          delete store[key];
        }),
        clear: jest.fn(() => {
          store = {};
        })
      };
    })();

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loginAtom sets the auth token and updates localStorage', () => {
    const { result } = renderHook(() => ({
      auth: useAtom(authAtom),
      login: useSetAtom(loginAtom),
    }), { wrapper: TestProvider });

    act(() => {
      result.current.login('fake-jwt-token');
    });

    expect(result.current.auth[0]).toBe('fake-jwt-token');
    expect(localStorage.setItem).toHaveBeenCalledWith('jwt_token', 'fake-jwt-token');
  });

  it('logoutAtom clears the auth token and removes it from localStorage', () => {
    const { result } = renderHook(() => ({
      auth: useAtom(authAtom),
      login: useSetAtom(loginAtom),
      logout: useSetAtom(logoutAtom),
    }), { wrapper: TestProvider });

    // First login
    act(() => {
      result.current.login('test-token-to-remove');
    });
    expect(result.current.auth[0]).toBe('test-token-to-remove');

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.auth[0]).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith('jwt_token');
  });
});
