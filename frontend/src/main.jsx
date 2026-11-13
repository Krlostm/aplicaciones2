import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/epilogue';
import '@fontsource-variable/geist';
import './styles.css';
import App from './App.jsx';
import './theme.css';
import './workspace.css';
import { AuthProvider } from './context/AuthContext.jsx';
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
