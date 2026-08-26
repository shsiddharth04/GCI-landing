import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

const NAV_SECTIONS = [
  ['#masterclass', 'Masterclass'],
  ['#course', 'DJ Course'],
  ['#curriculum', 'Curriculum'],
  ['#faq', 'FAQ'],
] as const

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('')

  useEffect(() => {
    const ids = NAV_SECTIONS.map(([href]) => href.slice(1))
    const observers: IntersectionObserver[] = []

    ids.forEach(id => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id) },
        { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach(obs => obs.disconnect())
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = () => setOpen(false)
    window.addEventListener('scroll', handler, { passive: true, once: true })
    return () => window.removeEventListener('scroll', handler)
  }, [open])

  const isActive = (href: string) => href.slice(1) === activeSection

  return (
    <header className="fixed top-0 left-0 right-0 z-50" style={{
      background: 'rgba(5,5,5,0.88)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(226,169,241,0.1)',
    }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 group">
          <img src="/logo-mark.svg" alt="GCI" style={{ width: '36px', height: '36px' }} />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', letterSpacing: '0.2em', color: 'rgba(226,169,241,0.5)', textTransform: 'uppercase', marginBottom: '3px' }}>
              Gig Culture India
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>
              Music <span style={{ color: '#e2a9f1' }}>Academy</span>
            </div>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8" style={{ fontSize: '13px' }}>
          {NAV_SECTIONS.map(([href, label]) => (
            <a key={href} href={href}
              style={{
                transition: 'color 0.2s',
                textDecoration: 'none',
                color: isActive(href) ? '#e2a9f1' : 'rgba(255,255,255,0.45)',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = isActive(href) ? '#e2a9f1' : 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = isActive(href) ? '#e2a9f1' : 'rgba(255,255,255,0.45)')}
            >{label}</a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <a href="#course" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >Enroll</a>
          <a href="#masterclass" style={{
            fontSize: '12px', fontWeight: 700,
            background: '#e2a9f1', color: '#050505',
            padding: '8px 18px', textDecoration: 'none',
            boxShadow: '0 0 22px rgba(226,169,241,0.4)',
            transition: 'all 0.2s',
            fontFamily: "'Space Mono', monospace", letterSpacing: '0.04em',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#eeaeff'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(226,169,241,0.6)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#e2a9f1'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 22px rgba(226,169,241,0.4)' }}
          >
            REGISTER FREE
          </a>
        </div>

        <button className="md:hidden" style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid rgba(226,169,241,0.08)', background: '#050505', padding: '20px 24px' }} className="md:hidden space-y-4">
          {NAV_SECTIONS.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}
              style={{ display: 'block', fontSize: '14px', color: isActive(href) ? '#e2a9f1' : 'rgba(255,255,255,0.55)', textDecoration: 'none' }}
            >{label}</a>
          ))}
          <a href="#masterclass" style={{
            display: 'block', textAlign: 'center',
            background: '#e2a9f1', color: '#050505',
            fontWeight: 700, padding: '14px',
            fontSize: '12px', fontFamily: "'Space Mono', monospace",
            letterSpacing: '0.08em', textDecoration: 'none',
          }}>REGISTER FREE · MASTERCLASS</a>
        </div>
      )}
    </header>
  )
}
