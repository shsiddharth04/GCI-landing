import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Instagram, MessageCircle } from 'lucide-react';

/* ─── Types & validation ──────────────────────────────────────── */
type FormData = { fullName: string; email: string; city: string; phone: string };
type FormErrors = Partial<Record<keyof FormData, string>>;

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe = /^[6-9]\d{9}$/;

function validate(d: FormData): FormErrors {
  const e: FormErrors = {};
  if (!d.fullName.trim()) e.fullName = 'Required';
  if (!d.email.trim()) e.email = 'Required';
  else if (!emailRe.test(d.email.trim())) e.email = 'Enter a valid email address';
  if (!d.city.trim()) e.city = 'Required';
  if (!d.phone.trim()) e.phone = 'Required';
  else if (!phoneRe.test(d.phone.trim())) e.phone = 'Enter a valid 10-digit mobile number';
  return e;
}

/* ─── Floating-label input ────────────────────────────────────── */
interface InputProps {
  num: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
  maxLength?: number;
  autoComplete?: string;
}

function FloatingInput({
  num, label, type, value, onChange, onBlur, error, touched, maxLength, autoComplete,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;
  const hasError = !!error && !!touched;

  return (
    <div style={{ paddingBottom: '32px' }}>
      <div style={{ display: 'flex', gap: '22px', alignItems: 'flex-start' }}>

        {/* Field number */}
        <motion.div
          animate={{
            color: hasError
              ? 'rgba(239,68,68,0.65)'
              : focused
                ? '#e2a9f1'
                : 'rgba(226,169,241,0.22)',
          }}
          transition={{ duration: 0.25 }}
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.12em',
            lineHeight: 1,
            paddingTop: '38px',
            flexShrink: 0,
            width: '24px',
          }}
        >
          {num}
        </motion.div>

        {/* Input + label */}
        <div style={{ flex: 1, position: 'relative' }}>

          {/* Floating label — starts at input level, lifts on focus/fill */}
          <motion.label
            animate={{
              y: lifted ? 0 : 26,
              scale: lifted ? 1 : 1.6,
              color: hasError
                ? lifted ? 'rgba(239,68,68,0.75)' : 'rgba(239,68,68,0.35)'
                : focused
                  ? 'rgba(226,169,241,0.9)'
                  : lifted
                    ? 'rgba(255,255,255,0.3)'
                    : 'rgba(255,255,255,0.18)',
            }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{
              display: 'block',
              fontFamily: "'Space Mono', monospace",
              fontSize: '8.5px',
              letterSpacing: '0.42em',
              transformOrigin: 'left top',
              pointerEvents: 'none',
              userSelect: 'none',
              paddingTop: '14px',
              lineHeight: 1,
            }}
          >
            {label}
          </motion.label>

          {/* Input */}
          <input
            type={type}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); onBlur(); }}
            maxLength={maxLength}
            autoComplete={autoComplete}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'white',
              fontSize: '22px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 500,
              padding: '6px 0 18px',
              letterSpacing: '-0.015em',
              lineHeight: 1.25,
              caretColor: '#e2a9f1',
            }}
          />

          {/* Animated bottom border */}
          <div style={{ position: 'relative', height: '1px' }}>
            <div
              style={{
                position: 'absolute', inset: 0,
                background: hasError ? 'rgba(239,68,68,0.22)' : 'rgba(255,255,255,0.07)',
              }}
            />
            <motion.div
              animate={{ scaleX: focused ? 1 : 0 }}
              initial={{ scaleX: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 0, 0.1, 1] }}
              style={{
                position: 'absolute', inset: 0,
                background: hasError ? 'rgba(239,68,68,0.65)' : '#e2a9f1',
                transformOrigin: 'left center',
                boxShadow: focused
                  ? `0 0 18px ${hasError ? 'rgba(239,68,68,0.2)' : 'rgba(226,169,241,0.4)'}`
                  : 'none',
              }}
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {hasError && (
              <motion.p
                key="err"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '8px',
                  color: 'rgba(239,68,68,0.6)',
                  marginTop: '9px',
                  letterSpacing: '0.1em',
                }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
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
      whileTap={{ scale: 0.995 }}
      style={{
        position: 'relative',
        width: '100%',
        height: '62px',
        background: '#e2a9f1',
        border: 'none',
        cursor: isSubmitting ? 'not-allowed' : 'pointer',
        overflow: 'hidden',
        marginTop: '12px',
        opacity: isSubmitting ? 0.65 : 1,
        transition: 'opacity 0.25s',
      }}
    >
      {/* Shimmer sweep — re-triggers on each hover */}
      <motion.div
        key={shimmerKey}
        initial={{ x: '-100%' }}
        animate={{ x: '250%' }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'absolute', inset: 0,
          background:
            'linear-gradient(108deg, transparent 25%, rgba(255,255,255,0.22) 50%, transparent 75%)',
          pointerEvents: 'none',
        }}
      />

      {isSubmitting ? (
        /* Pulsing dots */
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.16, ease: 'easeInOut' }}
              style={{
                display: 'block', width: '4px', height: '4px',
                borderRadius: '50%', background: '#050505',
              }}
            />
          ))}
        </div>
      ) : (
        /* Text + arrow */
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', height: '100%', position: 'relative' }}>
          <motion.span
            animate={{ x: hovered ? -6 : 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.46em',
              color: '#050505',
              paddingLeft: '0.46em',
            }}
          >
            SUBMIT
          </motion.span>
          <motion.span
            animate={{ x: hovered ? 6 : 0, opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ fontSize: '16px', color: '#050505', lineHeight: 1 }}
          >
            →
          </motion.span>
        </div>
      )}
    </motion.button>
  );
}

