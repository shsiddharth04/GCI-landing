import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Instagram, MessageCircle } from 'lucide-react';

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
  else if (!phoneRe.test(d.phone.trim()))
    e.phone = 'Enter a valid 10-digit mobile number';
  return e;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 52 52" width="48" height="48" fill="none">
      <motion.circle
        cx="26"
        cy="26"
        r="23"
        stroke="rgba(226,169,241,0.35)"
        strokeWidth="1"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
      />
      <motion.path
        d="M 15 26 l 9 9 l 13 -14"
        stroke="#e2a9f1"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.45, ease: 'easeOut' }}
      />
    </svg>
  );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 100, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onClose}
    >
      <motion.div
        className="relative flex flex-col items-center"
        style={{
          background: '#0b0b0b',
          border: '1px solid rgba(226,169,241,0.16)',
          width: '360px',
          maxWidth: '90vw',
          padding: '52px 36px 44px',
        }}
        initial={{ scale: 0.82, opacity: 0, y: 18 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 8 }}
        transition={{ type: 'spring', stiffness: 290, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.3)',
            padding: '4px',
            lineHeight: 0,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = 'white')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)')
          }
        >
          <X size={15} />
        </button>

        <div style={{ marginBottom: '26px' }}>
          <CheckIcon />
        </div>

        <h2
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '20px',
            fontWeight: 600,
            color: 'white',
            marginBottom: '8px',
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}
        >
          You're on the list.
        </h2>
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '9px',
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.06em',
            textAlign: 'center',
            marginBottom: '36px',
            lineHeight: 1.8,
          }}
        >
          WE'LL REACH OUT WHEN THE TIME IS RIGHT.
        </p>

        {/* WhatsApp — update href with your community link */}
        <a
          href="https://chat.whatsapp.com/REPLACE_WITH_YOUR_LINK"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-3 mb-2.5"
          style={{
            padding: '13px 20px',
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'transparent',
            textDecoration: 'none',
            transition: 'border-color 0.2s, background 0.2s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.borderColor = 'rgba(37,211,102,0.25)';
            el.style.background = 'rgba(37,211,102,0.04)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.borderColor = 'rgba(255,255,255,0.07)';
            el.style.background = 'transparent';
          }}
        >
          <MessageCircle size={14} color="#25D366" />
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '8.5px',
              letterSpacing: '0.34em',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            JOIN WHATSAPP COMMUNITY
          </span>
        </a>

        {/* Instagram */}
        <a
          href="https://instagram.com/gigcultureindia"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-3"
          style={{
            padding: '13px 20px',
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'transparent',
            textDecoration: 'none',
            transition: 'border-color 0.2s, background 0.2s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.borderColor = 'rgba(226,169,241,0.3)';
            el.style.background = 'rgba(226,169,241,0.04)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.borderColor = 'rgba(255,255,255,0.07)';
            el.style.background = 'transparent';
          }}
        >
          <Instagram size={14} color="#e2a9f1" />
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '8.5px',
              letterSpacing: '0.34em',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            FOLLOW ON INSTAGRAM
          </span>
        </a>
      </motion.div>
    </motion.div>
  );
}

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: '100%',
  background: 'transparent',
  border: `1px solid ${hasError ? 'rgba(239,68,68,0.45)' : 'rgba(255,255,255,0.09)'}`,
  padding: '14px 16px',
  color: 'white',
  fontSize: '14px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  outline: 'none',
  transition: 'border-color 0.2s',
  WebkitAppearance: 'none',
});

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'Space Mono', monospace",
  fontSize: '8.5px',
  letterSpacing: '0.38em',
  color: 'rgba(255,255,255,0.38)',
  marginBottom: '9px',
};

const errStyle: React.CSSProperties = {
  fontFamily: "'Space Mono', monospace",
  fontSize: '8.5px',
  color: 'rgba(239,68,68,0.65)',
  marginTop: '7px',
  letterSpacing: '0.03em',
};

export default function WaitlistSection() {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    city: '',
    phone: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((p) => ({ ...p, [k]: val }));
    if (touched[k]) {
      const errs = validate({ ...formData, [k]: val });
      setErrors((p) => ({ ...p, [k]: errs[k] }));
    }
  };

  const blur = (k: keyof FormData) => () => {
    setTouched((p) => ({ ...p, [k]: true }));
    const errs = validate(formData);
    setErrors((p) => ({ ...p, [k]: errs[k] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ fullName: true, email: true, city: true, phone: true });
    const errs = validate(formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setIsSubmitting(true);
    // TODO: replace with Supabase insert — table: waitlist, columns: full_name, email, city, phone
    await new Promise((r) => setTimeout(r, 950));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <section
      id="waitlist"
      className="relative w-full min-h-screen flex flex-col items-center justify-center bg-[#050505]"
      style={{ padding: '80px 24px' }}
    >
      {/* Vertical pin from hero */}
      <div
        style={{
          width: '1px',
          height: '56px',
          background:
            'linear-gradient(180deg, transparent, rgba(226,169,241,0.18), transparent)',
          marginBottom: '64px',
        }}
      />

      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Label row */}
        <div className="flex items-center gap-4" style={{ marginBottom: '44px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(226,169,241,0.12)' }} />
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '8.5px',
              letterSpacing: '0.46em',
              color: 'rgba(226,169,241,0.55)',
            }}
          >
            EARLY ACCESS
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(226,169,241,0.12)' }} />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

            {/* Full Name */}
            <div>
              <label style={labelStyle}>FULL NAME</label>
              <input
                type="text"
                placeholder="Your full name"
                value={formData.fullName}
                onChange={update('fullName')}
                onBlur={blur('fullName')}
                style={inputStyle(!!errors.fullName && !!touched.fullName)}
                autoComplete="name"
              />
              {errors.fullName && touched.fullName && (
                <p style={errStyle}>{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>EMAIL</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={update('email')}
                onBlur={blur('email')}
                style={inputStyle(!!errors.email && !!touched.email)}
                autoComplete="email"
              />
              {errors.email && touched.email && (
                <p style={errStyle}>{errors.email}</p>
              )}
            </div>

            {/* City */}
            <div>
              <label style={labelStyle}>CITY</label>
              <input
                type="text"
                placeholder="Where are you based?"
                value={formData.city}
                onChange={update('city')}
                onBlur={blur('city')}
                style={inputStyle(!!errors.city && !!touched.city)}
                autoComplete="address-level2"
              />
              {errors.city && touched.city && (
                <p style={errStyle}>{errors.city}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label style={labelStyle}>PHONE NUMBER</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={update('phone')}
                onBlur={blur('phone')}
                style={inputStyle(!!errors.phone && !!touched.phone)}
                autoComplete="tel"
                maxLength={10}
              />
              {errors.phone && touched.phone && (
                <p style={errStyle}>{errors.phone}</p>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                padding: '16px',
                background: isSubmitting ? 'rgba(226,169,241,0.5)' : '#e2a9f1',
                border: 'none',
                color: '#050505',
                fontFamily: "'Space Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.42em',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                marginTop: '10px',
              }}
            >
              {isSubmitting ? '· · ·' : 'SUBMIT'}
            </motion.button>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {submitted && <SuccessModal onClose={() => setSubmitted(false)} />}
      </AnimatePresence>
    </section>
  );
}
