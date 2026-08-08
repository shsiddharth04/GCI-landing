export default function WaitlistSection() {
  return (
    <section
      id="waitlist"
      className="min-h-screen flex flex-col items-center justify-center px-6 py-24 border-t border-zinc-900"
    >
      <div className="max-w-lg w-full text-center">

        {/* Label */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-8 bg-[#CBA6F7]/30" />
          <span
            className="text-[#CBA6F7] font-bold uppercase tracking-[0.4em]"
            style={{ fontSize: '9px' }}
          >
            Early Access
          </span>
          <div className="h-px w-8 bg-[#CBA6F7]/30" />
        </div>

        <h2 className="font-black text-4xl md:text-5xl uppercase tracking-tight text-white mb-4">
          Register Your Interest
        </h2>

        <p className="text-zinc-500 text-sm leading-relaxed mb-12">
          Be the first to know when we open doors. Leave your details and we'll reach out directly.
        </p>

        {/* Form placeholder — to be replaced with real form */}
        <div className="border border-zinc-800/70 rounded-2xl p-10 bg-zinc-950/50">
          <p className="text-zinc-600 text-sm">Form coming soon.</p>
        </div>

      </div>
    </section>
  );
}
