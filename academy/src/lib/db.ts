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
  instructor_id: string
  session_type: 'masterclass' | 'course_class'
  course_id: string | null
  session_date: string
  start_time: string
  end_time: string
  location: string
  capacity: number
  seats_booked: number
  status: 'open' | 'full' | 'cancelled' | 'rescheduled'
  rescheduled_from_id: string | null
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
}

export async function fetchMasterclassSlotData(fromDate: string, toDate: string): Promise<{
  counts: SlotCounts
  blocked: BlockedWindow[]
  overrides: SlotOverride[]
}> {
  const [bookingsRes, blockedRes, overridesRes] = await Promise.all([
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
  ])
  if (bookingsRes.error) throw bookingsRes.error
  if (blockedRes.error) throw blockedRes.error
  // overrides failure is non-fatal

  const counts: SlotCounts = {}
  for (const r of bookingsRes.data ?? []) {
    const key = `${r.slot_date}|${(r.slot_start_time as string).slice(0, 5)}`
    counts[key] = (counts[key] ?? 0) + 1
  }

  return {
    counts,
    blocked: (blockedRes.data ?? []) as BlockedWindow[],
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
  'id' | 'seats_booked' | 'status' | 'rescheduled_from_id' | 'created_at' | 'updated_at' | 'instructor_name' | 'course_name'
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
) {
  const { error } = await supabase.rpc('admin_reschedule_session', {
    p_session_id: sessionId,
    p_new_date: newDate,
    p_new_start_time: newStartTime,
    p_new_end_time: newEndTime,
  })
  if (error) throw error
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
