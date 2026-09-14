import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'
import AdminApp from './admin/index.tsx'
import StudioPage from './pages/StudioPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </HashRouter>
    <Analytics />
  </StrictMode>,
)
