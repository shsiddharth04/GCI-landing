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
    <div style={{ minHeight: '100vh', background: '#050505', color: 'white', display: 'flex', flexDirection: 'column' }}>

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

      {/* Main content */}
      <div style={{ flex: 1, maxWidth: '900px', margin: '0 auto', padding: '0 24px', width: '100%' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ paddingTop: '108px', paddingBottom: '48px' }}
        >
          <p style={{
            fontFamily: MONO, fontSize: '9px',
            color: 'rgba(212,191,255,0.35)', letterSpacing: '0.3em',
            textTransform: 'uppercase', margin: '0 0 18px',
          }}>
            // CONTACT
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <h1 style={{
              fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: 800,
              lineHeight: 0.92, letterSpacing: '-0.035em',
              fontFamily: SANS, margin: 0,
            }}>
              Talk<br />
              <span style={{ WebkitTextStroke: '1.5px #d4bfff', WebkitTextFillColor: 'transparent' }}>
                to us.
              </span>
            </h1>
            <p style={{
              fontFamily: SANS, fontSize: '13px',
              color: 'rgba(255,255,255,0.32)', lineHeight: 1.65,
              margin: 0, maxWidth: '320px', textAlign: 'right',
            }}>
              Questions about the masterclass, the DJ course, or getting listed on the GCI marketplace — reach out directly.
            </p>
          </div>
        </motion.div>

        {/* Contact rows */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12, ease: 'easeOut' }}
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
              transition={{ duration: 0.38, delay: 0.2 + i * 0.07, ease: 'easeOut' }}
              style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'clamp(20px, 3.5vw, 36px) 0',
                borderBottom: '1px solid rgba(212,191,255,0.07)',
                textDecoration: 'none',
                color: 'white',
                cursor: 'pointer',
                gap: '16px',
              }}
              onMouseEnter={e => {
                const val = e.currentTarget.querySelector<HTMLElement>('.cv')
                if (val) val.style.color = '#d4bfff'
                const arrow = e.currentTarget.querySelector<HTMLElement>('.ca')
                if (arrow) { arrow.style.color = '#d4bfff'; arrow.style.transform = 'translate(2px,-2px)' }
                e.currentTarget.style.background = 'rgba(212,191,255,0.02)'
              }}
              onMouseLeave={e => {
                const val = e.currentTarget.querySelector<HTMLElement>('.cv')
                if (val) val.style.color = 'white'
                const arrow = e.currentTarget.querySelector<HTMLElement>('.ca')
                if (arrow) { arrow.style.color = 'rgba(212,191,255,0.28)'; arrow.style.transform = 'translate(0,0)' }
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {/* Left: index + label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(16px, 3vw, 52px)', flex: 1, minWidth: 0 }}>
                <span style={{
                  fontFamily: MONO, fontSize: '9px',
                  color: 'rgba(212,191,255,0.2)', letterSpacing: '0.18em',
                  flexShrink: 0, userSelect: 'none',
                }}>
                  [{c.index}]
                </span>
                <span style={{
                  fontFamily: MONO, fontSize: '9px',
                  color: 'rgba(212,191,255,0.38)', letterSpacing: '0.22em',
                  textTransform: 'uppercase', flexShrink: 0,
                  minWidth: '76px',
                }}>
                  {c.label}
                </span>

                {/* Value + name stacked */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    className="cv"
                    style={{
                      fontFamily: SANS, fontWeight: 700,
                      fontSize: 'clamp(15px, 2.4vw, 24px)',
                      letterSpacing: '-0.02em', lineHeight: 1.15,
                      color: 'white', transition: 'color 0.2s',
                      wordBreak: 'break-word',
                    }}
                  >
                    {c.value}
                  </div>
                  {c.name && (
                    <div style={{
                      fontFamily: MONO, fontSize: '8px',
                      color: 'rgba(212,191,255,0.3)', letterSpacing: '0.1em',
                      marginTop: '5px',
                    }}>
                      {c.name} &middot; {c.title}
                    </div>
                  )}
                </div>
              </div>

              <span
                className="ca"
                style={{
                  fontSize: '16px',
                  color: 'rgba(212,191,255,0.28)', transition: 'color 0.2s, transform 0.2s',
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
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.48, ease: 'easeOut' }}
          style={{
            marginTop: '56px',
            marginBottom: '56px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
            <div key={item.label} style={{ background: '#050505', padding: 'clamp(18px, 2.5vw, 28px)' }}>
              <div style={{
                fontFamily: MONO, fontSize: '8px',
                color: 'rgba(212,191,255,0.32)', letterSpacing: '0.22em',
                textTransform: 'uppercase', marginBottom: '10px',
              }}>
                {item.label}
              </div>
              <div style={{
                fontFamily: SANS, fontSize: 'clamp(13px, 1.6vw, 15px)',
                fontWeight: 600, color: 'rgba(255,255,255,0.6)',
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
        borderTop: '1px solid rgba(212,191,255,0.06)',
        padding: '22px 24px',
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
