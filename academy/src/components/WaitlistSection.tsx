import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Instagram, MessageCircle } from 'lucide-react';

/* ─── Validation ──────────────────────────────────────────────── */
type Role = 'artist' | 'enthusiast' | null;
type FormData = { fullName: string; city: string; phone: string };
type FormErrors = Partial<Record<keyof FormData, string>>;

const phoneRe = /^[6-9]\d{9}$/;

function validate(d: FormData): FormErrors {
  const e: FormErrors = {};
  if (!d.fullName.trim()) e.fullName = 'Required';
  if (!d.city.trim()) e.city = 'Required';
  if (!d.phone.trim()) e.phone = 'Required';
  else if (!phoneRe.test(d.phone.trim())) e.phone = 'Valid 10-digit number required';
  return e;
}

/* ─── Field ───────────────────────────────────────────────────── */
interface FieldProps {
  index: number;
  label: string;
  hint?: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
  maxLength?: number;
  autoComplete?: string;
  placeholder?: string;
}

function Field({
  index, label, hint, type, value, onChange, onBlur,
  error, touched, maxLength, autoComplete, placeholder,
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error && !!touched;

  return (
    <div>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '9px',
            letterSpacing: '0.05em',
            color: hasError ? 'rgba(239,68,68,0.7)' : focused ? '#e2a9f1' : 'rgba(226,169,241,0.4)',
            transition: 'color 0.2s',
            fontWeight: 400,
          }}>
            {String(index).padStart(2, '0')}
          </span>
          <div style={{ width: '1px', height: '11px', background: 'rgba(226,169,241,0.15)' }} />
          <label style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '9px',
            letterSpacing: '0.34em',
            color: hasError ? 'rgba(239,68,68,0.75)' : focused ? 'rgba(226,169,241,0.9)' : 'rgba(226,169,241,0.6)',
            transition: 'color 0.2s',
            userSelect: 'none',
          }}>
            {label}
          </label>
        </div>
        {hint && (
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '8px',
            color: 'rgba(255,255,255,0.18)',
            letterSpacing: '0.1em',
          }}>
            {hint}
          </span>
        )}
      </div>

      {/* Input wrapper */}
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur(); }}
          maxLength={maxLength}
          autoComplete={autoComplete}
          style={{
            width: '100%',
            background: focused
              ? 'rgba(226,169,241,0.06)'
              : hasError
                ? 'rgba(239,68,68,0.04)'
                : 'rgba(255,255,255,0.035)',
            border: hasError
              ? '1px solid rgba(239,68,68,0.55)'
              : focused
                ? '1px solid rgba(226,169,241,0.65)'
                : '1px solid rgba(255,255,255,0.1)',
            boxShadow: focused
              ? hasError
                ? '0 0 0 3px rgba(239,68,68,0.1)'
                : '0 0 0 3px rgba(226,169,241,0.12), inset 0 1px 0 rgba(226,169,241,0.04)'
              : 'inset 0 1px 0 rgba(255,255,255,0.03)',
            outline: 'none',
            color: 'white',
            fontSize: '16px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 400,
            padding: '15px 18px',
            letterSpacing: '0',
            caretColor: '#e2a9f1',
            transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
            borderRadius: '0',
          }}
        />

        {/* Focus left-edge accent */}
        <motion.div
          animate={{ opacity: focused ? 1 : 0, scaleY: focused ? 1 : 0.4 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: '2px',
            background: hasError
              ? 'rgba(239,68,68,0.8)'
              : 'linear-gradient(180deg, transparent, #e2a9f1, transparent)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Error */}
      <AnimatePresence>
        {hasError && (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '8px',
              color: 'rgba(239,68,68,0.7)',
              marginTop: '8px',
              letterSpacing: '0.1em',
              overflow: 'hidden',
            }}
          >
            ↳ {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Role selector ──────────────────────────────────────────── */
function RoleSelector({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  const options: { key: Role; label: string }[] = [
    { key: 'artist', label: 'ARTIST' },
    { key: 'enthusiast', label: 'MUSIC ENTHUSIAST' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '9px',
          letterSpacing: '0.05em',
          color: 'rgba(226,169,241,0.4)',
          fontWeight: 400,
        }}>00</span>
        <div style={{ width: '1px', height: '11px', background: 'rgba(226,169,241,0.15)' }} />
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '9px',
          letterSpacing: '0.34em',
          color: 'rgba(226,169,241,0.6)',
          userSelect: 'none',
        }}>I AM A</span>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        {options.map(({ key, label }) => {
          const active = value === key;
          return (
            <motion.button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              whileTap={{ scale: 0.98 }}
              style={{
                flex: 1,
                height: '52px',
                background: active ? 'rgba(226,169,241,0.12)' : 'rgba(255,255,255,0.035)',
                border: active ? '1px solid rgba(226,169,241,0.65)' : '1px solid rgba(255,255,255,0.1)',
                boxShadow: active ? '0 0 0 3px rgba(226,169,241,0.12), inset 0 1px 0 rgba(226,169,241,0.04)' : 'inset 0 1px 0 rgba(255,255,255,0.03)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
                borderRadius: 0,
              }}
            >
              {/* Left-edge accent when active */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px',
                background: active ? 'linear-gradient(180deg, transparent, #e2a9f1, transparent)' : 'transparent',
                transition: 'background 0.2s',
                pointerEvents: 'none',
              }} />
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '9px',
                letterSpacing: '0.3em',
                color: active ? '#e2a9f1' : 'rgba(255,255,255,0.35)',
                transition: 'color 0.2s',
              }}>{label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Submit button ──────────────────────────────────────────── */
function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [shimmerKey, setShimmerKey] = useState(0);

  return (
    <motion.button
      type="submit"
      disabled={isSubmitting}
      onHoverStart={() => { setHovered(true); setShimmerKey(k => k + 1); }}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.99 }}
      style={{
        position: 'relative',
        width: '100%',
        height: '58px',
        background: '#e2a9f1',
        border: 'none',
        cursor: isSubmitting ? 'not-allowed' : 'pointer',
        overflow: 'hidden',
        opacity: isSubmitting ? 0.6 : 1,
        transition: 'opacity 0.2s',
        borderRadius: '0',
      }}
    >
      {/* Shimmer */}
      <motion.div
        key={shimmerKey}
        initial={{ x: '-100%' }}
        animate={{ x: '260%' }}
        transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(108deg, transparent 20%, rgba(255,255,255,0.25) 50%, transparent 80%)',
        }}
      />

      {isSubmitting ? (
        <div style={{ display: 'flex', gap: '7px', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              animate={{ scale: [1, 1.7, 1], opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
              style={{ display: 'block', width: '4px', height: '4px', borderRadius: '50%', background: '#0a0a0a' }}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', position: 'relative' }}>
          <motion.span
            animate={{ x: hovered ? -8 : 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.48em',
              color: '#080808',
              paddingLeft: '0.48em',
            }}
          >
            SUBMIT
          </motion.span>
          <motion.span
            animate={{ x: hovered ? 6 : -4, opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={{ fontSize: '17px', color: '#080808', lineHeight: 1 }}
          >
            →
          </motion.span>
        </div>
      )}
    </motion.button>
  );
}

/* ─── Check icon ─────────────────────────────────────────────── */
function CheckIcon() {
  return (
    <svg viewBox="0 0 52 52" width="52" height="52" fill="none">
      <motion.circle
        cx="26" cy="26" r="23"
        stroke="rgba(226,169,241,0.4)" strokeWidth="1" fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.55, delay: 0.1 }}
      />
      <motion.path
        d="M 15 26 l 9 9 l 13 -14"
        stroke="#e2a9f1" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.5, ease: 'easeOut' }}
      />
    </svg>
  );
}

/* ─── Success modal ──────────────────────────────────────────── */
function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 100, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(14px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="relative flex flex-col items-center"
        style={{
          background: '#100e18',
          border: '1px solid rgba(226,169,241,0.2)',
          width: '380px', maxWidth: '90vw',
          padding: '56px 40px 48px',
          boxShadow: '0 0 0 1px rgba(226,169,241,0.05), 0 32px 80px rgba(0,0,0,0.7)',
        }}
        initial={{ scale: 0.78, opacity: 0, y: 28 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.6), transparent)',
        }} />

        <button onClick={onClose} style={{
          position: 'absolute', top: '18px', right: '18px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.2)', padding: '4px', lineHeight: 0, transition: 'color 0.2s',
        }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.2)')}
        >
          <X size={15} />
        </button>

        <div style={{ marginBottom: '28px' }}><CheckIcon /></div>

        <h2 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '22px', fontWeight: 700, color: 'white',
          marginBottom: '10px', textAlign: 'center', letterSpacing: '-0.02em',
        }}>
          You're on the list.
        </h2>
        <p style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '8.5px', color: 'rgba(255,255,255,0.28)',
          letterSpacing: '0.08em', textAlign: 'center',
          marginBottom: '40px', lineHeight: 2,
        }}>
          WE'LL REACH OUT WHEN THE TIME IS RIGHT.
        </p>

        {[
          { href: 'https://chat.whatsapp.com/REPLACE_WITH_YOUR_LINK', icon: <MessageCircle size={14} color="#25D366" />, label: 'JOIN WHATSAPP COMMUNITY', hb: 'rgba(37,211,102,0.3)', bg: 'rgba(37,211,102,0.05)', mb: '10px' },
          { href: 'https://instagram.com/gigcultureindia', icon: <Instagram size={14} color="#e2a9f1" />, label: 'FOLLOW ON INSTAGRAM', hb: 'rgba(226,169,241,0.35)', bg: 'rgba(226,169,241,0.05)', mb: '0' },
        ].map(({ href, icon, label, hb, bg, mb }, i) => (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '14px 20px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', textDecoration: 'none', transition: 'all 0.2s', marginBottom: mb }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = hb; el.style.background = bg; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = 'rgba(255,255,255,0.08)'; el.style.background = 'transparent'; }}
          >
            {icon}
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8.5px', letterSpacing: '0.36em', color: 'rgba(255,255,255,0.55)' }}>{label}</span>
          </a>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ─── Section ─────────────────────────────────────────────────── */
