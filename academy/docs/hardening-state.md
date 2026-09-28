# GCI Academy — Security Hardening State

Branch: `feature/admin-auth-cash-hardening`  
Last updated: 2026-09-28

---

## Phase A — Safety net + inventory

| Item | Status | Evidence |
|---|---|---|
| A0 Backup | User runs independently | `supabase db dump` instructions in plan |
| A1(d) Deposit poll live bug | ✅ Fixed | `get_course_enrollment_status` RPC in migration 023; EnrollmentForm.tsx switched to RPC |
| A1 finance@ alert | ✅ Deployed | order_not_found → 200 + finance alert call in both webhooks; dedup in send-masterclass-confirmation |
| A1 invoice numbering | ✅ Applied | Migration 023 applied; 10/10 MC + 1/1 CE invoices backfilled and verified against storage |
| A2 Revoke unused privileges | ✅ Applied | Migration 024: TRUNCATE/REFERENCES/TRIGGER revoked; practice_bookings + student_access_audit anon_all dropped |
| FINANCE_EMAIL secret | ✅ Set | `finance@gigcultureindia.com` |

### Known gaps from A1 invoice audit
- INV-4AC322D1 ("Test User") — PDF missing, regeneration deferred
- INV-7A64E950 ("Siddharth Sharma") — PDF missing, regeneration deferred

---

## Phase B — Admin identity + auth swap

| Item | Status | Commit |
|---|---|---|
| B1 admin_users + is_admin() + 16 RLS policies | ✅ Applied + committed | 5a75ae0 |
| B4 AdminLogin signInWithPassword | ✅ Committed | 5a75ae0 |
| B4 admin/index.tsx auth gate | ✅ Committed | 5a75ae0 |
| Playwright 13-test suite | ✅ 13/13 passing | 5a75ae0 |
| B5 SessionPicker → get_booking_payment_status RPC | ⏳ Pending | — |
| B5 db.ts → get_masterclass_availability RPC | ⏳ Pending | — |
| B6 H2 gate — staging evidence | ⏳ Awaiting user approval | — |

### Deployed functions (with commit SHA)
All deployed from committed code on `feature/admin-auth-cash-hardening`:
- `razorpay-webhook` — finance alert + order_not_found 200
- `course-deposit-webhook` — same + INSERT retry
- `create-course-deposit-order` — INSERT retry
- `send-masterclass-confirmation` — finance_alert case + dedup

---

## Signup disable
- Management API requires PAT (not available)
- Dashboard path: Auth → Providers → Email → disable "Allow new users to sign up" → Save
- Status: ⏳ Manual dashboard action pending

---

## Phase C–E
Not started. Blocked on H2 approval.

---

## Automation checks (Phase A)
| Check | Status |
|---|---|
| A4 Razorpay key prefix | Key is `rzp_live_*` — confirmed live mode |
| A5 Other apps on same Supabase project | None found in GCI ARCHITECTURE sibling dirs |
| A7 Email deliverability | Deferred |
| A8a Webhook sig check | Working (401 on bad sig) |
| A8b Deposit poll RPC | ✅ Verified anon-callable, returns deposit_status |
| A8c create-razorpay-order | Working |

---

## H2 evidence needed before merging to main
1. Admin login (sh.siddharth04@gmail.com + password) → panel loads ✓
2. Students, Payments, CourseEnrollments, Schedule, Registrations, Announcements, Resources pages load real data ✓
3. Invoice download from Payments page works ✓
4. Public masterclass booking flow unaffected ✓
5. Course deposit "paid" state visible after Razorpay ✓
6. Playwright 13/13 ✓ (run before H2)

Post evidence in session, then proceed with merge + production smoke test.
