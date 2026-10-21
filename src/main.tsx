import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Global CSS Architecture imported once in main.tsx
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/utilities.css';

createRoot(document.getElementById('root')!).render(<App />);