/* ─── Animated check icon ─────────────────────────────────────── */
function CheckIcon() {
  return (
    <svg viewBox="0 0 52 52" width="48" height="48" fill="none">
      <motion.circle
        cx="26" cy="26" r="23"
        stroke="rgba(226,169,241,0.35)" strokeWidth="1" fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
      />
      <motion.path
        d="M 15 26 l 9 9 l 13 -14"
        stroke="#e2a9f1" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.45, ease: 'easeOut' }}
      />
    </svg>
  );
}

/* ─── Success modal ───────────────────────────────────────────── */
function SuccessModal({ onClose }: { onClose: () => void }) {
  const socialLinks = [
    {
      href: 'https://chat.whatsapp.com/REPLACE_WITH_YOUR_LINK',
      icon: <MessageCircle size={14} color="#25D366" />,
      label: 'JOIN WHATSAPP COMMUNITY',
      hoverBorder: 'rgba(37,211,102,0.28)',
      hoverBg: 'rgba(37,211,102,0.05)',
      mb: '10px',
    },
    {
      href: 'https://instagram.com/gigcultureindia',
      icon: <Instagram size={14} color="#e2a9f1" />,
      label: 'FOLLOW ON INSTAGRAM',
      hoverBorder: 'rgba(226,169,241,0.32)',
      hoverBg: 'rgba(226,169,241,0.05)',
      mb: '0',
    },
  ];

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 100, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onClose}
    >
      <motion.div
        className="relative flex flex-col items-center"
        style={{
          background: '#0a0a0a',
          border: '1px solid rgba(226,169,241,0.15)',
          width: '380px',
          maxWidth: '90vw',
          padding: '56px 40px 48px',
        }}
        initial={{ scale: 0.8, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '18px', right: '18px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.25)', padding: '4px', lineHeight: 0,
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.25)')}
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
          WE'LL REACH OUT WHEN<br />THE TIME IS RIGHT.
        </p>

        {socialLinks.map(({ href, icon, label, hoverBorder, hoverBg, mb }, i) => (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              padding: '14px 20px',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'transparent',
              textDecoration: 'none',
              transition: 'border-color 0.2s, background 0.2s',
              marginBottom: mb,
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = hoverBorder;
              el.style.background = hoverBg;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = 'rgba(255,255,255,0.07)';
              el.style.background = 'transparent';
            }}
          >
            {icon}
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '8.5px', letterSpacing: '0.36em',
              color: 'rgba(255,255,255,0.55)',
            }}>{label}</span>
          </a>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ─── Section ─────────────────────────────────────────────────── */
