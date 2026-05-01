import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'jotai';
import Login from './index';
// Avoid warnings from antd matchMedia or mock properties if any

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

global.fetch = jest.fn();

describe('Login Page Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (ui) => render(
    <Provider>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </Provider>
  );

  it('renders login form properly', () => {
    const { getByPlaceholderText } = renderWithProviders(<Login />);
    expect(getByPlaceholderText('Username (Admin)')).toBeInTheDocument();
    expect(getByPlaceholderText('Password (password)')).toBeInTheDocument();
  });

  it('submits form correctly and redirects on success', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'fake-jwt' }),
    });

    const { getByPlaceholderText, getByRole } = renderWithProviders(<Login />);
    
    // Simulate user typing
    fireEvent.change(getByPlaceholderText('Username (Admin)'), { target: { value: 'Admin' } });
    fireEvent.change(getByPlaceholderText('Password (password)'), { target: { value: 'password' } });
    
    // Submit form
    fireEvent.click(getByRole('button', { name: /Secure Login/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost/auth/login', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'Admin', password: 'password' })
      }));
    });

    // Check redirection
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  // it('shows error state when login fails', async () => {
  //   global.fetch.mockResolvedValueOnce({
  //     ok: false,
  //   });

  //   const { getByPlaceholderText, getByRole } = renderWithProviders(<Login />);
    
  //   fireEvent.change(getByPlaceholderText('Username (Admin)'), { target: { value: 'WrongUser' } });
  //   fireEvent.change(getByPlaceholderText('Password (password)'), { target: { value: 'WrongPass' } });
    
  //   fireEvent.click(getByRole('button', { name: /Secure Login/i }));

  //   await waitFor(() => {
  //      expect(global.fetch).toHaveBeenCalled();
  //      expect(mockNavigate).not.toHaveBeenCalled();
  //   });
  // });
});
