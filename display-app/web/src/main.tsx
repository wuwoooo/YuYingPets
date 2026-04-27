import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { DisplayApp } from '../../shared/src/index';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <DisplayApp />
    </BrowserRouter>
  </React.StrictMode>,
);
