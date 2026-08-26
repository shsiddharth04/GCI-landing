import { useState } from 'react'
import { supabase } from '../lib/supabase'

type State = 'idle' | 'submitting' | 'success' | 'error'

function validate(name: string, phone: string): string | null {
  if (!name.trim()) return 'Please enter your name.'
  if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) return 'Enter a valid 10-digit phone number.'
  return null
}

interface Props {
  onClose?: () => void
}

export default function CallbackForm({ onClose }: Props) {
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
      .from('course_callbacks')
      .insert({ name: name.trim(), phone: phone.replace(/\s/g, ''), is_masters_union: isMU })

    if (dbError) {
      setState('error')
      setError(dbError.code === '23505'
        ? 'We already have your details. We\'ll be in touch soon.'
        : 'Something went wrong. Please try again.')
      return
    }
    setState('success')
  }

  if (state === 'success') {
    return (
      <div style={{
        background: '#0f0d18',
        border: '1px solid rgba(226,169,241,0.18)',
        padding: '24px',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.6), transparent)' }} />
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#e2a9f1', letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Callback requested
        </div>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          We'll call you back within 24 hours.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Context strip */}
      <div style={{
        display: 'flex', gap: '20px', flexWrap: 'wrap',
        marginBottom: '18px',
        paddingBottom: '18px',
        borderBottom: '1px solid rgba(226,169,241,0.08)',
      }}>
        {[
          { label: 'Fee', value: '₹22,200' },
          { label: 'Batch size', value: '3 students' },
          { label: 'Format', value: 'In-studio, Gurugram' },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(226,169,241,0.4)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '3px' }}>{label}</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.72)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={inputStyle}
        />

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
            { label: 'Non-MU', value: false },
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
                border: '1px solid rgba(226,169,241,0.18)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: isMU === opt.value ? '#e2a9f1' : 'rgba(255,255,255,0.04)',
                color: isMU === opt.value ? '#050505' : 'rgba(255,255,255,0.4)',
                fontWeight: isMU === opt.value ? 700 : 400,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {error && (
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'rgba(255,100,100,0.85)', letterSpacing: '0.08em' }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid rgba(226,169,241,0.15)',
                color: 'rgba(255,255,255,0.35)',
                padding: '14px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: "'Space Mono', monospace",
                letterSpacing: '0.08em',
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={state === 'submitting'}
            style={{
              flex: 2,
              background: state === 'submitting' ? 'rgba(226,169,241,0.5)' : '#e2a9f1',
              color: '#050505',
              fontWeight: 700,
              padding: '14px',
              fontSize: '13px',
              border: 'none',
              cursor: state === 'submitting' ? 'not-allowed' : 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: state === 'submitting' ? 'none' : '0 0 28px rgba(226,169,241,0.35)',
              transition: 'all 0.2s',
            }}
          >
            {state === 'submitting' ? 'Sending…' : 'Request a Callback'}
          </button>
        </div>
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
