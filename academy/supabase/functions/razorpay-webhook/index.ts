import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

// verify_jwt = false in config.toml — Razorpay doesn't send a Supabase JWT.
// Authenticity is verified via HMAC-SHA256 signature on the raw body instead.

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ── Signature verification ────────────────────────────────────────────────────

async function verifySignature(rawBody: string, receivedSig: string): Promise<boolean> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(RAZORPAY_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody))
  const expected = Array.from(new Uint8Array(sigBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('')
  return expected === receivedSig
}

// ── Invoice PDF generation ────────────────────────────────────────────────────

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
  bookingId: string
  studentName: string
  studentEmail: string
  slotDate: string
  slotStart: string
  slotEnd: string
  razorpayOrderId: string
  razorpayPaymentId: string
  amountPaise: number
  invoiceDate: Date
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842])

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const font = await doc.embedFont(StandardFonts.Helvetica)

  const black = rgb(0.04, 0.04, 0.04)
  const gray = rgb(0.45, 0.45, 0.45)
  const lightGray = rgb(0.88, 0.88, 0.88)
  const rowBg = rgb(0.96, 0.96, 0.96)
  const paidGreen = rgb(0.08, 0.52, 0.22)
  const paidGreenBg = rgb(0.91, 0.98, 0.93)
  const paidGreenBorder = rgb(0.1, 0.65, 0.28)

  const margin = 60
  const right = 595 - margin
  const contentWidth = right - margin
  let y = 842 - margin

  const amountStr = `INR ${(opts.amountPaise / 100).toFixed(2)}`
  const invNum = `INV-${opts.bookingId.slice(0, 8).toUpperCase()}`

  // ── Header ─────────────────────────────────────────────────────────────────

  page.drawText('GCI MUSIC ACADEMY', { x: margin, y, size: 17, font: fontBold, color: black })

  const invoiceLabelW = fontBold.widthOfTextAtSize('INVOICE', 22)
  page.drawText('INVOICE', {
    x: right - invoiceLabelW, y,
    size: 22, font: fontBold, color: black,
  })

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

  // ── Billed to ──────────────────────────────────────────────────────────────

  page.drawText('BILLED TO', { x: margin, y, size: 8, font: fontBold, color: gray })

  y -= 16

  page.drawText(opts.studentName, { x: margin, y, size: 12, font: fontBold, color: black })

  y -= 16

  page.drawText(opts.studentEmail, { x: margin, y, size: 10, font, color: gray })

  y -= 28

  page.drawLine({ start: { x: margin, y }, end: { x: right, y }, thickness: 0.5, color: lightGray })

  // ── Table header ───────────────────────────────────────────────────────────

  const tableHeaderH = 28
  page.drawRectangle({
    x: margin, y: y - tableHeaderH,
    width: contentWidth, height: tableHeaderH,
    color: rowBg,
  })

  y -= 10

  page.drawText('DESCRIPTION', { x: margin + 10, y, size: 8, font: fontBold, color: gray })

  const amtHeaderW = fontBold.widthOfTextAtSize('AMOUNT', 8)
  page.drawText('AMOUNT', { x: right - 10 - amtHeaderW, y, size: 8, font: fontBold, color: gray })

  y -= 28

  // ── Table row ──────────────────────────────────────────────────────────────

  page.drawText('Masterclass Session', { x: margin + 10, y, size: 11, font: fontBold, color: black })

  const amtW = fontBold.widthOfTextAtSize(amountStr, 11)
  page.drawText(amountStr, { x: right - 10 - amtW, y, size: 11, font: fontBold, color: black })

  y -= 16

  const slotDetail = `${fmtSlotDate(opts.slotDate)}  -  ${fmt12(opts.slotStart)} to ${fmt12(opts.slotEnd)}`
  page.drawText(slotDetail, { x: margin + 10, y, size: 9, font, color: gray })

  y -= 30

  page.drawLine({ start: { x: margin, y }, end: { x: right, y }, thickness: 0.5, color: lightGray })

  // ── Total ──────────────────────────────────────────────────────────────────

  y -= 18

  const totalAmtW = fontBold.widthOfTextAtSize(amountStr, 13)
  page.drawText(amountStr, { x: right - 10 - totalAmtW, y, size: 13, font: fontBold, color: black })

  const totalLabelW = fontBold.widthOfTextAtSize('TOTAL', 9)
  page.drawText('TOTAL', {
    x: right - 10 - totalAmtW - 16 - totalLabelW,
    y: y + 1,
    size: 9, font: fontBold, color: gray,
  })

  y -= 24

  page.drawLine({ start: { x: margin, y }, end: { x: right, y }, thickness: 1, color: lightGray })

  // ── Payment reference ──────────────────────────────────────────────────────

  y -= 24

  page.drawText('PAYMENT REFERENCE', { x: margin, y, size: 8, font: fontBold, color: gray })

  y -= 18

  page.drawText('Order ID', { x: margin, y, size: 9, font: fontBold, color: gray })
  page.drawText(opts.razorpayOrderId, { x: margin + 72, y, size: 9, font, color: black })

  y -= 15

  page.drawText('Payment ID', { x: margin, y, size: 9, font: fontBold, color: gray })
  page.drawText(opts.razorpayPaymentId, { x: margin + 72, y, size: 9, font, color: black })

  // ── PAID stamp ─────────────────────────────────────────────────────────────

  const paidSize = 32
  const paidText = 'PAID'
  const paidW = fontBold.widthOfTextAtSize(paidText, paidSize)
  const paidH = paidSize
  const padX = 14
  const padY = 10
  const stampX = right - paidW - padX * 2
  const stampY = y - paidH - padY

  page.drawRectangle({
    x: stampX - padX, y: stampY - padY,
    width: paidW + padX * 2, height: paidH + padY * 2,
    color: paidGreenBg,
    borderColor: paidGreenBorder,
    borderWidth: 1.5,
  })

  page.drawText(paidText, {
    x: stampX, y: stampY,
    size: paidSize, font: fontBold, color: paidGreen,
  })

  // ── Footer ─────────────────────────────────────────────────────────────────

  const footerY = 52
  page.drawLine({
    start: { x: margin, y: footerY + 18 },
    end: { x: right, y: footerY + 18 },
    thickness: 0.5, color: lightGray,
  })

  const footerText = 'GCI Music Academy  |  Gurugram, India  |  gigcultureindia.com'
  const footerW = font.widthOfTextAtSize(footerText, 8)
  page.drawText(footerText, {
    x: (595 - footerW) / 2, y: footerY,
    size: 8, font, color: gray,
  })

  return doc.save()
}

