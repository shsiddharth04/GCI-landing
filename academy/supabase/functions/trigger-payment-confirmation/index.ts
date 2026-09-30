import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

// Re-triggers the invoice + confirmation email pipeline for a paid payment.
// Accepts admin JWT (email in admin_users table) OR service-role Authorization.
// Lookup: razorpay_payment_id  OR  booking_id (latest paid row).
//
// Usage:
//   curl -X POST .../functions/v1/trigger-payment-confirmation \
//     -H "Authorization: Bearer $ADMIN_JWT_OR_SERVICE_ROLE_KEY" \
//     -H "Content-Type: application/json" \
//     -d '{"razorpay_payment_id":"pay_XXX"}'
//   -d '{"booking_id":"<uuid>"}'

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY         = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

async function generateInvoicePdf(opts: {
  bookingId:        string
  invoiceNumber:    string
  studentName:      string
  studentEmail:     string
  slotDate:         string
  slotStart:        string
  slotEnd:          string
  paymentMethod:    'razorpay' | 'cash'
  razorpayOrderId:  string | null
  razorpayPaymentId: string | null
  amountPaise:      number
  invoiceDate:      Date
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842])

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const font     = await doc.embedFont(StandardFonts.Helvetica)

  const black          = rgb(0.04, 0.04, 0.04)
  const gray           = rgb(0.45, 0.45, 0.45)
  const lightGray      = rgb(0.88, 0.88, 0.88)
  const rowBg          = rgb(0.96, 0.96, 0.96)
  const paidGreen      = rgb(0.08, 0.52, 0.22)
  const paidGreenBg    = rgb(0.91, 0.98, 0.93)
  const paidGreenBorder = rgb(0.1, 0.65, 0.28)

  const margin = 60
  const right  = 595 - margin
  const contentWidth = right - margin
  let y = 842 - margin

  const amountStr = `INR ${(opts.amountPaise / 100).toFixed(2)}`
  const invNum = opts.invoiceNumber || `INV-${opts.bookingId.slice(0, 8).toUpperCase()}`

  page.drawText('GCI MUSIC ACADEMY', { x: margin, y, size: 17, font: fontBold, color: black })
  const invoiceLabelW = fontBold.widthOfTextAtSize('INVOICE', 22)
  page.drawText('INVOICE', { x: right - invoiceLabelW, y, size: 22, font: fontBold, color: black })

  y -= 20
  page.drawText('Gurugram, India', { x: margin, y, size: 9, font, color: gray })
  const invNumW = font.widthOfTextAtSize(invNum, 9)
  page.drawText(invNum, { x: right - invNumW, y, size: 9, font, color: gray })

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

  if (opts.paymentMethod === 'cash') {
    page.drawText('Payment Method', { x: margin, y, size: 9, font: fontBold, color: gray })
    page.drawText('Cash', { x: margin + 100, y, size: 9, font, color: black })
    y -= 15
    page.drawText('Received At', { x: margin, y, size: 9, font: fontBold, color: gray })
    page.drawText('GCI Studio, Gurugram', { x: margin + 100, y, size: 9, font, color: black })
  } else {
    page.drawText('Order ID', { x: margin, y, size: 9, font: fontBold, color: gray })
    page.drawText(opts.razorpayOrderId ?? '—', { x: margin + 72, y, size: 9, font, color: black })
    y -= 15
    page.drawText('Payment ID', { x: margin, y, size: 9, font: fontBold, color: gray })
    page.drawText(opts.razorpayPaymentId ?? '—', { x: margin + 72, y, size: 9, font, color: black })
  }

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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok')

  // ── Auth: service-role key OR admin JWT checked against admin_users ────────
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  if (!token) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    })
  }

  if (token !== SUPABASE_SERVICE_ROLE_KEY) {
    const { data: { user } } = await createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    }).auth.getUser()
    if (!user?.email) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403, headers: { 'Content-Type': 'application/json' },
      })
    }
    const { data: adminRow } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', user.email.toLowerCase())
      .maybeSingle()
    if (!adminRow) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403, headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  const body = await req.json()
  const { razorpay_payment_id, booking_id } = body

  if (!razorpay_payment_id && !booking_id) {
    return new Response(JSON.stringify({ error: 'razorpay_payment_id or booking_id required' }), { status: 400 })
  }

  // ── Fetch payment record ───────────────────────────────────────────────────
  let payment: {
    id: string
    razorpay_order_id: string | null
    razorpay_payment_id: string | null
    payment_method: string
    status: string
    amount: number
    masterclass_booking_id: string
    invoice_number: string | null
    created_at: string
  } | null = null

  let payErr: { message: string } | null = null

  if (razorpay_payment_id) {
    const { data, error } = await supabase
      .from('masterclass_payments')
      .select('id, razorpay_order_id, razorpay_payment_id, payment_method, status, amount, masterclass_booking_id, invoice_number, created_at')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .maybeSingle()
    payment = data
    payErr = error
  } else {
    const { data, error } = await supabase
      .from('masterclass_payments')
      .select('id, razorpay_order_id, razorpay_payment_id, payment_method, status, amount, masterclass_booking_id, invoice_number, created_at')
      .eq('masterclass_booking_id', booking_id)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    payment = data
    payErr = error
  }

  if (payErr || !payment) {
    return new Response(JSON.stringify({ error: 'payment_not_found', detail: payErr?.message }), { status: 404 })
  }
  if (payment.status !== 'paid') {
    return new Response(JSON.stringify({ error: 'payment_not_paid', status: payment.status }), { status: 400 })
  }

  // ── Fetch booking ──────────────────────────────────────────────────────────
  const { data: booking, error: bookErr } = await supabase
    .from('masterclass_bookings')
    .select('name, email, slot_date, slot_start_time, slot_end_time')
    .eq('id', payment.masterclass_booking_id)
    .single()

  if (bookErr || !booking) {
    return new Response(JSON.stringify({ error: 'booking_not_found', detail: bookErr?.message }), { status: 404 })
  }

  const paymentMethod = (payment.payment_method ?? 'razorpay') as 'razorpay' | 'cash'

  // ── Regenerate PDF ─────────────────────────────────────────────────────────
  const pdfBytes = await generateInvoicePdf({
    bookingId:         payment.masterclass_booking_id,
    invoiceNumber:     payment.invoice_number ?? `INV-${payment.masterclass_booking_id.slice(0, 8).toUpperCase()}`,
    studentName:       booking.name,
    studentEmail:      booking.email,
    slotDate:          booking.slot_date,
    slotStart:         (booking.slot_start_time as string).slice(0, 5),
    slotEnd:           (booking.slot_end_time as string).slice(0, 5),
    paymentMethod,
    razorpayOrderId:   payment.razorpay_order_id ?? null,
    razorpayPaymentId: payment.razorpay_payment_id ?? null,
    amountPaise:       payment.amount,
    invoiceDate:       new Date(payment.created_at),
  })

  // ── Upload to storage ──────────────────────────────────────────────────────
  await supabase.storage
    .from('invoices')
    .upload(`invoice-${payment.masterclass_booking_id}.pdf`, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    })

  // ── Send email ─────────────────────────────────────────────────────────────
  let binary = ''
  for (let i = 0; i < pdfBytes.length; i++) binary += String.fromCharCode(pdfBytes[i])
  const pdfBase64 = btoa(binary)

  const emailRes = await fetch(`${SUPABASE_URL}/functions/v1/send-masterclass-confirmation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      name:      booking.name,
      email:     booking.email,
      date:      booking.slot_date,
      startTime: (booking.slot_start_time as string).slice(0, 5),
      endTime:   (booking.slot_end_time as string).slice(0, 5),
      status:    'paid',
      pdfBase64,
      bookingId: payment.masterclass_booking_id,
    }),
  })

  const emailData = await emailRes.json()

  return new Response(JSON.stringify({
    ok: emailRes.ok,
    email_status: emailRes.status,
    resend_response: emailData,
    booking: {
      id:         payment.masterclass_booking_id,
      name:       booking.name,
      email:      booking.email,
      slot_date:  booking.slot_date,
      payment_method: paymentMethod,
    },
  }), {
    status: emailRes.ok ? 200 : emailRes.status,
    headers: { 'Content-Type': 'application/json' },
  })
})