export default function WaitlistSection() {
  const [formData, setFormData] = useState<FormData>({ fullName: '', city: '', phone: '' });
  const [role, setRole] = useState<Role>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(p => ({ ...p, [k]: val }));
    if (touched[k]) setErrors(p => ({ ...p, [k]: validate({ ...formData, [k]: val })[k] }));
  };

  const blur = (k: keyof FormData) => () => {
    setTouched(p => ({ ...p, [k]: true }));
    setErrors(p => ({ ...p, [k]: validate(formData)[k] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ fullName: true, city: true, phone: true });
    const errs = validate(formData);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setIsSubmitting(true);
    // TODO: Supabase insert — table: waitlist, columns: full_name, city, phone, role
    await new Promise(r => setTimeout(r, 1100));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <section
      id="waitlist"
      className="relative w-full min-h-screen bg-[#050505] flex flex-col items-center justify-center"
      style={{ padding: '100px 24px 120px' }}
    >
      {/* Ambient glow behind the card */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '700px', height: '700px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(226,169,241,0.05) 0%, transparent 65%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* ── Heading ──────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: '56px', position: 'relative', zIndex: 1 }}>
        <div aria-hidden style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          fontSize: 'clamp(88px, 20vw, 172px)',
          lineHeight: 1,
          color: 'rgba(226,169,241,0.025)',
          letterSpacing: '-0.05em',
          marginBottom: '-0.14em',
          userSelect: 'none',
          pointerEvents: 'none',
        }}>001</div>

        <h2 style={{
          position: 'relative',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          fontSize: 'clamp(2.2rem, 6vw, 4rem)',
          lineHeight: 0.9,
          letterSpacing: '-0.025em',
          color: 'white',
          marginBottom: '20px',
        }}>
          JOIN THE<br /><span style={{ color: '#e2a9f1' }}>WAITLIST</span>
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
          <div style={{ width: '24px', height: '1px', background: 'rgba(226,169,241,0.2)' }} />
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '8.5px', letterSpacing: '0.38em', color: 'rgba(255,255,255,0.22)' }}>
            DROP YOUR DETAILS
          </p>
          <div style={{ width: '24px', height: '1px', background: 'rgba(226,169,241,0.2)' }} />
        </div>
      </div>

      {/* ── Form card ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '520px',
          background: '#0f0d18',
          border: '1px solid rgba(226,169,241,0.16)',
          boxShadow: [
            '0 0 0 1px rgba(226,169,241,0.04)',
            '0 32px 80px rgba(0,0,0,0.65)',
            '0 0 100px rgba(226,169,241,0.05)',
            'inset 0 1px 0 rgba(226,169,241,0.1)',
          ].join(', '),
          padding: '40px 40px 40px',
          zIndex: 1,
        }}
      >
        {/* Top lavender accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(226,169,241,0.7) 50%, transparent 100%)',
        }} />

        {/* Card header row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '36px',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '8px', letterSpacing: '0.4em',
            color: 'rgba(226,169,241,0.5)',
          }}>
            EARLY ACCESS
          </span>
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '8px', letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.12)',
          }}>
            3 FIELDS
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <RoleSelector value={role} onChange={setRole} />
            <Field
              index={1} label="FULL NAME" placeholder="Your full name"
              type="text" value={formData.fullName}
              onChange={update('fullName')} onBlur={blur('fullName')}
              error={errors.fullName} touched={touched.fullName}
              autoComplete="name"
            />
            <Field
              index={2} label="CITY" placeholder="Where are you based?"
              type="text" value={formData.city}
              onChange={update('city')} onBlur={blur('city')}
              error={errors.city} touched={touched.city}
              autoComplete="address-level2"
            />
            <Field
              index={3} label="PHONE NUMBER" placeholder="10-digit mobile number"
              type="tel" value={formData.phone}
              onChange={update('phone')} onBlur={blur('phone')}
              error={errors.phone} touched={touched.phone}
              autoComplete="tel" maxLength={10}
              hint="INDIA"
            />
          </div>

          <div style={{ marginTop: '36px' }}>
            <SubmitButton isSubmitting={isSubmitting} />
          </div>
        </form>
      </motion.div>

      <AnimatePresence>
        {submitted && <SuccessModal onClose={() => setSubmitted(false)} />}
      </AnimatePresence>
    </section>
  );
}
