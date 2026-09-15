import { supabase } from './supabase'

export interface Instructor {
  id: string
  name: string
  bio: string | null
  active: boolean
  created_at: string
}

export interface Session {
  id: string
  instructor_id: string | null
  session_type: 'masterclass' | 'course_class' | 'practice_session'
  course_id: string | null
  cohort: 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | null
  session_date: string
  start_time: string
  end_time: string
  location: string
  capacity: number
  seats_booked: number
  status: 'open' | 'full' | 'cancelled' | 'rescheduled'
  rescheduled_from_id: string | null
  lock_owner_type: 'practice_session' | 'masterclass' | null
  locked_by: string | null
  locked_at: string | null
  created_at: string
  updated_at: string
  // joined
  instructor_name?: string
  course_name?: string | null
}

export interface Registration {
  id: string
  session_id: string
  name: string
  email: string
  phone: string
  status: 'confirmed' | 'waitlisted' | 'cancelled'
  cancellation_token: string
  reminder_sent_24h: boolean
  reminder_sent_1h: boolean
  created_at: string
}

export interface BookResult {
  registration_id?: string
  status?: 'confirmed' | 'waitlisted'
  error?: string
}

// ── Public queries ────────────────────────────────────────────────────────────

export async function fetchUpcomingSessions(type: 'masterclass' | 'course_class' = 'masterclass') {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('sessions')
    .select('*, instructors(name)')
    .eq('session_type', type)
    .gte('session_date', today)
    .in('status', ['open', 'full'])
    .order('session_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return (data ?? []).map((s: Record<string, unknown>) => ({
    ...s,
    instructor_name: (s.instructors as { name: string } | null)?.name ?? '',
  })) as Session[]
}

export async function bookSeat(
  sessionId: string,
  name: string,
  email: string,
  phone: string
): Promise<BookResult> {
  const { data, error } = await supabase.rpc('book_session_seat', {
    p_session_id: sessionId,
    p_name: name,
    p_email: email,
    p_phone: phone,
  })
  if (error) throw error
  return data as BookResult
}

export async function cancelRegistration(token: string): Promise<{ success: boolean; reason?: string }> {
  const { data, error } = await supabase.rpc('cancel_registration', {
    p_cancellation_token: token,
  })
  if (error) throw error
  return data as { success: boolean; reason?: string }
}

// ── Masterclass slot booking (new slot-based system) ─────────────────────────

export interface MasterclassBooking {
  id: string
  slot_date: string
  slot_start_time: string
  slot_end_time: string
  name: string
  email: string
  phone: string
  status: 'confirmed' | 'waitlisted' | 'cancelled'
  created_at: string
}

export interface SlotCounts {
  [key: string]: number // "YYYY-MM-DD|HH:MM" → confirmed count
}

export interface BlockedWindow {
  session_date: string
  start_time: string
  end_time: string
  cohort?: 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5'  // set for course_class_blocks; undefined for session-based blocks
}

export interface CourseClassBlock {
  id: string
  block_date: string
  start_time: string
  end_time: string
  cohort: 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5'
  label: string | null
  created_at: string
}

export async function fetchMasterclassSlotData(fromDate: string, toDate: string): Promise<{
  counts: SlotCounts
  blocked: BlockedWindow[]
  overrides: SlotOverride[]
}> {
  const [bookingsRes, blockedRes, overridesRes, courseBlocksRes] = await Promise.all([
    supabase
      .from('masterclass_bookings')
      .select('slot_date, slot_start_time, status')
      .gte('slot_date', fromDate)
      .lte('slot_date', toDate)
      .eq('status', 'confirmed'),
    supabase
      .from('sessions')
      .select('session_date, start_time, end_time')
      .eq('session_type', 'course_class')
      .gte('session_date', fromDate)
      .lte('session_date', toDate)
      .neq('status', 'cancelled'),
    supabase
      .from('masterclass_slot_overrides')
      .select('*')
      .gte('slot_date', fromDate)
      .lte('slot_date', toDate),
    supabase
      .from('course_class_blocks')
      .select('*')
      .gte('block_date', fromDate)
      .lte('block_date', toDate),
  ])
  if (bookingsRes.error) throw bookingsRes.error
  if (blockedRes.error) throw blockedRes.error
  // overrides and course_class_blocks failures are non-fatal

  const counts: SlotCounts = {}
  for (const r of bookingsRes.data ?? []) {
    const key = `${r.slot_date}|${(r.slot_start_time as string).slice(0, 5)}`
    counts[key] = (counts[key] ?? 0) + 1
  }

  // Sessions-table course class blocks (no cohort info)
  const sessionBlocked: BlockedWindow[] = (blockedRes.data ?? []).map(
    (s: Record<string, string>) => ({
      session_date: s.session_date,
      start_time: s.start_time.slice(0, 5),
      end_time: s.end_time.slice(0, 5),
    })
  )

  // course_class_blocks table — carry cohort for FOMO display
  const courseBlocked: BlockedWindow[] = (courseBlocksRes.data ?? []).map(
    (b: Record<string, string>) => ({
      session_date: b.block_date,
      start_time: b.start_time.slice(0, 5),
      end_time: b.end_time.slice(0, 5),
      cohort: b.cohort as 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5',
    })
  )

  return {
    counts,
    blocked: [...sessionBlocked, ...courseBlocked],
    overrides: (overridesRes.data ?? []) as SlotOverride[],
  }
}

