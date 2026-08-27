export interface SocialLink {
  platform: 'soundcloud' | 'instagram' | 'youtube' | 'spotify' | 'website'
  url: string
  label?: string
}

export interface GalleryItem {
  type: 'image' | 'video'
  src: string
  alt: string
  poster?: string
}

export interface PaymentPlan {
  label: string
  dueSchedule: string
  note?: string
  isHighlighted?: boolean
}

export interface CourseSettings {
  fee: string
  currency: string
  batchStartDate: string
  batchEndDate: string
  schedule: string
  format: 'in-studio' | 'hybrid' | ''
  equipmentUsed: string
  emiAvailable: boolean
  emiDetails: string
  seatCap: number
  isActive: boolean
  refundPolicy: string
  paymentPlans: PaymentPlan[]
}

export interface MasterclassSettings {
  date: string
  time: string
  duration: string
  studioName: string
  studioAddress: string
  secondStudioAddress: string
  mapEmbedUrl: string
  seatCap: number
  isActive: boolean
  cadence: 'one-off' | 'recurring' | ''
  recurringSchedule: string
  whatsInside: string
  // Slot schedule config
  scheduleOpenTime: string   // '11:00' — first slot starts here
  scheduleCloseTime: string  // '20:00' — last slot must end by here
  slotMinutes: number        // 30
  slotCapacity: number       // 3 per slot
  scheduleDaysAhead: number  // how many days ahead to show (14)
}

export interface Instructor {
  id: string
  name: string
  role: string
  bio: string
  initials: string
  photoUrl: string
  isLead: boolean
  socialLinks?: SocialLink[]
  credentialLines?: string[]
}

export interface CurriculumModule {
  id: string
  weekLabel: string
  title: string
  description: string
  order: number
}

export interface AcademySettings {
  course: CourseSettings
  masterclass: MasterclassSettings
  instructors: Instructor[]
  curriculum: CurriculumModule[]
  studioGallery: GalleryItem[]
  hero: {
    cohortLabel: string
    tagline: string
    subheadline: string
  }
  updatedAt: string
}

export const DEFAULT_SETTINGS: AcademySettings = {
  course: {
    fee: '22200',
    currency: 'INR',
    batchStartDate: '',
    batchEndDate: '',
    schedule: '',
    format: 'in-studio',
    equipmentUsed: 'Pioneer XDJ-RX3, Sennheiser HD 25 Plus, Studio Monitors, Rekordbox',
    emiAvailable: false,
    emiDetails: '',
    seatCap: 3,
    isActive: true,
    refundPolicy: '₹2,000 is required to confirm your seat and is non-refundable. 50% of the remaining fee is due after your first session. The balance is due before your 5th session.',
    paymentPlans: [
      {
        label: '3-part instalment',
        dueSchedule: '₹2,000 now to book your seat. 50% of the remaining fee after your first session. The other 50% before your 5th session.',
        note: 'The ₹2,000 seat deposit is non-refundable.',
        isHighlighted: true,
      },
      {
        label: 'Full payment',
        dueSchedule: 'Full fee due before the first session.',
        note: 'Straightforward. No follow-up.',
        isHighlighted: false,
      },
    ],
  },
  masterclass: {
    date: '',
    time: '',
    duration: '',
    studioName: 'GCI Studio, Gurugram',
    studioAddress: '11th Floor, Capital Tower, Next To CDS Tower, Sector 20, Gurugram',
    secondStudioAddress: 'DLF Phase 3, V Block, Sector 24, Gurugram',
    mapEmbedUrl: '',
    seatCap: 0,
    isActive: true,
    cadence: 'one-off',
    recurringSchedule: '',
    whatsInside: 'A hands-on session inside GCI Studio, Gurugram. Get behind the Pioneer XDJ-RX3, understand signal flow, and feel what DJing actually requires. Zero commitment. No payment, no prerequisites. Just show up.',
    scheduleOpenTime: '11:00',
    scheduleCloseTime: '20:00',
    slotMinutes: 30,
    slotCapacity: 3,
    scheduleDaysAhead: 14,
  },
  instructors: [
    {
      id: 'divith',
      name: 'Divith Chowdhary',
      role: 'Founder & Lead Instructor · DJ UNTITLED.',
      bio: 'Founder of GigCultureIndia, performing as UNTITLED. Melodic techno, progressive house, organic house. Trained under the founder of The Music Academy (production credits: Bang Bang, Chennai Express). Builds and teaches this course from real time behind the decks, not a textbook.',
      initials: 'DC',
      photoUrl: '/divith.jpg',
      isLead: true,
      credentialLines: [
        'Performing as UNTITLED.',
        'Trained under the founder of The Music Academy',
        'Founder, Gig Culture India',
      ],
      socialLinks: [
        {
          platform: 'instagram',
          url: 'https://www.instagram.com/untitled.art.ist',
          label: '@untitled.art.ist',
        },
      ],
    },
  ],
  curriculum: [
    { id: '01', weekLabel: 'MOD 01', order: 0, title: 'The DJ Journey: Foundations', description: 'The DJ mindset: discipline, curiosity and consistency. Gear literacy: decoding the tools of the trade. Finding your sonic identity and the style that will define you as an artist.' },
    { id: '02', weekLabel: 'MOD 02', order: 1, title: 'Hands-On Basics', description: 'Studio and equipment setup, signal flow, drop mixing, beatmatching by ear. Applied practice sessions and a beatmatching skills assessment.' },
    { id: '03', weekLabel: 'MOD 03', order: 2, title: 'Pioneer DJ Deep Dive', description: 'Full CDJ architecture and workflow. Mixer controls and FX chains. Creative mixing techniques: going beyond basic transitions into expressive mixing.' },
    { id: '04', weekLabel: 'MOD 04', order: 3, title: 'Mixing & Harmonization', description: 'Harmonic mixing in key using the Camelot wheel. Harmonization techniques for tonal precision: layering and blending tracks so transitions feel musical, not mechanical.' },
    { id: '05', weekLabel: 'MOD 05', order: 4, title: 'Studio Time: Practice Module', description: 'Real-time practice sessions and harmonized set building. Applying every technique learned to build and perform a full, cohesive set.' },
    { id: '06', weekLabel: 'MOD 06', order: 5, title: 'Rekordbox Fundamentals', description: 'Rekordbox setup and workflow. The industry-standard track management and preparation software every professional DJ relies on.' },
    { id: '07', weekLabel: 'MOD 07', order: 6, title: 'Mixing & Mastering Basics', description: 'Mixing vs. mastering: the technical distinction that separates amateur and professional sound. Levels, EQ, and sonic space for clean, balanced output.' },
    { id: '08', weekLabel: 'MOD 08', order: 7, title: 'Career, Gigs & Branding', description: 'How gigs actually happen. Promotion strategy and building artist visibility. Label ecosystem, career development, stage presence, and social media.' },
    { id: '09', weekLabel: 'MOD 09', order: 8, title: 'GigCulture Artist Onboarding', description: 'Upon completion, you are onboarded onto the GigCultureIndia platform as a listed artist. Your profile enters our genre and vibe-matching engine, connecting you to venues, events and organizers actively looking for artists like you.' },
  ],
  studioGallery: [
    { type: 'image', src: '/studio-2.jpg', alt: 'Masterclass session in progress' },
    { type: 'image', src: '/studio-4.jpg', alt: 'Learning on the Pioneer XDJ-RX3' },
    { type: 'image', src: '/studio-3.jpg', alt: 'Hands-on demo class' },
    { type: 'video', src: '/masterclass.mov', alt: 'Demo class footage', poster: '/studio-2.jpg' },
  ],
  hero: {
    cohortLabel: 'Founding Batch · Applications Open',
    tagline: 'Learn to\nread a room.',
    subheadline: 'GCI Academy is a hands-on DJ education program inside our Gurugram studio. Graduate directly onto the GCI booking pipeline, not just with a certificate.',
  },
  updatedAt: '',
}

