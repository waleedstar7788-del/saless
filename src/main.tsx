import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyAppTheme, loadAppTheme } from './lib/appThemes';

applyAppTheme(loadAppTheme());

const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
document.documentElement.dataset.viewport =
  w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
