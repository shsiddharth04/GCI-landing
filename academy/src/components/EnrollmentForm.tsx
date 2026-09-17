import { useState } from 'react'
import { motion } from 'motion/react'
import { supabase } from '../lib/supabase'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

export const COURSE_DEPOSIT_ENABLED = import.meta.env.VITE_COURSE_DEPOSIT_ENABLED === 'true'

// ── Razorpay helpers ─────────────────────────────────────────────────────────

let razorpayScriptPromise: Promise<void> | null = null

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  if (razorpayScriptPromise) return razorpayScriptPromise
  razorpayScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve()
    s.onerror = () => {
      razorpayScriptPromise = null
      reject(new Error('Failed to load Razorpay checkout'))
    }
    document.head.appendChild(s)
  })
  return razorpayScriptPromise
}

async function pollDepositStatus(
  enrollmentId: string,
  maxAttempts = 10,
): Promise<'paid' | 'failed' | 'timeout'> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000))
    const { data } = await supabase
      .from('course_enrollments')
      .select('deposit_status')
      .eq('id', enrollmentId)
      .single()
    if (data?.deposit_status === 'paid') return 'paid'
    if (data?.deposit_status === 'failed') return 'failed'
  }
  return 'timeout'
}

// ── Shared field styles (mirrors SessionPicker exactly) ──────────────────────

const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(5,5,5,0.7)',
  border: '1px solid rgba(212,191,255,0.15)',
  color: 'white',
  padding: '12px 14px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      style={{ ...fieldStyle, borderColor: focused ? 'rgba(212,191,255,0.5)' : 'rgba(212,191,255,0.15)' }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

