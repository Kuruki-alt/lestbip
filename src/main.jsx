import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App.jsx';
import SessionsProvider from '@/store/SessionsProvider';
import '@/styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SessionsProvider>
      <App />
    </SessionsProvider>
  </StrictMode>,
);