export async function bookMasterclassSlot(
  date: string,
  startTime: string,
  endTime: string,
  name: string,
  email: string,
  phone: string,
  slotCapacity = 3,
): Promise<{ id?: string; status?: 'confirmed' | 'waitlisted'; error?: string }> {
  const { data, error } = await supabase.rpc('book_masterclass_slot', {
    p_date: date,
    p_start_time: startTime,
    p_end_time: endTime,
    p_name: name,
    p_email: email,
    p_phone: phone,
    p_slot_capacity: slotCapacity,
  })
  if (error) throw error
  return data as { id?: string; status?: 'confirmed' | 'waitlisted'; error?: string }
}

export interface SlotOverride {
  id: string
  slot_date: string
  slot_start: string
  slot_end: string
  override: 'blocked' | 'open'
  reason: string | null
}

export async function fetchSlotOverrides(fromDate: string, toDate: string): Promise<SlotOverride[]> {
  const { data, error } = await supabase
    .from('masterclass_slot_overrides')
    .select('*')
    .gte('slot_date', fromDate)
    .lte('slot_date', toDate)
    .order('slot_date').order('slot_start')
  if (error) throw error
  return (data ?? []) as SlotOverride[]
}

export async function upsertSlotOverride(
  date: string, start: string, end: string,
  override: 'blocked' | 'open', reason?: string
): Promise<void> {
  const { error } = await supabase
    .from('masterclass_slot_overrides')
    .upsert({ slot_date: date, slot_start: start, slot_end: end, override, reason: reason ?? null },
      { onConflict: 'slot_date,slot_start' })
  if (error) throw error
}

export async function deleteSlotOverride(id: string): Promise<void> {
  const { error } = await supabase.from('masterclass_slot_overrides').delete().eq('id', id)
  if (error) throw error
}

export async function fetchMasterclassBookings(fromDate?: string): Promise<MasterclassBooking[]> {
  let q = supabase
    .from('masterclass_bookings')
    .select('*')
    .neq('status', 'cancelled')
    .order('slot_date', { ascending: true })
    .order('slot_start_time', { ascending: true })
  if (fromDate) q = q.gte('slot_date', fromDate)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as MasterclassBooking[]
}

// ── Course callbacks ──────────────────────────────────────────────────────────

export interface CourseCallback {
  id: string
  name: string
  phone: string
  is_masters_union: boolean
  created_at: string
}

export async function fetchCourseCallbacks(): Promise<CourseCallback[]> {
  const { data, error } = await supabase
    .from('course_callbacks')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as CourseCallback[]
}

// ── Admin queries (require service_role key in prod; anon key if RLS permits) ─

export async function fetchAllSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*, instructors(name), courses(name)')
    .neq('status', 'cancelled')
    .order('session_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return (data ?? []).map((s: Record<string, unknown>) => ({
    ...s,
    instructor_name: (s.instructors as { name: string } | null)?.name ?? '',
    course_name: (s.courses as { name: string } | null)?.name ?? null,
  })) as Session[]
}

export async function fetchSessionRegistrations(sessionId: string): Promise<Registration[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('session_id', sessionId)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as Registration[]
}

export async function createSession(session: Omit<Session,
  'id' | 'seats_booked' | 'status' | 'rescheduled_from_id' | 'created_at' | 'updated_at' | 'instructor_name' | 'course_name' | 'lock_owner_type' | 'locked_by' | 'locked_at'
>) {
  const { data, error } = await supabase.from('sessions').insert(session).select().single()
  if (error) throw error
  return data as Session
}

