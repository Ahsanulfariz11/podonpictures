import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import LandingPage from './pages/LandingPage.jsx';
import CrudPage from './pages/CrudPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

export default function App() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-heading)',
              borderRadius: '16px',
              padding: '12px 18px',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<CrudPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </HashRouter>
  );
}
