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

export async function fetchInstructors(): Promise<Instructor[]> {
  const { data, error } = await supabase
    .from('instructors')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Instructor[]
}
