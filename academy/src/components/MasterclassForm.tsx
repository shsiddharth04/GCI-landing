import { useState } from 'react'
import { supabase } from '../lib/supabase'

type State = 'idle' | 'submitting' | 'success' | 'error'

function validate(name: string, phone: string): string | null {
  if (!name.trim()) return 'Please enter your name.'
  if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) return 'Enter a valid 10-digit phone number.'
  return null
}

export default function MasterclassForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isMU, setIsMU] = useState(false)
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate(name, phone)
    if (validationError) { setError(validationError); return }
    setError(null)
    setState('submitting')

    const { error: dbError } = await supabase
      .from('masterclass_registrations')
      .insert({ name: name.trim(), phone: phone.replace(/\s/g, ''), is_masters_union: isMU })

    if (dbError) {
      setState('error')
      setError(dbError.code === '23505'
        ? 'This phone number is already registered.'
        : 'Something went wrong. Please try again.')
      return
    }
    setState('success')
  }

  if (state === 'success') {
    return (
      <div style={{
        marginTop: '28px',
        background: '#050505',
        border: '1px solid rgba(226,169,241,0.2)',
        padding: '28px 24px',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.7), transparent)' }} />
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#e2a9f1', letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: '10px' }}>
          You're registered
        </div>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          We'll send session details to your phone. See you in the studio.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ marginTop: '28px' }}>
      {/* Value framing */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        marginBottom: '20px',
        background: '#050505', border: '1px solid rgba(226,169,241,0.18)',
        padding: '8px 14px',
      }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', textDecoration: 'line-through' }}>₹5,000</span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#e2a9f1', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Free of cost</span>
      </div>

      <div style={{ background: '#050505', padding: '20px', border: '1px solid rgba(226,169,241,0.15)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Name */}
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={inputStyle}
        />

        {/* Phone */}
        <input
          type="tel"
          placeholder="Phone number (10 digits)"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          required
          style={inputStyle}
        />

        {/* MU toggle */}
        <div style={{ display: 'flex', gap: '0px' }}>
          {[
            { label: "Masters' Union", value: true },
            { label: 'Not MU', value: false },
          ].map(opt => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => setIsMU(opt.value)}
              style={{
                flex: 1,
                padding: '11px 0',
                fontSize: '12px',
                fontFamily: "'Space Mono', monospace",
                letterSpacing: '0.06em',
                border: '1px solid rgba(226,169,241,0.2)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: isMU === opt.value ? '#e2a9f1' : '#111',
                color: isMU === opt.value ? '#050505' : 'rgba(255,255,255,0.5)',
                fontWeight: isMU === opt.value ? 700 : 400,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'rgba(255,100,100,0.85)', letterSpacing: '0.08em' }}>
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={state === 'submitting'}
          style={{
            background: state === 'submitting' ? 'rgba(226,169,241,0.5)' : '#e2a9f1',
            color: '#050505',
            fontWeight: 700,
            padding: '16px',
            fontSize: '13px',
            border: 'none',
            cursor: state === 'submitting' ? 'not-allowed' : 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            boxShadow: state === 'submitting' ? 'none' : '0 0 30px rgba(226,169,241,0.4)',
            transition: 'all 0.2s',
          }}
        >
          {state === 'submitting' ? 'Registering…' : 'Register — It\'s Free'}
        </button>
      </div>
    </form>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(226,169,241,0.18)',
  padding: '13px 16px',
  fontSize: '14px',
  color: 'white',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}
