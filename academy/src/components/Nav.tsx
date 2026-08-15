export default function Nav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#080808]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">
            GCI <span className="text-violet-400">Academy</span>
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <a href="#tracks" className="hover:text-white transition-colors">Tracks</a>
          <a href="#curriculum" className="hover:text-white transition-colors">Curriculum</a>
          <a href="#instructors" className="hover:text-white transition-colors">Instructors</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </nav>
        <a
          href="#apply"
          className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Apply Now
        </a>
      </div>
    </header>
  )
}
