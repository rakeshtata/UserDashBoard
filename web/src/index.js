import React from 'react';
import ReactDOM from 'react-dom';
import 'antd/dist/antd.css';
import Dashboard from './Dashboard';
import { Provider } from "jotai";
import { QueryClient, QueryClientProvider } from 'react-query'

const queryClient = new QueryClient()

ReactDOM.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider>
        <Dashboard />
      </Provider>
    </QueryClientProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
