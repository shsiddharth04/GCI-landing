import { Link } from 'react-router-dom'
import { motion } from 'motion/react'

const MONO = "'Space Mono', monospace"
const SANS = "'Plus Jakarta Sans', sans-serif"

const CONTACTS = [
  {
    label: 'Email',
    value: 'enquiries@gigcultureindia.com',
    href: 'mailto:enquiries@gigcultureindia.com',
    index: '01',
    external: false,
  },
  {
    label: 'Phone',
    value: '+91 79775 97701',
    href: 'tel:+917977597701',
    index: '02',
    external: false,
  },
  {
    label: 'Phone',
    value: '+91 80775 04664',
    href: 'tel:+918077504664',
    index: '03',
    external: false,
  },
  {
    label: 'Instagram',
    value: '@gigcultureindia',
    href: 'https://www.instagram.com/gigcultureindia',
    index: '04',
    external: true,
  },
]

export default function ContactPage() {
  function handleBack() {
    if (window.history.length > 1) window.history.back()
    else window.location.href = '/'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: 'white' }}>

      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(212,191,255,0.07)',
        padding: '0 24px', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={handleBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: MONO, fontSize: '9px',
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'rgba(212,191,255,0.45)', transition: 'color 0.2s', padding: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#d4bfff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.45)')}
        >
          &larr; Back
        </button>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/logo-mark.svg" alt="GCI" style={{ width: '26px', height: '26px', opacity: 0.75 }} />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontFamily: MONO, fontSize: '7px', letterSpacing: '0.2em', color: 'rgba(212,191,255,0.35)', textTransform: 'uppercase', marginBottom: '2px' }}>
              Gig Culture India
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.01em', color: 'white' }}>
              Music <span style={{ color: '#d4bfff' }}>Academy</span>
            </div>
          </div>
        </Link>
      </div>

      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          style={{ paddingTop: '120px', paddingBottom: '64px' }}
        >
          <p style={{
            fontFamily: MONO, fontSize: '9px',
            color: 'rgba(212,191,255,0.35)', letterSpacing: '0.3em',
            textTransform: 'uppercase', margin: '0 0 20px',
          }}>
            // CONTACT
          </p>
          <h1 style={{
            fontSize: 'clamp(3.5rem, 9vw, 8rem)', fontWeight: 800,
            lineHeight: 0.9, letterSpacing: '-0.04em',
            fontFamily: SANS, margin: '0 0 28px',
          }}>
            Talk<br /><span style={{ WebkitTextStroke: '2px #d4bfff', WebkitTextFillColor: 'transparent' }}>to us.</span>
          </h1>
          <p style={{
            fontFamily: SANS, fontSize: 'clamp(14px, 2vw, 17px)',
            color: 'rgba(255,255,255,0.4)', lineHeight: 1.65,
            maxWidth: '480px', margin: 0,
          }}>
            Questions about the masterclass, the DJ course, or getting listed on the GCI marketplace — reach out directly.
          </p>
        </motion.div>

        {/* Contact rows */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          style={{ borderTop: '1px solid rgba(212,191,255,0.1)' }}
        >
          {CONTACTS.map((c, i) => (
            <motion.a
              key={c.index}
              href={c.href}
              target={c.external ? '_blank' : undefined}
              rel={c.external ? 'noopener noreferrer' : undefined}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.08, ease: 'easeOut' }}
              style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'clamp(24px, 4vw, 44px) 0',
                borderBottom: '1px solid rgba(212,191,255,0.08)',
                textDecoration: 'none',
                color: 'white',
                transition: 'background 0.2s',
                cursor: 'pointer',
                gap: '16px',
                margin: '0 -24px',
                paddingLeft: '24px',
                paddingRight: '24px',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = 'rgba(212,191,255,0.03)'
                const val = el.querySelector<HTMLElement>('.contact-value')
                if (val) val.style.color = '#d4bfff'
                const arrow = el.querySelector<HTMLElement>('.contact-arrow')
                if (arrow) { arrow.style.color = '#d4bfff'; arrow.style.transform = 'translate(2px, -2px)' }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = 'transparent'
                const val = el.querySelector<HTMLElement>('.contact-value')
                if (val) val.style.color = 'white'
                const arrow = el.querySelector<HTMLElement>('.contact-arrow')
                if (arrow) { arrow.style.color = 'rgba(212,191,255,0.3)'; arrow.style.transform = 'translate(0,0)' }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'clamp(16px, 3vw, 48px)', flex: 1, minWidth: 0 }}>
                <span style={{
                  fontFamily: MONO, fontSize: '9px',
                  color: 'rgba(212,191,255,0.25)', letterSpacing: '0.18em',
                  flexShrink: 0, userSelect: 'none',
                }}>
                  [{c.index}]
                </span>
                <span style={{
                  fontFamily: MONO, fontSize: '9px',
                  color: 'rgba(212,191,255,0.4)', letterSpacing: '0.22em',
                  textTransform: 'uppercase', flexShrink: 0,
                  minWidth: '80px',
                }}>
                  {c.label}
                </span>
                <span
                  className="contact-value"
                  style={{
                    fontFamily: SANS, fontWeight: 700,
                    fontSize: 'clamp(16px, 3.2vw, 30px)',
                    letterSpacing: '-0.02em', lineHeight: 1.15,
                    color: 'white', transition: 'color 0.2s',
                    wordBreak: 'break-word',
                  }}
                >
                  {c.value}
                </span>
              </div>
              <span
                className="contact-arrow"
                style={{
                  fontSize: '18px',
                  color: 'rgba(212,191,255,0.3)', transition: 'color 0.2s, transform 0.2s',
                  flexShrink: 0,
                }}
              >
                ↗
              </span>
            </motion.a>
          ))}
        </motion.div>

        {/* Studio info strip */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.45, ease: 'easeOut' }}
          style={{
            marginTop: '80px',
            marginBottom: '80px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1px',
            background: 'rgba(212,191,255,0.07)',
            border: '1px solid rgba(212,191,255,0.07)',
          }}
        >
          {[
            { label: 'Studio', value: 'GCI Studio, Gurugram' },
            { label: 'Address', value: '11th Floor, Capital Tower\nSector 20, Gurugram' },
            { label: 'Hours', value: 'Mon–Sat\n10 AM – 10 PM' },
          ].map(item => (
            <div
              key={item.label}
              style={{ background: '#050505', padding: 'clamp(20px, 3vw, 32px)' }}
            >
              <div style={{
                fontFamily: MONO, fontSize: '8px',
                color: 'rgba(212,191,255,0.35)', letterSpacing: '0.22em',
                textTransform: 'uppercase', marginBottom: '12px',
              }}>
                {item.label}
              </div>
              <div style={{
                fontFamily: SANS, fontSize: 'clamp(14px, 1.8vw, 16px)',
                fontWeight: 600, color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.55, whiteSpace: 'pre-line',
              }}>
                {item.value}
              </div>
            </div>
          ))}
        </motion.div>

      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid rgba(212,191,255,0.07)',
        padding: '28px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{
          fontFamily: MONO, fontSize: '9px',
          color: 'rgba(255,255,255,0.12)', letterSpacing: '0.14em',
          margin: 0, textAlign: 'center',
        }}>
          GCI Music Academy · Gurugram, India
        </p>
      </div>

    </div>
  )
}
