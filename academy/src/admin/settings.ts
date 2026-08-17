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
}

export interface MasterclassSettings {
  date: string
  time: string
  duration: string
  studioName: string
  studioAddress: string
  mapEmbedUrl: string
  seatCap: number
  isActive: boolean
  cadence: 'one-off' | 'recurring' | ''
  recurringSchedule: string
  whatsInside: string
}

export interface Instructor {
  id: string
  name: string
  role: string
  bio: string
  initials: string
  photoUrl: string
  isLead: boolean
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
  hero: {
    cohortLabel: string
    tagline: string
    subheadline: string
  }
  updatedAt: string
}

export const DEFAULT_SETTINGS: AcademySettings = {
  course: {
    fee: '',
    currency: 'INR',
    batchStartDate: '',
    batchEndDate: '',
    schedule: '',
    format: '',
    equipmentUsed: '',
    emiAvailable: false,
    emiDetails: '',
    seatCap: 0,
    isActive: true,
    refundPolicy: '',
  },
  masterclass: {
    date: '',
    time: '',
    duration: '',
    studioName: 'GCI Studio',
    studioAddress: '',
    mapEmbedUrl: '',
    seatCap: 0,
    isActive: true,
    cadence: '',
    recurringSchedule: '',
    whatsInside: '',
  },
  instructors: [],
  curriculum: [],
  hero: {
    cohortLabel: 'Cohort 1 — Applications Open',
    tagline: 'Learn to book gigs.\nGet paid doing what you love.',
    subheadline: 'GCI Academy is a hands-on, cohort-based DJ education program run out of our Gurugram studio.',
  },
  updatedAt: '',
}

const STORAGE_KEY = 'academy_settings'

export function loadSettings(): AcademySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_SETTINGS)
    return { ...structuredClone(DEFAULT_SETTINGS), ...JSON.parse(raw) }
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
