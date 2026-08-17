const BAR_HEIGHTS = [0.3, 0.6, 1, 0.5, 0.8, 0.4, 0.7, 0.55, 0.9, 0.35, 0.65, 0.45]
const BAR_DELAYS  = [0, 0.2, 0.4, 0.1, 0.5, 0.3, 0.6, 0.15, 0.45, 0.25, 0.35, 0.05]

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(226,169,241,0.1)', paddingTop: '64px', paddingBottom: '40px', padding: '64px 24px 40px', background: '#050505' }}>
      <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
        {/* Top row */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-10" style={{ marginBottom: '56px' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <img src="/logo-mark.svg" alt="GCI" style={{ width: '40px', height: '40px', marginTop: '2px' }} />
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(226,169,241,0.35)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '4px' }}>Gig Culture India</div>
              <div style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.01em', fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: '4px' }}>Music Academy</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(226,169,241,0.25)', letterSpacing: '0.14em' }}>organising the underground</div>
            </div>
          </div>

          {/* Waveform */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
            {BAR_HEIGHTS.map((h, i) => (
              <div key={i} className="eq-bar" style={{
                width: '3px', borderRadius: '2px',
                background: '#e2a9f1',
                height: `${h * 28}px`,
                animationDelay: `${BAR_DELAYS[i]}s`,
                opacity: 0.18 + h * 0.15,
              }} />
            ))}
          </div>

          {/* Links */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px 48px' }}>
            {[
              { label: 'Masterclass', href: '#masterclass' },
              { label: 'DJ Course', href: '#course' },
              { label: 'Curriculum', href: '#curriculum' },
              { label: 'FAQ', href: '#faq' },
              { label: 'GCI Platform', href: '/' },
              { label: 'Contact', href: 'mailto:hello@gigcultureindia.com' },
            ].map(({ label, href }) => (
              <a key={label} href={href} style={{
                fontSize: '13px', color: 'rgba(255,255,255,0.32)', textDecoration: 'none', transition: 'color 0.2s',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = '#e2a9f1')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.32)')}
              >{label}</a>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3" style={{ paddingTop: '24px', borderTop: '1px solid rgba(226,169,241,0.07)' }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.08em' }}>
            © 2026 Gig Culture India Pvt. Ltd. · All rights reserved.
          </span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(226,169,241,0.18)', letterSpacing: '0.08em' }}>
            GCI Music Academy · Gurugram
          </span>
        </div>
      </div>
    </footer>
  )
}
