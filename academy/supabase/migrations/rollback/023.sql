-- Rollback for 023_invoice_numbering.sql
-- !! Do NOT apply if any downstream code references invoice_number or the new functions.

DROP FUNCTION IF EXISTS public.get_course_enrollment_status(uuid);
DROP TABLE IF EXISTS public.finance_alerts;
DROP TABLE IF EXISTS public.invoice_sequences;
DROP FUNCTION IF EXISTS public.next_invoice_number(text);

ALTER TABLE masterclass_payments DROP COLUMN IF EXISTS invoice_number;
ALTER TABLE course_payments       DROP COLUMN IF EXISTS invoice_number;
