import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0a]/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3">
          <img src="/logo-mark.svg" alt="GCI" className="h-7 w-7" />
          <div className="leading-tight">
            <div className="text-xs font-mono text-[#E8DEFA]/50 tracking-widest uppercase">Gig Culture India</div>
            <div className="text-sm font-semibold tracking-tight -mt-0.5">
              Music <span className="text-[#E8DEFA]">Academy</span>
            </div>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-white/50">
          <a href="#masterclass" className="hover:text-white transition-colors">Masterclass</a>
          <a href="#course" className="hover:text-white transition-colors">DJ Course</a>
          <a href="#curriculum" className="hover:text-white transition-colors">Curriculum</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="#course"
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            Enroll
          </a>
          <a
            href="#masterclass"
            className="text-sm bg-[#E8DEFA] hover:bg-[#d4c8f0] text-[#0a0a0a] font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Register free
          </a>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-white/60 hover:text-white"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/5 bg-[#0a0a0a] px-6 py-5 space-y-4">
          {['#masterclass', '#course', '#curriculum', '#faq'].map((href, i) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block text-sm text-white/60 hover:text-white transition-colors"
            >
              {['Masterclass', 'DJ Course', 'Curriculum', 'FAQ'][i]}
            </a>
          ))}
          <a
            href="#masterclass"
            className="block text-center bg-[#E8DEFA] text-[#0a0a0a] font-semibold py-3 rounded-lg text-sm"
          >
            Register free — Masterclass
          </a>
        </div>
      )}
    </header>
  )
}
