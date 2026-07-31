import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import '@edmunds/eds-core/reset.css';
import '@edmunds/eds-tokens/tokens.css';
import '@edmunds/eds-theme-edmunds/theme.css';
import '@edmunds/eds-core/styles.css';
import '@edmunds/eds-patterns/styles.css';
import './app.css';
import {App} from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
