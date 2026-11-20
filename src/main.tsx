import React from 'react';
import { createRoot } from 'react-dom/client';
import { LabApp } from './components/LabApp';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element missing');
createRoot(root).render(
  <React.StrictMode>
    <LabApp />
  </React.StrictMode>,
);