const STORAGE_KEY = 'academy_settings'

export function loadSettings(): AcademySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_SETTINGS)
    const stored = JSON.parse(raw)
    return {
      ...structuredClone(DEFAULT_SETTINGS),
      ...stored,
      course: { ...structuredClone(DEFAULT_SETTINGS).course, ...stored.course },
      masterclass: { ...structuredClone(DEFAULT_SETTINGS).masterclass, ...stored.masterclass },
      hero: { ...structuredClone(DEFAULT_SETTINGS).hero, ...stored.hero },
      studioGallery: (stored.studioGallery ?? structuredClone(DEFAULT_SETTINGS).studioGallery)
        .filter((g: GalleryItem) => g.src !== '/studio-1.jpg'),
      // curriculum and instructors from storage override defaults entirely
      curriculum: stored.curriculum ?? structuredClone(DEFAULT_SETTINGS).curriculum,
      instructors: stored.instructors ?? structuredClone(DEFAULT_SETTINGS).instructors,
    }
  } catch {
    return structuredClone(DEFAULT_SETTINGS)
  }
}

export function saveSettings(settings: AcademySettings): void {
  settings.updatedAt = new Date().toISOString()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function useSettings() {
  return loadSettings()
}

export function completionScore(s: AcademySettings): { filled: number; total: number; missing: string[] } {
  const missing: string[] = []
  if (!s.course.fee) missing.push('Course fee')
  if (!s.course.batchStartDate) missing.push('Batch start date')
  if (!s.course.format) missing.push('Course format')
  if (!s.course.seatCap) missing.push('Course seat cap')
  if (!s.masterclass.date) missing.push('Masterclass date')
  if (!s.masterclass.time) missing.push('Masterclass time')
  if (!s.masterclass.studioAddress) missing.push('Studio address')
  if (!s.masterclass.seatCap) missing.push('Masterclass seat cap')
  if (s.curriculum.length === 0) missing.push('Curriculum modules')
  if (s.instructors.length === 0) missing.push('Instructors')
  const total = 10
  return { filled: total - missing.length, total, missing }
}
