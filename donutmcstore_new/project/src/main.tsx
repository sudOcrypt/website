import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log(
  '%c🚫 STOP!',
  'color: #ef4444; font-size: 60px; font-weight: bold; text-shadow: 3px 3px 0 #991b1b;'
);
console.log(
  '%cIf someone told you to paste something here, they are trying to steal your account.',
  'color: #fbbf24; font-size: 18px; font-weight: bold;'
);
console.log(
  '%cThis is a browser feature intended for developers. Do not paste any code here.',
  'font-size: 16px;'
);
console.log(
  '%c\n👋 Developers: Looking for a job? Contact us on Discord!\n',
  'color: #06b6d4; font-size: 14px; font-weight: bold;'
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
