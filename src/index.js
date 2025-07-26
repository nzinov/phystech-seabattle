import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.js';
import registerServiceWorker from './registerServiceWorker.js';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App/>);
registerServiceWorker();
