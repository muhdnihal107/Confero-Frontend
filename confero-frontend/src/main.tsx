import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools/production';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId='1092656538511-9g9vtc7715g4gsm088tjjiac7ksu9ita.apps.googleusercontent.com'>
      <QueryClientProvider client={queryClient}>

      <BrowserRouter>
      <App />
      </BrowserRouter>  
      <ReactQueryDevtools initialIsOpen={false} /> {/* Optional: Devtools */}
    </QueryClientProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
