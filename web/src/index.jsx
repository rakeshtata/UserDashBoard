import React from 'react';
import ReactDOM from 'react-dom';
import 'antd/dist/antd.css';
import Dashboard from './Dashboard';
import Login from './pages/Login';
import { Provider } from "jotai";
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAtomValue } from 'jotai/utils';
import { authAtom } from './store/authStore';

const queryClient = new QueryClient()

const ProtectedRoute = ({ children }) => {
  const token = useAtomValue(authAtom);
  return token ? children : <Navigate to="/login" />;
};

ReactDOM.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </Provider>
    </QueryClientProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