export async function rescheduleSession(
  sessionId: string,
  newDate: string,
  newStartTime: string,
  newEndTime: string
): Promise<{ success: boolean; reason?: string }> {
  const { data, error } = await supabase.rpc('admin_reschedule_session', {
    p_session_id: sessionId,
    p_new_date: newDate,
    p_new_start_time: newStartTime,
    p_new_end_time: newEndTime,
  })
  if (error) throw error
  return data as { success: boolean; reason?: string }
}

export async function reassignRegistration(
  registrationId: string,
  newSessionId: string,
  force = false
): Promise<{ success: boolean; reason?: string }> {
  const { data, error } = await supabase.rpc('admin_reassign_registration', {
    p_registration_id: registrationId,
    p_new_session_id: newSessionId,
    p_force: force,
  })
  if (error) throw error
  return data as { success: boolean; reason?: string }
}

export async function cancelSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'cancelled' })
    .eq('id', sessionId)
  if (error) throw error
}

export async function fetchInstructors(): Promise<Instructor[]> {
  const { data, error } = await supabase
    .from('instructors')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Instructor[]
}

// ── Course class blocks (blocks masterclass slots with cohort FOMO) ───────────

export async function fetchCourseClassBlocks(fromDate: string, toDate: string): Promise<CourseClassBlock[]> {
  const { data, error } = await supabase
    .from('course_class_blocks')
    .select('*')
    .gte('block_date', fromDate)
    .lte('block_date', toDate)
    .order('block_date')
    .order('start_time')
  if (error) throw error
  return (data ?? []) as CourseClassBlock[]
}

export async function addCourseClassBlock(
  date: string,
  startTime: string,
  endTime: string,
  cohort: 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5',
  label?: string
): Promise<CourseClassBlock> {
  const { data, error } = await supabase
    .from('course_class_blocks')
    .insert({ block_date: date, start_time: startTime, end_time: endTime, cohort, label: label ?? null })
    .select()
    .single()
  if (error) throw error
  return data as CourseClassBlock
}

export async function deleteCourseClassBlock(id: string): Promise<void> {
  const { error } = await supabase.from('course_class_blocks').delete().eq('id', id)
  if (error) throw error
}

// ── Student portal types ──────────────────────────────────────────────────────

export interface EnrolledStudent {
  id: string
  name: string
  email: string
  phone: string | null
  cohort: 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5'
  status: 'active' | 'graduated' | 'suspended'
  user_id: string | null
  invited_at: string | null
  enrolled_at: string
  notes: string | null
  has_set_password: boolean
  practice_access_mode: 'locked' | 'unlocked'
  blocked_until: string | null
}

export interface PracticeBooking {
  id: string
  session_id: string
  enrolled_student_id: string
  status: 'confirmed' | 'cancelled'
  cancellation_token: string
  email_sent: boolean
  email_sent_at: string | null
  created_at: string
  cancelled_at: string | null
  session?: {
    id: string
    session_date: string
    start_time: string
    end_time: string
    location: string
    status: string
  }
}

export interface StudentResource {
  id: string
  title: string
  description: string | null
  url: string
  resource_type: 'pdf' | 'link' | 'video' | 'audio' | 'other' | null
  cohort: 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'all'
  is_published: boolean
  file_name: string | null
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  cohort: 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'all'
  is_published: boolean
  published_at: string | null
  created_at: string
}

// ── Admin: enrolled students ──────────────────────────────────────────────────

export async function fetchEnrolledStudents(): Promise<EnrolledStudent[]> {
  const { data, error } = await supabase
    .from('enrolled_students')
    .select('*')
    .order('enrolled_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as EnrolledStudent[]
}

export async function addEnrolledStudent(
  name: string, email: string, phone: string, cohort: 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5'
): Promise<EnrolledStudent> {
  const { data, error } = await supabase
    .from('enrolled_students')
    .insert({ name, email: email.toLowerCase(), phone: phone || null, cohort })
    .select()
    .single()
  if (error) throw error
  return data as EnrolledStudent
}

export async function updateStudentStatus(id: string, status: EnrolledStudent['status']): Promise<void> {
  const { error } = await supabase.from('enrolled_students').update({ status }).eq('id', id)
  if (error) throw error
}

export async function deleteEnrolledStudent(id: string): Promise<void> {
  const { error } = await supabase.from('enrolled_students').delete().eq('id', id)
  if (error) throw error
}

export async function sendStudentInvite(email: string): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('student-auth', {
    body: { email },
  })
  if (error) return { success: false, error: error.message }
  if (data?.error) return { success: false, error: data.error }
  return { success: true }
}

