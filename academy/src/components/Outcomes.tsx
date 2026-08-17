const WHY_ITEMS = [
  {
    index: '01',
    title: 'A real booking pipeline — not a diploma.',
    body: 'Every graduate gets discoverable on the GCI marketplace from day one. Hosts with real budgets, AI-matched to your sound. No cold emails, no industry gatekeepers.',
  },
  {
    index: '02',
    title: 'Hands-on with real equipment.',
    body: 'You learn on professional DJ gear inside our Gurugram studio. Not a simulation. Not a YouTube tutorial. You play, you make mistakes, you get better.',
  },
  {
    index: '03',
    title: 'Contracts that protect you from day one.',
    body: 'Every booking through GCI is backed by an automated, legally binding contract. You learn how they work — and you use them. No more no-pays.',
  },
]

export default function WhyAcademy() {
  return (
    <section className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-16 max-w-2xl">
          <p className="font-mono text-[10px] text-[#E8DEFA]/40 tracking-widest uppercase mb-4">Why GCI Academy</p>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Not just a certificate.<br />
            <span className="text-[#E8DEFA]">A booking pipeline.</span>
          </h2>
        </div>

        {/* Items */}
        <div className="grid md:grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
          {WHY_ITEMS.map(({ index, title, body }) => (
            <div key={index} className="bg-[#0a0a0a] p-8 md:p-10">
              <div className="font-mono text-[11px] text-[#E8DEFA]/35 mb-6 tracking-widest">[{index}]</div>
              <h3 className="text-lg font-semibold mb-4 leading-snug">{title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