function SpinnerBars() {
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end' }}>
      {[0.6, 1, 0.7].map((h, i) => (
        <div key={i} style={{
          width: '3px', height: `${h * 14}px`,
          background: '#d4bfff', opacity: 0.5, borderRadius: '1px',
          animation: 'eqbar 0.8s ease-in-out infinite alternate',
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
    </div>
  )
}

// ── Types ────────────────────────────────────────────────────────────────────

type Stage = 'form' | 'processing' | 'success' | 'payment_abandoned'

type OrderData = {
  order_id: string
  enrollment_id: string
  amount: number
  currency: string
  key_id: string
  name: string
  email: string
  phone: string
}

interface Props {
  onBack?: () => void
}

// ── Component ────────────────────────────────────────────────────────────────

export default function EnrollmentForm({ onBack }: Props) {
  const [stage, setStage] = useState<Stage>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isMU, setIsMU] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [cachedOrder, setCachedOrder] = useState<OrderData | null>(null)

  function validate() {
    if (!name.trim()) return 'Enter your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.'
    if (!/^\d{10,12}$/.test(phone.replace(/[\s\-+]/g, ''))) return 'Enter a valid phone number.'
    return null
  }

  function openRazorpayModal(data: OrderData) {
    let handlerFired = false

    const rzp = new window.Razorpay({
      key: data.key_id,
      order_id: data.order_id,
      amount: data.amount,
      currency: data.currency,
      name: 'GCI Music Academy',
      description: 'DJ Course — Seat Deposit',
      prefill: {
        name: data.name,
        email: data.email,
        contact: data.phone.replace(/[\s\-+]/g, ''),
      },
      theme: { color: '#d4bfff' },
      handler: async () => {
        handlerFired = true
        setStage('processing')
        setSubmitting(false)
        // Poll until webhook confirms deposit_status = 'paid'; show success regardless of timeout
        await pollDepositStatus(data.enrollment_id)
        setStage('success')
      },
      modal: {
        ondismiss: () => {
          if (!handlerFired) {
            setStage('payment_abandoned')
            setSubmitting(false)
          }
        },
      },
    })
    rzp.open()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setFormError(err); return }
    setFormError(null)
    setSubmitting(true)

    try {
      const [orderResult] = await Promise.all([
        supabase.functions.invoke('create-course-deposit-order', {
          body: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            is_masters_union: isMU,
          },
        }),
        loadRazorpayScript(),
      ])

      const { data, error: fnErr } = orderResult

      if (fnErr || !data) {
        setFormError("Something went wrong — your card wasn't charged. Try again or message us.")
        setSubmitting(false)
        return
      }
      if (data.error === 'already_paid') {
        setFormError("You've already paid the deposit. Check your email for confirmation.")
        setSubmitting(false)
        return
      }
      if (data.error) {
        setFormError("Something went wrong — your card wasn't charged. Try again or message us.")
        setSubmitting(false)
        return
      }

      setCachedOrder(data as OrderData)
      setSubmitting(false)
      openRazorpayModal(data as OrderData)
    } catch {
      setFormError("Something went wrong — your card wasn't charged. Try again or message us.")
      setSubmitting(false)
    }
  }

  // ── Processing ───────────────────────────────────────────────────────────────

  if (stage === 'processing') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: 'rgba(5,5,5,0.7)', border: '1px solid rgba(212,191,255,0.2)', padding: '28px 24px', position: 'relative' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.55), transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SpinnerBars />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(212,191,255,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Confirming payment
          </span>
        </div>
      </motion.div>
    )
  }

  // ── Payment abandoned ────────────────────────────────────────────────────────

  if (stage === 'payment_abandoned') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: 'rgba(5,5,5,0.7)', border: '1px solid rgba(212,191,255,0.15)', padding: '28px 24px', position: 'relative' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.35), transparent)' }} />
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(212,191,255,0.5)', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Payment not completed
        </p>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: '8px' }}>
          Your seat is still held for 30 minutes.
        </p>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, marginBottom: '20px' }}>
          Complete payment to confirm it.
        </p>
        <button
          onClick={() => cachedOrder && openRazorpayModal(cachedOrder)}
          disabled={submitting}
          style={{
            width: '100%',
            background: '#d4bfff',
            color: '#050505',
            border: 'none',
            fontFamily: "'Space Mono', monospace",
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            padding: '14px 20px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          Complete payment · ₹2,000
        </button>
      </motion.div>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────────

  if (stage === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: 'rgba(5,5,5,0.7)', border: '1px solid rgba(212,191,255,0.25)', padding: '28px 24px', position: 'relative' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.8), transparent)' }} />
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#d4bfff', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '14px' }}>
          Deposit confirmed
        </p>
        <p style={{ fontSize: 'clamp(1.5rem, 3vw, 1.9rem)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.025em', fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: '14px', lineHeight: 1.1 }}>
          Deposit confirmed.
        </p>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
          Your ₹2,000 deposit is in. Our team will reach out within 24 hours to lock in your batch and schedule the balance payment.
        </p>
      </motion.div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────────

  return (
    <div>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            fontFamily: "'Space Mono', monospace", fontSize: '8px',
            color: 'rgba(212,191,255,0.35)', letterSpacing: '0.14em', textTransform: 'uppercase',
            background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 16px 0', display: 'block',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.7)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.35)')}
        >
          ← Back
        </button>
      )}

      {/* Deposit context strip */}
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: '8px',
        color: 'rgba(212,191,255,0.5)',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        marginBottom: '16px',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(212,191,255,0.1)',
      }}>
        [DEPOSIT] ₹2,000 · Non-refundable · Confirms your seat
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Field type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
        <Field type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
        <Field type="tel" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" />

        {/* MU toggle */}
        <div style={{ display: 'flex' }}>
          {([{ label: "Masters' Union", value: true }, { label: 'Non-MU', value: false }] as const).map(opt => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => setIsMU(opt.value)}
              style={{
                flex: 1, padding: '11px 0',
                fontSize: '12px', fontFamily: "'Space Mono', monospace", letterSpacing: '0.06em',
                border: '1px solid rgba(212,191,255,0.18)',
                cursor: 'pointer', transition: 'all 0.15s',
                background: isMU === opt.value ? '#d4bfff' : 'rgba(5,5,5,0.7)',
                color: isMU === opt.value ? '#050505' : 'rgba(255,255,255,0.4)',
                fontWeight: isMU === opt.value ? 700 : 400,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {formError && (
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(255,100,80,0.8)', letterSpacing: '0.08em' }}>
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: '4px',
            background: '#d4bfff',
            color: '#050505',
            border: 'none',
            fontFamily: "'Space Mono', monospace",
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            padding: '14px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
            transition: 'opacity 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: submitting ? 'none' : '0 0 40px rgba(212,191,255,0.45)',
          }}
        >
          {submitting ? (
            <><SpinnerBars /><span>Preparing payment...</span></>
          ) : (
            'Enroll now · ₹2,000 deposit'
          )}
        </button>
      </form>
    </div>
  )
}
