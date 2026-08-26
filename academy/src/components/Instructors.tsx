import { loadSettings } from '../admin/settings'
import type { Instructor, SocialLink } from '../admin/settings'

function SocialIcon({ platform }: { platform: SocialLink['platform'] }) {
  const labels: Record<SocialLink['platform'], string> = {
    soundcloud: 'SoundCloud',
    instagram: 'Instagram',
    youtube: 'YouTube',
    spotify: 'Spotify',
    website: 'Website',
  }
  return <span>{labels[platform]}</span>
}

function LeadInstructor({ inst }: { inst: Instructor }) {
  return (
    <div className="flex flex-col md:flex-row" style={{ background: '#0f0d18', border: '1px solid rgba(226,169,241,0.12)', position: 'relative', overflow: 'hidden', marginBottom: '1px' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.6), transparent)', zIndex: 2 }} />

      {/* Photo — left column */}
      <div style={{ flex: '0 0 42%', minHeight: '480px', position: 'relative', overflow: 'hidden' }}>
        {inst.photoUrl ? (
          <>
            <img
              src={inst.photoUrl}
              alt={inst.name}
              style={{
                width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%',
                display: 'block',
                filter: 'grayscale(80%) contrast(1.08) brightness(1.1)',
                position: 'absolute', inset: 0,
              }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 60%, #0f0d18 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(226,169,241,0.04)' }} />
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'rgba(226,169,241,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '56px', fontWeight: 800, color: 'rgba(226,169,241,0.15)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {inst.initials || inst.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Content — right column */}
      <div style={{ flex: 1, padding: '48px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(226,169,241,0.4)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '20px' }}>
          Lead Instructor
        </div>

        <h3 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: '8px' }}>
          {inst.name}
        </h3>

        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#e2a9f1', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '28px' }}>
          {inst.role}
        </div>

        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: '440px', marginBottom: '28px' }}>
          {inst.bio}
        </p>

        {/* Credential lines */}
        {inst.credentialLines && inst.credentialLines.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
            {inst.credentialLines.map((line, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#e2a9f1', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{line}</span>
              </div>
            ))}
          </div>
        )}

        {/* Social links */}
        {inst.socialLinks && inst.socialLinks.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {inst.socialLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '8px',
                  color: 'rgba(226,169,241,0.5)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  border: '1px solid rgba(226,169,241,0.18)',
                  padding: '6px 12px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#e2a9f1'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(226,169,241,0.4)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(226,169,241,0.5)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(226,169,241,0.18)' }}
              >
                <SocialIcon platform={link.platform} />
                {link.label && <span style={{ marginLeft: '4px' }}>{link.label}</span>}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SecondaryInstructor({ inst }: { inst: Instructor }) {
  return (
    <div style={{ background: '#0f0d18', border: '1px solid rgba(226,169,241,0.1)', display: 'flex', gap: '20px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.3), transparent)' }} />

      {inst.photoUrl ? (
        <div style={{ flexShrink: 0, width: '72px', height: '72px', overflow: 'hidden', borderRadius: '2px' }}>
          <img src={inst.photoUrl} alt={inst.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(80%)' }} />
        </div>
      ) : (
        <div style={{ flexShrink: 0, width: '72px', height: '72px', background: 'rgba(226,169,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontWeight: 700, color: '#e2a9f1', fontSize: '16px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{inst.initials || inst.name.slice(0, 2).toUpperCase()}</span>
        </div>
      )}

      <div>
        <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: '4px' }}>{inst.name}</div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(226,169,241,0.55)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '10px' }}>{inst.role}</div>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{inst.bio}</p>
      </div>
    </div>
  )
}

function PlaceholderLead() {
  return (
    <div style={{ background: '#0f0d18', border: '1px solid rgba(226,169,241,0.1)', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.4), transparent)' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', background: 'rgba(226,169,241,0.07)', margin: '0 auto 16px' }} />
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em' }}>[INSTRUCTOR TBC]</div>
      </div>
    </div>
  )
}

export default function Instructors() {
  const { instructors } = loadSettings()

  const lead = instructors.find(i => i.isLead) ?? instructors[0]
  const secondary = instructors.filter(i => !i.isLead || i !== lead)

  return (
    <section id="instructors" style={{ padding: '112px 24px', background: '#050505' }}>
      <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(226,169,241,0.4)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Taught by
          </p>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Practitioners.<br /><span style={{ color: '#e2a9f1' }}>Not academics.</span>
          </h2>
        </div>

        {instructors.length === 0 ? (
          <PlaceholderLead />
        ) : (
          <>
            {lead && <LeadInstructor inst={lead} />}
            {secondary.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1px', marginTop: '1px', background: 'rgba(226,169,241,0.08)' }}>
                {secondary.map(inst => <SecondaryInstructor key={inst.id} inst={inst} />)}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