export default function WaitlistSection() {
  const [formData, setFormData] = useState<FormData>({ fullName: '', email: '', city: '', phone: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(p => ({ ...p, [k]: val }));
    if (touched[k]) {
      const errs = validate({ ...formData, [k]: val });
      setErrors(p => ({ ...p, [k]: errs[k] }));
    }
  };

  const blur = (k: keyof FormData) => () => {
    setTouched(p => ({ ...p, [k]: true }));
    const errs = validate(formData);
    setErrors(p => ({ ...p, [k]: errs[k] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ fullName: true, email: true, city: true, phone: true });
    const errs = validate(formData);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setIsSubmitting(true);
    // TODO: Supabase insert — table: waitlist, columns: full_name, email, city, phone
    await new Promise(r => setTimeout(r, 1100));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  const fields: Array<Omit<InputProps, 'onChange' | 'onBlur' | 'error' | 'touched'> & { key: keyof FormData }> = [
    { num: '01', label: 'FULL NAME',       type: 'text',  key: 'fullName', autoComplete: 'name' },
    { num: '02', label: 'EMAIL ADDRESS',   type: 'email', key: 'email',    autoComplete: 'email' },
    { num: '03', label: 'CITY',            type: 'text',  key: 'city',     autoComplete: 'address-level2' },
    { num: '04', label: 'PHONE NUMBER',    type: 'tel',   key: 'phone',    autoComplete: 'tel', maxLength: 10 },
  ];

  return (
    <section
      id="waitlist"
      className="grain relative w-full min-h-screen bg-[#050505] flex flex-col items-center justify-center"
      style={{ padding: '100px 24px 120px' }}
    >
      {/* Section heading ──────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: '72px', position: 'relative' }}>

        {/* Faded ghost number — sits behind heading */}
        <div
          aria-hidden
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(90px, 20vw, 180px)',
            lineHeight: 1,
            color: 'rgba(226,169,241,0.028)',
            letterSpacing: '-0.05em',
            marginBottom: '-0.16em',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          001
        </div>

        <h2 style={{
          position: 'relative',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          fontSize: 'clamp(2.2rem, 6vw, 4rem)',
          lineHeight: 0.9,
          letterSpacing: '-0.025em',
          color: 'white',
          marginBottom: '22px',
        }}>
          JOIN THE<br />
          <span style={{ color: '#e2a9f1' }}>WAITLIST</span>
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div style={{ width: '28px', height: '1px', background: 'rgba(226,169,241,0.18)' }} />
          <p style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '8.5px',
            letterSpacing: '0.38em',
            color: 'rgba(255,255,255,0.2)',
          }}>
            DROP YOUR DETAILS
          </p>
          <div style={{ width: '28px', height: '1px', background: 'rgba(226,169,241,0.18)' }} />
        </div>
      </div>

      {/* Form ─────────────────────────────────────────────────── */}
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <form onSubmit={handleSubmit} noValidate>
          <div>
            {fields.map(({ key, ...rest }) => (
              <FloatingInput
                key={key}
                {...rest}
                value={formData[key]}
                onChange={update(key)}
                onBlur={blur(key)}
                error={errors[key]}
                touched={touched[key]}
              />
            ))}
          </div>
          <SubmitButton isSubmitting={isSubmitting} />
        </form>
      </div>

      <AnimatePresence>
        {submitted && <SuccessModal onClose={() => setSubmitted(false)} />}
      </AnimatePresence>
    </section>
  );
}
