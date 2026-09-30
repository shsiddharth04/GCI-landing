import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY         = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function fmt12(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

function fmtSlotDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtInvoiceDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

function addSlotMinutes(t: string, mins: number): string {
  const [h, m] = t.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

async function generateCashInvoicePdf(opts: {
  bookingId: string
  invoiceNumber: string
  studentName: string
  studentEmail: string
  slotDate: string
  slotStart: string
  slotEnd: string
  amountPaise: number
  invoiceDate: Date
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842])

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const font     = await doc.embedFont(StandardFonts.Helvetica)

  const black         = rgb(0.04, 0.04, 0.04)
  const gray          = rgb(0.45, 0.45, 0.45)
  const lightGray     = rgb(0.88, 0.88, 0.88)
  const rowBg         = rgb(0.96, 0.96, 0.96)
  const paidGreen     = rgb(0.08, 0.52, 0.22)
  const paidGreenBg   = rgb(0.91, 0.98, 0.93)
  const paidGreenBorder = rgb(0.1, 0.65, 0.28)

  const margin = 60
  const right  = 595 - margin
  const contentWidth = right - margin
  let y = 842 - margin

  const amountStr = `INR ${(opts.amountPaise / 100).toFixed(2)}`

  page.drawText('GCI MUSIC ACADEMY', { x: margin, y, size: 17, font: fontBold, color: black })
  const invoiceLabelW = fontBold.widthOfTextAtSize('INVOICE', 22)
  page.drawText('INVOICE', { x: right - invoiceLabelW, y, size: 22, font: fontBold, color: black })

  y -= 20
  page.drawText('Gurugram, India', { x: margin, y, size: 9, font, color: gray })
  const invNumW = font.widthOfTextAtSize(opts.invoiceNumber, 9)
  page.drawText(opts.invoiceNumber, { x: right - invNumW, y, size: 9, font, color: gray })

  y -= 14
  const dateLabel = fmtInvoiceDate(opts.invoiceDate)
  const dateLabelW = font.widthOfTextAtSize(dateLabel, 9)
  page.drawText(dateLabel, { x: right - dateLabelW, y, size: 9, font, color: gray })

  y -= 20
  page.drawLine({ start: { x: margin, y }, end: { x: right, y }, thickness: 1, color: lightGray })
  y -= 28

  page.drawText('BILLED TO', { x: margin, y, size: 8, font: fontBold, color: gray })
  y -= 16
  page.drawText(opts.studentName, { x: margin, y, size: 12, font: fontBold, color: black })
  y -= 16
  page.drawText(opts.studentEmail, { x: margin, y, size: 10, font, color: gray })
  y -= 28
  page.drawLine({ start: { x: margin, y }, end: { x: right, y }, thickness: 0.5, color: lightGray })

  const tableHeaderH = 28
  page.drawRectangle({ x: margin, y: y - tableHeaderH, width: contentWidth, height: tableHeaderH, color: rowBg })
  y -= 10
  page.drawText('DESCRIPTION', { x: margin + 10, y, size: 8, font: fontBold, color: gray })
  const amtHeaderW = fontBold.widthOfTextAtSize('AMOUNT', 8)
  page.drawText('AMOUNT', { x: right - 10 - amtHeaderW, y, size: 8, font: fontBold, color: gray })
  y -= 28

  page.drawText('Masterclass Session', { x: margin + 10, y, size: 11, font: fontBold, color: black })
  const amtW = fontBold.widthOfTextAtSize(amountStr, 11)
  page.drawText(amountStr, { x: right - 10 - amtW, y, size: 11, font: fontBold, color: black })
  y -= 16

  const slotDetail = `${fmtSlotDate(opts.slotDate)}  ·  ${fmt12(opts.slotStart)} to ${fmt12(opts.slotEnd)}`
  page.drawText(slotDetail, { x: margin + 10, y, size: 9, font, color: gray })
  y -= 30

  page.drawLine({ start: { x: margin, y }, end: { x: right, y }, thickness: 0.5, color: lightGray })
  y -= 18

  const totalAmtW = fontBold.widthOfTextAtSize(amountStr, 13)
  page.drawText(amountStr, { x: right - 10 - totalAmtW, y, size: 13, font: fontBold, color: black })
  const totalLabelW = fontBold.widthOfTextAtSize('TOTAL', 9)
  page.drawText('TOTAL', { x: right - 10 - totalAmtW - 16 - totalLabelW, y: y + 1, size: 9, font: fontBold, color: gray })
  y -= 24

  page.drawLine({ start: { x: margin, y }, end: { x: right, y }, thickness: 1, color: lightGray })
  y -= 24

  page.drawText('PAYMENT REFERENCE', { x: margin, y, size: 8, font: fontBold, color: gray })
  y -= 18
  page.drawText('Payment Method', { x: margin, y, size: 9, font: fontBold, color: gray })
  page.drawText('Cash', { x: margin + 100, y, size: 9, font, color: black })
  y -= 15
  page.drawText('Received At', { x: margin, y, size: 9, font: fontBold, color: gray })
  page.drawText('GCI Studio, Gurugram', { x: margin + 100, y, size: 9, font, color: black })

  const paidSize = 32
  const paidText = 'PAID'
  const paidW    = fontBold.widthOfTextAtSize(paidText, paidSize)
  const paidH    = paidSize
  const padX = 14, padY = 10
  const stampX = right - paidW - padX * 2
  const stampY = y - paidH - padY

  page.drawRectangle({
    x: stampX - padX, y: stampY - padY,
    width: paidW + padX * 2, height: paidH + padY * 2,
    color: paidGreenBg, borderColor: paidGreenBorder, borderWidth: 1.5,
  })
  page.drawText(paidText, { x: stampX, y: stampY, size: paidSize, font: fontBold, color: paidGreen })

  const footerY = 52
  page.drawLine({ start: { x: margin, y: footerY + 18 }, end: { x: right, y: footerY + 18 }, thickness: 0.5, color: lightGray })
  const footerText = 'GCI Music Academy  |  Gurugram, India  |  gigcultureindia.com'
  const footerW = font.widthOfTextAtSize(footerText, 8)
  page.drawText(footerText, { x: (595 - footerW) / 2, y: footerY, size: 8, font, color: gray })

  return doc.save()
}

const ERROR_MESSAGES: Record<string, string> = {
  past_date:             'Cannot book a slot in the past',
  invalid_slot_grid:     'Slot time must be on the hour or half-hour',
  invalid_name:          'Name must be at least 2 characters',
  invalid_email:         'Invalid email address',
  invalid_phone:         'Enter a valid 10-digit Indian mobile number',
  slot_blocked:          'This slot is blocked',
  course_class_conflict: 'A course class is scheduled during this slot',
  slot_full:             'This slot is full. An unpaid online checkout in progress can hold a slot for up to 45 minutes — try again shortly.',
  already_registered:    'This email address already has a booking for this slot',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  // ── Auth: must be an admin (checked against admin_users table) ────────────
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')

  if (!token) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const { data: { user }, error: userErr } = await createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  }).auth.getUser()

  if (userErr || !user?.email) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', user.email.toLowerCase())
    .maybeSingle()

  if (!adminRow) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const adminEmail = user.email.toLowerCase()

  // ── Parse input ────────────────────────────────────────────────────────────
  let body: { slot_date: string; slot_start: string; name: string; email: string; phone: string; note?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const { slot_date, slot_start, name, email, phone, note } = body

  if (!slot_date || !slot_start || !name || !email || !phone) {
    return new Response(JSON.stringify({ error: 'missing_fields' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  // ── Slot grid guard (fast client response before DB round-trip) ────────────
  const [hStr, mStr] = slot_start.split(':')
  const slotMinute = parseInt(mStr)
  if (slotMinute !== 0 && slotMinute !== 30) {
    return new Response(JSON.stringify({ error: 'invalid_slot_grid', message: ERROR_MESSAGES.invalid_slot_grid }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const slotEnd = addSlotMinutes(slot_start, 30)

  // ── Call RPC ───────────────────────────────────────────────────────────────
  const { data: rpcResult, error: rpcErr } = await supabase.rpc('admin_record_walkin_cash', {
    p_date:        slot_date,
    p_start_time:  slot_start,
    p_name:        name,
    p_email:       email,
    p_phone:       phone,
    p_recorded_by: adminEmail,
    p_note:        note ?? null,
  })

  if (rpcErr) {
    return new Response(JSON.stringify({ error: 'rpc_error', detail: rpcErr.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const result = rpcResult as { error?: string; booking_id?: string; invoice_number?: string }

  if (result.error) {
    return new Response(JSON.stringify({ error: result.error, message: ERROR_MESSAGES[result.error] ?? result.error }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const { booking_id, invoice_number } = result as { booking_id: string; invoice_number: string }

  // ── Generate PDF ───────────────────────────────────────────────────────────
  let pdfBytes: Uint8Array
  try {
    pdfBytes = await generateCashInvoicePdf({
      bookingId:     booking_id,
      invoiceNumber: invoice_number,
      studentName:   name.trim(),
      studentEmail:  email.trim().toLowerCase(),
      slotDate:      slot_date,
      slotStart:     slot_start.slice(0, 5),
      slotEnd:       slotEnd,
      amountPaise:   17900,
      invoiceDate:   new Date(),
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, partial: true, booking_id, invoice_number, error: 'pdf_failed', detail: String(e) }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  // ── Upload to storage ──────────────────────────────────────────────────────
  const { error: uploadErr } = await supabase.storage
    .from('invoices')
    .upload(`invoice-${booking_id}.pdf`, pdfBytes, { contentType: 'application/pdf', upsert: true })

  if (uploadErr) {
    return new Response(JSON.stringify({ ok: false, partial: true, booking_id, invoice_number, error: 'upload_failed', detail: uploadErr.message }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  // ── Encode PDF ─────────────────────────────────────────────────────────────
  let binary = ''
  for (let i = 0; i < pdfBytes.length; i++) binary += String.fromCharCode(pdfBytes[i])
  const pdfBase64 = btoa(binary)

  // ── Send confirmation email ────────────────────────────────────────────────
  const emailRes = await fetch(`${SUPABASE_URL}/functions/v1/send-masterclass-confirmation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      name:      name.trim(),
      email:     email.trim().toLowerCase(),
      date:      slot_date,
      startTime: slot_start.slice(0, 5),
      endTime:   slotEnd,
      status:    'paid',
      pdfBase64,
      bookingId: booking_id,
    }),
  })

  if (!emailRes.ok) {
    const detail = await emailRes.text()
    return new Response(JSON.stringify({ ok: false, partial: true, booking_id, invoice_number, error: 'email_failed', detail }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true, booking_id, invoice_number }), {
    status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
