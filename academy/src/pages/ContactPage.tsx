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
    name: undefined as string | undefined,
    title: undefined as string | undefined,
  },
  {
    label: 'Phone',
    value: '+91 79775 97701',
    href: 'tel:+917977597701',
    index: '02',
    external: false,
    name: 'Divith Chowdhary',
    title: 'Founder & Creative Director',
  },
  {
    label: 'Phone',
    value: '+91 80775 04664',
    href: 'tel:+918077504664',
    index: '03',
    external: false,
    name: 'Siddharth Sharma',
    title: 'Co-Founder & CTO',
  },
  {
    label: 'Instagram',
    value: '@gigcultureindia',
    href: 'https://www.instagram.com/gigcultureindia',
    index: '04',
    external: true,
    name: undefined as string | undefined,
    title: undefined as string | undefined,
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
        background: 'rgba(5,5,5,0.88)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(212,191,255,0.07)',
        padding: '0 24px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={handleBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: MONO, fontSize: '9px',
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'rgba(212,191,255,0.4)', transition: 'color 0.2s', padding: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#d4bfff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.4)')}
        >
          &larr; Back
        </button>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/logo-mark.svg" alt="GCI" style={{ width: '24px', height: '24px', opacity: 0.7 }} />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontFamily: MONO, fontSize: '7px', letterSpacing: '0.2em', color: 'rgba(212,191,255,0.3)', textTransform: 'uppercase', marginBottom: '2px' }}>
              Gig Culture India
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '-0.01em', color: 'white' }}>
              Music <span style={{ color: '#d4bfff' }}>Academy</span>
            </div>
          </div>
        </Link>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px' }}>

        {/* Two-column layout — heading left, contacts right */}
        <div
          className="flex flex-col lg:flex-row lg:gap-16"
          style={{ paddingTop: '88px', paddingBottom: '40px', alignItems: 'flex-start' }}
        >

          {/* Left — heading + tagline */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ flexShrink: 0, width: '100%', maxWidth: '260px', paddingBottom: '32px' }}
          >
            <p style={{
              fontFamily: MONO, fontSize: '9px',
              color: 'rgba(212,191,255,0.3)', letterSpacing: '0.3em',
              textTransform: 'uppercase', margin: '0 0 14px',
            }}>
              // CONTACT
            </p>
            <h1 style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 800,
              lineHeight: 0.92, letterSpacing: '-0.035em',
              fontFamily: SANS, margin: '0 0 18px',
            }}>
              Talk<br /><span style={{ WebkitTextStroke: '1.5px #d4bfff', WebkitTextFillColor: 'transparent' }}>to us.</span>
            </h1>
            <p style={{
              fontFamily: SANS, fontSize: '13px',
              color: 'rgba(255,255,255,0.35)', lineHeight: 1.65,
              margin: 0, maxWidth: '240px',
            }}>
              Questions about the masterclass, the DJ course, or getting listed on the GCI marketplace — reach out directly.
            </p>
          </motion.div>

          {/* Right — contact rows */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, delay: 0.1, ease: 'easeOut' }}
            style={{ flex: 1, borderTop: '1px solid rgba(212,191,255,0.1)', minWidth: 0 }}
          >
            {CONTACTS.map((c, i) => (
              <motion.a
                key={c.index}
                href={c.href}
                target={c.external ? '_blank' : undefined}
                rel={c.external ? 'noopener noreferrer' : undefined}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.36, delay: 0.18 + i * 0.07, ease: 'easeOut' }}
                style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 0',
                  borderBottom: '1px solid rgba(212,191,255,0.07)',
                  textDecoration: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  gap: '12px',
                }}
                onMouseEnter={e => {
                  const val = e.currentTarget.querySelector<HTMLElement>('.cv')
                  if (val) val.style.color = '#d4bfff'
                  const arrow = e.currentTarget.querySelector<HTMLElement>('.ca')
                  if (arrow) { arrow.style.color = '#d4bfff'; arrow.style.transform = 'translate(2px, -2px)' }
                }}
                onMouseLeave={e => {
                  const val = e.currentTarget.querySelector<HTMLElement>('.cv')
                  if (val) val.style.color = 'white'
                  const arrow = e.currentTarget.querySelector<HTMLElement>('.ca')
                  if (arrow) { arrow.style.color = 'rgba(212,191,255,0.25)'; arrow.style.transform = 'translate(0,0)' }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2.5vw, 28px)', flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontFamily: MONO, fontSize: '8px',
                    color: 'rgba(212,191,255,0.2)', letterSpacing: '0.16em',
                    flexShrink: 0, userSelect: 'none',
                  }}>
                    [{c.index}]
                  </span>
                  <span style={{
                    fontFamily: MONO, fontSize: '8px',
                    color: 'rgba(212,191,255,0.35)', letterSpacing: '0.2em',
                    textTransform: 'uppercase', flexShrink: 0,
                    minWidth: '60px',
                  }}>
                    {c.label}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      className="cv"
                      style={{
                        fontFamily: SANS, fontWeight: 700,
                        fontSize: 'clamp(13px, 1.8vw, 17px)',
                        letterSpacing: '-0.015em', lineHeight: 1.2,
                        color: 'white', transition: 'color 0.2s',
                        wordBreak: 'break-word',
                      }}
                    >
                      {c.value}
                    </div>
                    {c.name && (
                      <div style={{
                        fontFamily: MONO, fontSize: '8px',
                        color: 'rgba(212,191,255,0.28)', letterSpacing: '0.1em',
                        marginTop: '4px',
                      }}>
                        {c.name} &middot; {c.title}
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className="ca"
                  style={{
                    fontSize: '14px',
                    color: 'rgba(212,191,255,0.25)', transition: 'color 0.2s, transform 0.2s',
                    flexShrink: 0,
                  }}
                >
                  ↗
                </span>
              </motion.a>
            ))}
          </motion.div>

        </div>

        {/* Studio info strip */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.42, ease: 'easeOut' }}
          style={{
            marginBottom: '48px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1px',
            background: 'rgba(212,191,255,0.06)',
            border: '1px solid rgba(212,191,255,0.06)',
          }}
        >
          {[
            { label: 'Studio', value: 'GCI Studio, Gurugram' },
            { label: 'Address', value: '11th Floor, Capital Tower\nSector 20, Gurugram' },
            { label: 'Hours', value: 'Mon–Sat\n10 AM – 10 PM' },
          ].map(item => (
            <div
              key={item.label}
              style={{ background: '#050505', padding: '18px 20px' }}
            >
              <div style={{
                fontFamily: MONO, fontSize: '8px',
                color: 'rgba(212,191,255,0.3)', letterSpacing: '0.2em',
                textTransform: 'uppercase', marginBottom: '8px',
              }}>
                {item.label}
              </div>
              <div style={{
                fontFamily: SANS, fontSize: '13px',
                fontWeight: 600, color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.5, whiteSpace: 'pre-line',
              }}>
                {item.value}
              </div>
            </div>
          ))}
        </motion.div>

      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid rgba(212,191,255,0.06)',
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{
          fontFamily: MONO, fontSize: '8px',
          color: 'rgba(255,255,255,0.1)', letterSpacing: '0.14em',
          margin: 0, textAlign: 'center',
        }}>
          GCI Music Academy · Gurugram, India
        </p>
      </div>

    </div>
  )
}
