const BAR_HEIGHTS = [0.3, 0.6, 1, 0.5, 0.8, 0.4, 0.7, 0.55, 0.9, 0.35, 0.65, 0.45]
const BAR_DELAYS = [0, 0.2, 0.4, 0.1, 0.5, 0.3, 0.6, 0.15, 0.45, 0.25, 0.35, 0.05]

export default function Footer() {
  return (
    <footer className="border-t border-white/5 pt-16 pb-10 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Top row */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-16">
          {/* Brand */}
          <div className="flex items-start gap-4">
            <img src="/logo-mark.svg" alt="GCI" className="h-10 w-10 mt-0.5" />
            <div>
              <div className="font-mono text-[10px] text-[#E8DEFA]/30 tracking-widest uppercase mb-1">Gig Culture India</div>
              <div className="text-lg font-semibold">Music Academy</div>
              <div className="font-mono text-xs text-white/25 mt-1">organising the underground</div>
            </div>
          </div>

          {/* Waveform decoration */}
          <div className="flex items-end gap-[3px]">
            {BAR_HEIGHTS.map((h, i) => (
              <div
                key={i}
                className="eq-bar w-[3px] rounded-full bg-[#E8DEFA]/20"
                style={{
                  height: `${h * 32}px`,
                  animationDelay: `${BAR_DELAYS[i]}s`,
                }}
              />
            ))}
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm text-white/35">
            {[
              { label: 'Masterclass', href: '#masterclass' },
              { label: 'DJ Course', href: '#course' },
              { label: 'Curriculum', href: '#curriculum' },
              { label: 'FAQ', href: '#faq' },
              { label: 'GCI Platform', href: '/' },
              { label: 'Contact', href: 'mailto:hello@gigcultureindia.com' },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="hover:text-[#E8DEFA] transition-colors">
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-6 border-t border-white/5">
          <span className="font-mono text-[10px] text-white/20 tracking-wide">
            © 2026 Gig Culture India Pvt. Ltd. · All rights reserved.
          </span>
          <span className="font-mono text-[10px] text-white/15">
            GCI Music Academy · Gurugram
          </span>
        </div>
      </div>
    </footer>
  )
}