// ── Invoice + email pipeline (fire-and-forget after DB updates) ───────────────

async function generateAndSendInvoice(
  supabase: ReturnType<typeof createClient>,
  opts: {
    bookingId: string
    paymentId: string
    orderId: string
    amountPaise: number
    invoiceDate: Date
  }
): Promise<void> {
  const { data: booking } = await supabase
    .from('masterclass_bookings')
    .select('name, email, slot_date, slot_start_time, slot_end_time')
    .eq('id', opts.bookingId)
    .single()

  if (!booking) {
    console.error('generateAndSendInvoice: booking not found', opts.bookingId)
    return
  }

  const pdfBytes = await generateInvoicePdf({
    bookingId: opts.bookingId,
    studentName: booking.name,
    studentEmail: booking.email,
    slotDate: booking.slot_date,
    slotStart: (booking.slot_start_time as string).slice(0, 5),
    slotEnd: (booking.slot_end_time as string).slice(0, 5),
    razorpayOrderId: opts.orderId,
    razorpayPaymentId: opts.paymentId,
    amountPaise: opts.amountPaise,
    invoiceDate: opts.invoiceDate,
  })

  const fileName = `invoice-${opts.bookingId}.pdf`
  const { error: uploadErr } = await supabase.storage
    .from('invoices')
    .upload(fileName, pdfBytes, { contentType: 'application/pdf', upsert: true })

  if (uploadErr) {
    console.error('Invoice upload failed:', uploadErr.message)
  }

  // base64 for Resend attachment
  let binary = ''
  for (let i = 0; i < pdfBytes.length; i++) {
    binary += String.fromCharCode(pdfBytes[i])
  }
  const pdfBase64 = btoa(binary)

  await fetch(`${SUPABASE_URL}/functions/v1/send-masterclass-confirmation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      name: booking.name,
      email: booking.email,
      date: booking.slot_date,
      startTime: (booking.slot_start_time as string).slice(0, 5),
      endTime: (booking.slot_end_time as string).slice(0, 5),
      status: 'paid',
      pdfBase64,
      bookingId: opts.bookingId,
    }),
  })
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const rawBody = await req.text()
  const receivedSig = req.headers.get('x-razorpay-signature') ?? ''

  if (!receivedSig || !(await verifySignature(rawBody, receivedSig))) {
    return new Response('Signature mismatch', { status: 401 })
  }

  const event = JSON.parse(rawBody)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity
    const orderId: string = payment.order_id
    const paymentId: string = payment.id
    const amountPaise: number = payment.amount

    const { data: paymentRec } = await supabase
      .from('masterclass_payments')
      .select('id, masterclass_booking_id, status')
      .eq('razorpay_order_id', orderId)
      .maybeSingle()

    if (!paymentRec) {
      console.error('No payment record found for order:', orderId)
      return new Response(JSON.stringify({ ok: false, reason: 'order_not_found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      })
    }

    // Idempotency: already processed — return 200 so Razorpay doesn't retry
    if (paymentRec.status === 'paid') {
      return new Response(JSON.stringify({ ok: true, note: 'already_processed' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      })
    }

    await supabase
      .from('masterclass_payments')
      .update({ status: 'paid', razorpay_payment_id: paymentId })
      .eq('id', paymentRec.id)

    await supabase
      .from('masterclass_bookings')
      .update({ payment_status: 'paid' })
      .eq('id', paymentRec.masterclass_booking_id)

    // PDF + storage + email — fire-and-forget so Razorpay gets its 200 immediately
    generateAndSendInvoice(supabase, {
      bookingId: paymentRec.masterclass_booking_id,
      paymentId,
      orderId,
      amountPaise,
      invoiceDate: new Date(),
    }).catch(err => console.error('Invoice/email pipeline failed:', err))

  } else if (event.event === 'payment.failed') {
    const payment = event.payload.payment.entity
    const orderId: string = payment.order_id

    const { data: paymentRec } = await supabase
      .from('masterclass_payments')
      .select('id, masterclass_booking_id')
      .eq('razorpay_order_id', orderId)
      .maybeSingle()

    if (paymentRec) {
      await supabase
        .from('masterclass_payments')
        .update({ status: 'failed' })
        .eq('id', paymentRec.id)
        .eq('status', 'pending')

      // Only flip booking status if it hasn't already been marked paid
      await supabase
        .from('masterclass_bookings')
        .update({ payment_status: 'failed' })
        .eq('id', paymentRec.masterclass_booking_id)
        .eq('payment_status', 'pending')
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  })
})
