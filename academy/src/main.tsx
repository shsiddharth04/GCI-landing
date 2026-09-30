import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import AdminApp from './admin/index.tsx'
import StudioPage from './pages/StudioPage.tsx'
import ContactPage from './pages/ContactPage.tsx'
import { supabase } from './lib/supabase.ts'

// When an admin invite or password-recovery link lands here (not at #/admin because the
// Supabase token was in the hash fragment), redirect to the admin panel so AdminApp
// can detect the pending session and show the set-password screen.
if (sessionStorage.getItem('_auth_type')) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
      data.subscription.unsubscribe()
      if (!window.location.hash.replace(/^#\/?/, '').startsWith('admin')) {
        window.location.hash = '/admin'
      }
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