// ── Admin: resources ──────────────────────────────────────────────────────────

export async function fetchAllResources(): Promise<StudentResource[]> {
  const { data, error } = await supabase
    .from('student_resources')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as StudentResource[]
}

export async function addStudentResource(
  title: string,
  url: string,
  cohort: StudentResource['cohort'],
  resource_type: StudentResource['resource_type'],
  description?: string
): Promise<StudentResource> {
  const { data, error } = await supabase
    .from('student_resources')
    .insert({ title, url, cohort, resource_type: resource_type ?? 'link', description: description ?? null })
    .select()
    .single()
  if (error) throw error
  return data as StudentResource
}

export async function updateResourcePublished(id: string, is_published: boolean): Promise<void> {
  const { error } = await supabase.from('student_resources').update({ is_published }).eq('id', id)
  if (error) throw error
}

export async function deleteStudentResource(id: string): Promise<void> {
  const { error } = await supabase.from('student_resources').delete().eq('id', id)
  if (error) throw error
}

// ── Admin: announcements ──────────────────────────────────────────────────────

export async function fetchAllAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Announcement[]
}

export async function addAnnouncement(
  title: string, body: string, cohort: Announcement['cohort']
): Promise<Announcement> {
  const { data, error } = await supabase
    .from('announcements')
    .insert({ title, body, cohort })
    .select()
    .single()
  if (error) throw error
  return data as Announcement
}

export async function publishAnnouncement(id: string, publish: boolean): Promise<void> {
  const update: Partial<Announcement> = { is_published: publish }
  if (publish) update.published_at = new Date().toISOString()
  const { error } = await supabase.from('announcements').update(update).eq('id', id)
  if (error) throw error
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw error
}

// ── Portal (authenticated): student's own data ────────────────────────────────

export async function fetchMyEnrollment(): Promise<EnrolledStudent | null> {
  const { data, error } = await supabase
    .from('enrolled_students')
    .select('*')
    .maybeSingle()
  if (error) throw error
  return data as EnrolledStudent | null
}

const STUDIO_ADDRESS = '11th Floor, The Capital, Next to CDS, Gurugram'

export async function fetchMyCourseSchedule(cohort: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('course_class_blocks')
    .select('id, block_date, start_time, end_time, label, cohort')
    .eq('cohort', cohort)
    .order('block_date', { ascending: true })
    .order('start_time', { ascending: true })
  if (error) throw error
  return (data ?? []).map((b: Record<string, unknown>) => ({
    id: b.id as string,
    session_date: b.block_date as string,
    start_time: b.start_time as string,
    end_time: b.end_time as string,
    location: STUDIO_ADDRESS,
    course_name: (b.label as string | null) ?? null,
    cohort: b.cohort,
    session_type: 'course_class',
    status: 'open',
  })) as unknown as Session[]
}

export async function uploadResourceFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { data, error } = await supabase.storage
    .from('academy-resources')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('academy-resources').getPublicUrl(data.path)
  return publicUrl
}

export async function fetchMyResources(): Promise<StudentResource[]> {
  const { data, error } = await supabase
    .from('student_resources')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as StudentResource[]
}

export async function fetchMyAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Announcement[]
}

// ── Practice vacancy computation (shared with portal UI) ─────────────────────

export const PRACTICE_STUDIO_OPEN  = '10:00'
export const PRACTICE_STUDIO_CLOSE = '20:00'
export const PRACTICE_SLOT_MINUTES = 30

export interface VacantSlot {
  date: string
  start: string
  end: string
}

