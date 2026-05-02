import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider, useAtomValue } from "jotai";
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authAtom } from './store/authStore';
import { Spin } from 'antd';

const Dashboard = lazy(() => import('./Dashboard'));
const Login = lazy(() => import('./pages/Login'));

const queryClient = new QueryClient()

const ProtectedRoute = ({ children }) => {
  const token = useAtomValue(authAtom);
  return token ? children : <Navigate to="/login" />;
};

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider>
        <BrowserRouter>
          <Suspense fallback={<div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" /></div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </Provider>
    </QueryClientProvider>
  </React.StrictMode>
);
