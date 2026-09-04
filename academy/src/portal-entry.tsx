import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import PortalRoot from './portal/PortalRoot'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PortalRoot />
    <Analytics />
  </StrictMode>,
)