function practiceToMins(t: string): number {
  const [h, m] = t.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

function practiceFromMins(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

export function computePracticeVacancies(
  date: string,
  daySessions: Pick<Session, 'start_time' | 'end_time'>[],
  dayCourseBlocks: Pick<CourseClassBlock, 'start_time' | 'end_time'>[],
): VacantSlot[] {
  const blocked = [
    ...daySessions.map(s => ({ s: practiceToMins(s.start_time), e: practiceToMins(s.end_time) })),
    ...dayCourseBlocks.map(b => ({ s: practiceToMins(b.start_time), e: practiceToMins(b.end_time) })),
  ]
  const now = new Date()
  const isToday = date === now.toISOString().slice(0, 10)
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const open  = practiceToMins(PRACTICE_STUDIO_OPEN)
  const close = practiceToMins(PRACTICE_STUDIO_CLOSE)
  const vacant: VacantSlot[] = []
  for (let cur = open; cur + PRACTICE_SLOT_MINUTES <= close; cur += PRACTICE_SLOT_MINUTES) {
    const end = cur + PRACTICE_SLOT_MINUTES
    if (isToday && cur < nowMins) continue
    if (blocked.some(b => b.s < end && b.e > cur)) continue
    vacant.push({ date, start: practiceFromMins(cur), end: practiceFromMins(end) })
  }
  return vacant
}

// ── Practice sessions (portal) ────────────────────────────────────────────────

export async function fetchSessionsForCalendar(fromDate: string, toDate: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .neq('status', 'cancelled')
    .gte('session_date', fromDate)
    .lte('session_date', toDate)
    .order('session_date')
    .order('start_time')
  if (error) throw error
  return (data ?? []) as Session[]
}

export async function fetchCourseBlocksForRange(
  cohort: string, fromDate: string, toDate: string
): Promise<CourseClassBlock[]> {
  const { data, error } = await supabase
    .from('course_class_blocks')
    .select('id, block_date, start_time, end_time, label, cohort')
    .eq('cohort', cohort)
    .gte('block_date', fromDate)
    .lte('block_date', toDate)
    .order('block_date')
    .order('start_time')
  if (error) throw error
  return (data ?? []) as CourseClassBlock[]
}

export async function fetchPracticeSlots(): Promise<Session[]> {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('session_type', 'practice_session')
    .eq('status', 'open')
    .is('lock_owner_type', null)
    .gte('session_date', today)
    .order('session_date', { ascending: true })
    .order('start_time', { ascending: true })
  if (error) throw error
  return (data ?? []) as Session[]
}

export async function fetchMyPracticeBookings(): Promise<PracticeBooking[]> {
  const { data, error } = await supabase
    .from('practice_bookings')
    .select(`
      id, session_id, enrolled_student_id, status, cancellation_token,
      email_sent, email_sent_at, created_at, cancelled_at,
      session:sessions!practice_bookings_session_id_fkey(
        id, session_date, start_time, end_time, location, status
      )
    `)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as PracticeBooking[]
}

export async function bookPracticeSlot(
  enrolledStudentId: string,
  sessionDate: string,
  startTime: string,
  endTime: string,
): Promise<{ booking_id?: string; session_id?: string; status?: string; error?: string; until?: string }> {
  const { data, error } = await supabase.rpc('book_practice_slot', {
    p_enrolled_student_id: enrolledStudentId,
    p_session_date:        sessionDate,
    p_start_time:          startTime,
    p_end_time:            endTime,
  })
  if (error) throw error
  return data as { booking_id?: string; session_id?: string; status?: string; error?: string; until?: string }
}

export async function cancelPracticeBooking(
  cancellationToken: string
): Promise<{ success?: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('cancel_practice_booking', {
    p_cancellation_token: cancellationToken,
  })
  if (error) throw error
  return data as { success?: boolean; error?: string }
}

// ── Practice sessions (admin) ─────────────────────────────────────────────────

export async function adminSetPracticeAccess(
  enrolledStudentId: string,
  action: 'unlock' | 'lock' | 'noshowblock_set' | 'noshowblock_lifted' | 'noshowblock_extended',
  newBlockedUntil?: string | null,
  overriddenBy?: string,
  reason?: string
): Promise<{ success?: boolean; action?: string; cancelled_bookings?: string[]; error?: string }> {
  const { data, error } = await supabase.rpc('admin_set_student_practice_access', {
    p_enrolled_student_id: enrolledStudentId,
    p_action: action,
    p_new_blocked_until: newBlockedUntil ?? null,
    p_overridden_by: overriddenBy ?? null,
    p_reason: reason ?? null,
  })
  if (error) throw error
  return data as { success?: boolean; action?: string; cancelled_bookings?: string[]; error?: string }
}

export async function fetchAllPracticeBookings(): Promise<PracticeBooking[]> {
  const { data, error } = await supabase
    .from('practice_bookings')
    .select(`
      id, session_id, enrolled_student_id, status, cancellation_token,
      email_sent, email_sent_at, created_at, cancelled_at,
      session:sessions!practice_bookings_session_id_fkey(
        id, session_date, start_time, end_time, location, status
      )
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as PracticeBooking[]
}
