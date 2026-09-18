# GCI Music Academy — Project Context

This file bootstraps Claude Code sessions for the **GCI Music Academy** website. Read this in full before writing any code.

## What this is

GCI Music Academy is a vertical under **Gig Culture India (GCI)** — the parent is a managed two-sided marketplace connecting independent live artists with event hosts, powered by an AI vibe-match engine. The Academy is a separate, DJ-education arm run out of a physical studio in **Gurugram**. It is a distinct product with its own site and its own conversion flows, but it shares the marketplace's visual identity — same theme, same brand system (see below). Boldness here comes from how that theme is pushed (scale, contrast, motion), not from a different look.

**This site has exactly two products. Do not invent a third.**

1. **The Masterclass** — ₹179, one-time, in-studio (Gurugram). Top-of-funnel. Razorpay checkout. Capacity-capped registration.
2. **The DJ Course** — paid, in-studio (same Gurugram studio). The actual revenue product. Razorpay checkout.

The masterclass exists to feed the course. Every masterclass registrant should be trackable through to course enrollment. This relationship should be visible in the site's structure (e.g. an explicit "start here → go deeper" pathway), not just two disconnected pages.

## Audit-first gate — mandatory before building

Per GCI's standing rule: **never design or build against invented or unimplemented fields.** Before wiring up real forms, checkout, or data display:

- [ ] Confirm actual course fee, batch dates/cadence, curriculum modules, and format (in-studio only, or hybrid?)
- [ ] Confirm masterclass studio seat capacity (hard cap for the registration form)
- [ ] Confirm masterclass cadence — one-off event or recurring on a schedule?
- [ ] Confirm instructor/mentor name(s) and real credentials for both masterclass and course
- [ ] Confirm Gurugram studio address and whether a map embed is wanted
- [ ] Confirm payment processor is Razorpay, and whether it's hosted Payment Pages or Checkout.js embedded in the React site
- [ ] Confirm whether WhatsApp Business API is available for confirmations/reminders, or if v1 is email-only
- [ ] Confirm what real outcome/proof content exists (named students, named gigs) — do not fabricate testimonials or stats

Anywhere real data isn't confirmed yet, use clearly-marked placeholder tokens (e.g. `[COURSE FEE]`, `[BATCH START DATE]`) rather than plausible-sounding invented numbers. Surface the gap to the user explicitly rather than papering over it.

## Site structure

**Home**
- Hero: dual entry point — Masterclass (low-commitment, visually primary) and Course (high-commitment) — not a single generic CTA
- "Why GCI Music Academy" — the real differentiator is the parent marketplace: certified students plug into an actual live-booking pipeline, not just a diploma
- Instructor credibility
- Outcome proof (only once real proof is confirmed)
- Pathway strip: Masterclass → Course

**Masterclass page**
- What's covered, duration, instructor
- Date/time, Gurugram studio address, map
- Seats remaining (live, tied to a capacity cap)
- Registration form: name, phone, email, experience level — no payment
- If full: waitlist form (same fields, different status)
- FAQ (what to bring, beginner-friendly?, parking/access)

**Course page**
- Curriculum by module (real modules only)
- Format, batch dates, equipment used
- Fees, EMI options if any, refund/cancellation policy
- FAQ
- Sticky "Enroll Now" → Razorpay checkout

**Checkout (both masterclass at ₹179 and course)**
- Minimal fields, Razorpay-hosted or embedded Checkout.js
- Trust badges, refund policy link visible at point of payment
- Post-payment: confirmation email + batch details + WhatsApp group link

## Data model implications

- `masterclass_registrations`: name, phone, email, experience_level, status (`registered` / `waitlisted` / `attended` / `no_show` / `contacted` / `enrolled` / `not_interested`), timestamp — capacity-enforced against the studio seat cap
- `course_enrollments`: linked to Razorpay payment reference, batch_id, student details
- Link masterclass → course records by email/phone to measure masterclass-to-course conversion — this is the number that proves the masterclass is worth running
- Automated trigger for confirmation/reminder/follow-up messaging (email at minimum, WhatsApp if available)

## Brand system

The Academy uses the **same theme as the GCI marketplace** — no separate identity, no new accent color. Bold and loud comes from scale, contrast, layout, and motion, not from a different palette:

- **Ink** `#0a0a0a` — primary background
- **Ink-2** `#141414` — elevated surface / cards
- **Lavender** `#E8DEFA` — the only accent. Used at full strength for CTAs, headline emphasis, and inverted color-block sections (lavender fill, ink text) where the design needs a loud moment; used dimmed (`#b6a9d6`) for secondary copy and labels.
- **Type**: Space Grotesk (display + body), JetBrains Mono (labels, prices, timestamps, module numbers) — same pairing as the marketplace
- **Signature motif**: an animated equalizer/waveform bar pattern in lavender — pulls directly from the subject (DJ / live audio) rather than a generic decorative device. Used in the hero, as section dividers, and as a hover/loading state.
- **Loudness devices**: oversized bleeding display type, a scrolling ticker strip as a full lavender-on-ink inverted block, bracketed index numbers on real sequences (course modules, the masterclass→course pathway) — the same marginalia/index-number language as the marketplace's artist cards and profile pages, just pushed to a bigger scale here.
- Photography treatment: duotone (ink + lavender), identical to the marketplace's photographic language — this is what keeps the two properties reading as one brand.

## Tech stack

- React + Tailwind CSS (matches the main GCI frontend)
- `academy-landing-page.html` (alongside this file) is the actual landing page layout and design system — build it out as React components rather than starting from scratch. Wire up real form logic and Razorpay checkout once the audit-first checklist above is confirmed.
- Confirm monorepo vs. standalone repo for the Academy site before scaffolding.

## Voice

Bold and a little loud, but specific — plain verbs, active voice, no filler. Say what a person gets ("Enroll now," "Register — it's free," not "Submit"). Outcome proof should be concrete and named, never generic superlatives. This is a DJ academy: confident, physical, a little rough around the edges — not corporate-EdTech, not startup-SaaS.
