import { useState } from 'react'
import { motion } from 'motion/react'
import { supabase } from '../lib/supabase'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

export const COURSE_DEPOSIT_ENABLED = import.meta.env.VITE_COURSE_DEPOSIT_ENABLED === 'true'

// ── Razorpay script loader (singleton) ───────────────────────────────────────

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

// ── Field component ───────────────────────────────────────────────────────────

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      style={{
        width: '100%',
        background: focused ? 'rgba(18,12,32,0.9)' : 'rgba(5,5,5,0.65)',
        border: `1px solid ${focused ? 'rgba(212,191,255,0.55)' : 'rgba(212,191,255,0.13)'}`,
        color: 'rgba(255,255,255,0.9)',
        padding: '17px 20px',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.18s, background 0.18s',
        borderRadius: '0',
        letterSpacing: '0.01em',
      }}
      placeholder={props.placeholder}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
    />
  )
}

// ── Spinner bars (color-aware) ────────────────────────────────────────────────

function SpinnerBars({ color = '#d4bfff' }: { color?: string }) {
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end' }}>
      {[0.6, 1, 0.7].map((h, i) => (
        <div
          key={i}
          style={{
            width: '3px', height: `${h * 13}px`,
            background: color, opacity: 0.75, borderRadius: '1px',
            animation: 'eqbar 0.8s ease-in-out infinite alternate',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

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
    if (!name.trim()) return 'Enter your full name.'
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
          body: { name: name.trim(), email: email.trim(), phone: phone.trim(), is_masters_union: isMU },
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

  // ── Processing ────────────────────────────────────────────────────────────

  if (stage === 'processing') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: 'clamp(56px, 10vw, 96px) 0',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: '24px', textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-end', height: '36px' }}>
          {[0.55, 0.85, 1, 0.85, 0.55].map((h, i) => (
            <div
              key={i}
              style={{
                width: '5px', height: `${h * 36}px`,
                background: '#d4bfff', opacity: 0.45, borderRadius: '1px',
                animation: 'eqbar 0.8s ease-in-out infinite alternate',
                animationDelay: `${i * 0.11}s`,
              }}
            />
          ))}
        </div>
        <div>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: '9px',
            color: 'rgba(212,191,255,0.45)', letterSpacing: '0.28em', textTransform: 'uppercase',
            marginBottom: '10px',
          }}>
            Confirming your payment
          </div>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px',
            color: 'rgba(255,255,255,0.28)', lineHeight: 1.6,
          }}>
            Hold tight — we're confirming your deposit with Razorpay.
          </p>
        </div>
      </motion.div>
    )
  }

  // ── Success ───────────────────────────────────────────────────────────────

  if (stage === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ padding: 'clamp(40px, 7vw, 72px) 0' }}
      >
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: '9px',
          color: '#d4bfff', letterSpacing: '0.28em', textTransform: 'uppercase',
          marginBottom: '20px',
        }}>
          Deposit confirmed
        </div>
        <h2 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.2rem)', fontWeight: 800, color: 'white',
          letterSpacing: '-0.03em', fontFamily: "'Plus Jakarta Sans', sans-serif",
          lineHeight: 1.05, marginBottom: '20px',
        }}>
          You're in.<br />
          <span style={{ color: '#d4bfff' }}>Seat confirmed.</span>
        </h2>
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '15px',
          color: 'rgba(255,255,255,0.42)', lineHeight: 1.7,
          maxWidth: '520px', marginBottom: '32px',
        }}>
          Your ₹2,000 deposit is confirmed. Your seat is held. Our team will reach out within 24 hours to lock in your batch start date and schedule your first session.
        </p>
        <div style={{
          display: 'inline-block',
          padding: '14px 22px',
          background: '#0f0d18',
          border: '1px solid rgba(212,191,255,0.12)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.5), transparent)',
          }} />
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: '9px',
            color: 'rgba(212,191,255,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>
            Receipt sent to your email
          </span>
        </div>
      </motion.div>
    )
  }

  // ── Payment abandoned ─────────────────────────────────────────────────────

  if (stage === 'payment_abandoned') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row gap-10 lg:gap-16"
        style={{ alignItems: 'flex-start', padding: 'clamp(24px, 4vw, 40px) 0' }}
      >
        {/* Left: message */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: '9px',
            color: 'rgba(212,191,255,0.38)', letterSpacing: '0.28em', textTransform: 'uppercase',
            marginBottom: '20px',
          }}>
            Payment not completed
          </div>
          <h2 style={{
            fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 800, color: 'white',
            letterSpacing: '-0.025em', fontFamily: "'Plus Jakarta Sans', sans-serif",
            lineHeight: 1.1, marginBottom: '16px',
          }}>
            Your seat is still<br />held for 30 minutes.
          </h2>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px',
            color: 'rgba(255,255,255,0.38)', lineHeight: 1.65, marginBottom: '28px',
            maxWidth: '380px',
          }}>
            Your order is reserved. Complete payment when you're ready — no need to re-enter your details.
          </p>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                fontFamily: "'Space Mono', monospace", fontSize: '8px',
                color: 'rgba(212,191,255,0.28)', letterSpacing: '0.14em', textTransform: 'uppercase',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.28)')}
            >
              ← Back to course details
            </button>
          )}
        </div>

        {/* Right: retry card */}
        <div style={{
          width: '100%', maxWidth: '360px', flexShrink: 0,
          background: '#0f0d18', border: '1px solid rgba(212,191,255,0.15)',
          padding: '36px', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.6), transparent)',
          }} />
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: '8px',
            color: 'rgba(212,191,255,0.38)', letterSpacing: '0.25em', textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            Your reservation
          </div>
          <div style={{
            fontSize: 'clamp(2.8rem, 5vw, 3.8rem)', fontWeight: 800, color: '#d4bfff',
            fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.03em',
            lineHeight: 1, marginBottom: '6px',
          }}>
            ₹2,000
          </div>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: '8px',
            color: 'rgba(212,191,255,0.28)', letterSpacing: '0.18em', textTransform: 'uppercase',
            marginBottom: '28px',
          }}>
            Seat deposit · Pending
          </div>
          <button
            onClick={() => cachedOrder && openRazorpayModal(cachedOrder)}
            disabled={submitting}
            style={{
              width: '100%',
              background: '#d4bfff', color: '#050505',
              border: 'none', padding: '18px 24px',
              fontFamily: "'Space Mono', monospace", fontSize: '10px',
              fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1,
              transition: 'all 0.18s',
              boxShadow: '0 0 40px rgba(212,191,255,0.35)',
            }}
          >
            Complete payment →
          </button>
        </div>
      </motion.div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16" style={{ alignItems: 'flex-start' }}>

        {/* ── Left column: copy + fields ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                fontFamily: "'Space Mono', monospace", fontSize: '8px',
                color: 'rgba(212,191,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '0 0 28px 0', display: 'block',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.65)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.3)')}
            >
              ← Back to course details
            </button>
          )}

          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: '9px',
            color: 'rgba(212,191,255,0.4)', letterSpacing: '0.28em', textTransform: 'uppercase',
            marginBottom: '16px',
          }}>
            DJ Course — Seat Deposit
          </div>

          <h2 style={{
            fontSize: 'clamp(1.9rem, 4vw, 2.9rem)', fontWeight: 800, color: 'white',
            letterSpacing: '-0.025em', fontFamily: "'Plus Jakarta Sans', sans-serif",
            lineHeight: 1.08, marginBottom: '14px',
          }}>
            Confirm your seat.
          </h2>

          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px',
            color: 'rgba(255,255,255,0.36)', lineHeight: 1.68,
            marginBottom: '36px', maxWidth: '420px',
          }}>
            Your deposit holds your place in the next batch. Balance payment is scheduled before your first session.
          </p>

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Field
              type="text"
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
            />
            <Field
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Field
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              autoComplete="tel"
            />

            {/* MU toggle */}
            <div style={{ display: 'flex' }}>
              {([
                { label: "Masters' Union student", value: true },
                { label: 'Not a MU student', value: false },
              ] as const).map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setIsMU(opt.value)}
                  style={{
                    flex: 1, padding: '15px 12px',
                    fontFamily: "'Space Mono', monospace", fontSize: '10px', letterSpacing: '0.06em',
                    border: '1px solid rgba(212,191,255,0.18)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: isMU === opt.value ? '#d4bfff' : 'rgba(5,5,5,0.65)',
                    color: isMU === opt.value ? '#050505' : 'rgba(255,255,255,0.32)',
                    fontWeight: isMU === opt.value ? 700 : 400,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {formError && (
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: '9px',
                color: 'rgba(255,85,65,0.9)', letterSpacing: '0.06em',
                padding: '13px 16px',
                border: '1px solid rgba(255,85,65,0.18)',
                background: 'rgba(255,85,65,0.04)',
              }}>
                {formError}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: price card ── */}
        <div style={{
          width: '100%', maxWidth: '380px', flexShrink: 0,
          background: '#0f0d18',
          border: '1px solid rgba(212,191,255,0.14)',
          padding: '36px',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.7), transparent)',
          }} />

          {/* Price display */}
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: '8px',
            color: 'rgba(212,191,255,0.38)', letterSpacing: '0.25em', textTransform: 'uppercase',
            marginBottom: '10px',
          }}>
            Deposit amount
          </div>
          <div style={{
            fontSize: 'clamp(3rem, 5vw, 4.2rem)', fontWeight: 800,
            color: '#d4bfff', fontFamily: "'Plus Jakarta Sans', sans-serif",
            letterSpacing: '-0.035em', lineHeight: 1, marginBottom: '8px',
          }}>
            ₹2,000
          </div>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: '8px',
            color: 'rgba(212,191,255,0.25)', letterSpacing: '0.2em', textTransform: 'uppercase',
            marginBottom: '28px',
          }}>
            Non-refundable · Seat hold
          </div>

          <div style={{ height: '1px', background: 'rgba(212,191,255,0.07)', marginBottom: '24px' }} />

          {/* Trust checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
            {[
              'Holds your place in the next batch',
              'Our team contacts you within 24 hours',
              'Balance payment before batch start',
              'Graduates listed on the GCI marketplace',
            ].map(text => (
              <div key={text} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '17px', height: '17px', flexShrink: 0, marginTop: '1px',
                  border: '1px solid rgba(212,191,255,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: '6px', height: '6px', background: '#d4bfff' }} />
                </div>
                <span style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '12px',
                  color: 'rgba(255,255,255,0.4)', lineHeight: 1.55,
                }}>
                  {text}
                </span>
              </div>
            ))}
          </div>

          <div style={{ height: '1px', background: 'rgba(212,191,255,0.07)', marginBottom: '24px' }} />

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              background: '#d4bfff', color: '#050505',
              border: 'none',
              fontFamily: "'Space Mono', monospace",
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
              padding: '19px 20px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1,
              transition: 'all 0.18s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: submitting ? 'none' : '0 0 52px rgba(212,191,255,0.38)',
            }}
            onMouseEnter={e => {
              if (!submitting) {
                (e.currentTarget as HTMLElement).style.background = '#e0d4ff'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 70px rgba(212,191,255,0.6)'
              }
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLElement).style.background = '#d4bfff'
              ;(e.currentTarget as HTMLElement).style.boxShadow = submitting ? 'none' : '0 0 52px rgba(212,191,255,0.38)'
            }}
          >
            {submitting
              ? <><SpinnerBars color="#050505" /><span>Preparing checkout...</span></>
              : 'Pay ₹2,000 →'
            }
          </button>

          <p style={{
            marginTop: '14px', textAlign: 'center',
            fontFamily: "'Space Mono', monospace", fontSize: '7px',
            color: 'rgba(212,191,255,0.18)', letterSpacing: '0.16em', textTransform: 'uppercase',
          }}>
            Secured by Razorpay · 256-bit encryption
          </p>
        </div>
      </div>
    </form>
  )
}
