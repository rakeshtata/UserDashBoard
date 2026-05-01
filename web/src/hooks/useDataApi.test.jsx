import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Provider } from 'jotai';
import { useUserApi, useAddUserApi } from './useDataApi';
import { GraphQLClient } from 'graphql-request';

jest.mock('graphql-request', () => ({
  GraphQLClient: jest.fn(),
  gql: (strings, ...values) => strings.reduce((acc, str, i) => acc + str + (values[i] || ''), ''),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const wrapper = ({ children }) => (
  <Provider>
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  </Provider>
);

describe('useDataApi Custom Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('useUserApi queries users successfully', async () => {
    const mockRequest = jest.fn().mockResolvedValue({
      users: [{ id: '1', name: 'John Doe', age: 30, gender: 'male' }]
    });
    
    GraphQLClient.mockImplementation(() => {
      return { request: mockRequest };
    });

    const { result } = renderHook(() => useUserApi(), { wrapper });

    await act(async () => {
       await result.current.mutateUser();
    });

    expect(mockRequest).toHaveBeenCalled();
  });

  it('useAddUserApi performs an add user mutation correctly', async () => {
    const mockRequest = jest.fn().mockResolvedValue({
       addUser: { id: '2', name: 'Jane', age: 25, gender: 'female' }
    });
    
    GraphQLClient.mockImplementation(() => {
      return { request: mockRequest };
    });

    const { result } = renderHook(() => useAddUserApi(), { wrapper });

    await act(async () => {
       await result.current.mutateAdd({ name: 'Jane', age: '25', gender: 'female' });
    });

    expect(mockRequest).toHaveBeenCalled();
    const queryArg = mockRequest.mock.calls[0][0];
    expect(queryArg).toContain('Jane');
    expect(queryArg).toContain('25');
    expect(queryArg).toContain('female');
  });
});
