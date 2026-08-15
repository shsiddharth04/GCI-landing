export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/30">
        <span>© 2026 Gig Culture India. All rights reserved.</span>
        <div className="flex gap-6">
          <a href="/" className="hover:text-white/60 transition-colors">Main Platform</a>
          <a href="/waitlist" className="hover:text-white/60 transition-colors">Waitlist</a>
          <a href="mailto:hello@gigcultureindia.com" className="hover:text-white/60 transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  )
}
