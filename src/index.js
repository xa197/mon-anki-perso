import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // On importe le chef d'orchestre

// On importe le fichier CSS principal pour que toute l'application puisse l'utiliser
import './style.css'; 

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);