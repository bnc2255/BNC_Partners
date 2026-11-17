import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'

// keep ?ref=CODE from a partner's referral link until the visitor registers
// (claimed in lib/referrals.js -> claimPendingSponsor)
try {
  const ref = new URLSearchParams(window.location.search).get('ref')
  if (ref && /^[A-Za-z0-9]{4,16}$/.test(ref)) localStorage.setItem('bnc_ref_code', ref.toUpperCase())
} catch { /* storage unavailable */ }

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
