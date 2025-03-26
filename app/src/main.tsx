// Importar polyfills primero
import './polyfills';

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initViewportHeight } from './utils/viewportHeight';

// Initialize viewport height calculation
initViewportHeight();

createRoot(document.getElementById("root")!).render(<App />);
