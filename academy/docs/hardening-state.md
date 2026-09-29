# GCI Academy — Security Hardening State

Branch: `main` (merged 2026-09-28)  
Last updated: 2026-09-29

---

## Phase A — Safety net + inventory ✅

| Item | Status | Evidence |
|---|---|---|
| A0 Backup | User runs independently | `supabase db dump` instructions in plan |
| A1(d) Deposit poll live bug | ✅ Fixed + live | `get_course_enrollment_status` RPC in migration 023; callable by anon, returns null for unknown IDs |
| A1 finance@ alert | ✅ Deployed | order_not_found → 200 + finance alert; dedup via finance_alerts table |
| A1 invoice numbering | ✅ Applied | Migration 023 applied; 10/10 MC + 1/1 CE invoices backfilled |
| A2 Revoke unused privileges | ✅ Applied | Migration 024: TRUNCATE/REFERENCES/TRIGGER revoked; practice_bookings + student_access_audit anon_all dropped |
| FINANCE_EMAIL secret | ✅ Set | `finance@gigcultureindia.com` |

### Known gaps from A1 invoice audit
- INV-4AC322D1 ("Test User") — PDF missing, regeneration deferred
- INV-7A64E950 ("Siddharth Sharma") — PDF missing, regeneration deferred

---

## Phase B — Admin identity + auth swap ✅ LIVE

| Item | Status | Commit |
|---|---|---|
| B1 admin_users + is_admin() + 16 RLS policies | ✅ Live | 5a75ae0 → main 2c333cb |
| B4 AdminLogin signInWithPassword | ✅ Live | 5a75ae0 → main 2c333cb |
| B4 admin/index.tsx auth gate | ✅ Live | 5a75ae0 → main 2c333cb |
| Playwright 13-test suite | ✅ 13/13 passing | 5a75ae0 |
| Hostinger build | ✅ Completed | Build 01a0e83d, commit 2c333cb, 77s |
| VITE_ADMIN_PASSWORD removed from Hostinger | ✅ Removed | Replaced env vars 2026-09-28 |
| PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 | ✅ Set | Hostinger env 2026-09-28 |

### admin_users contents
- `sh.siddharth04@gmail.com` — seeded in migration 025, **came from user** (confirmed in session as ADMIN_EMAIL)
- No other rows (test admin deleted post-test)

### Pre-merge checks (temp test admin, deleted post-test)
| Check | Result |
|---|---|
| masterclass_payments RLS vs DB | 18 = 18 ✅ |
| enrolled_students RLS vs DB | 12 = 12 ✅ |
| course_payments RLS vs DB | 4 = 4 ✅ |
| MC invoice signed URL | HTTP 200 application/pdf ✅ |
| CE invoice signed URL | HTTP 200 application/pdf ✅ |
| Live site before merge | HTTP 200 ✅ |

### Production smoke test (post-deploy)
| Check | Result |
|---|---|
| Home page | HTTP 200 ✅ |
| Admin route | HTTP 200 ✅ |
| Bundle scan: gci-admin-2026 absent | PASS ✅ |
| get_course_enrollment_status (anon) | callable, returns null ✅ |
| is_admin() (anon) | 42501 permission denied ✅ |

---

## Signup disable (pending user action)
- User will disable "Allow new users to sign up" in Supabase dashboard
- Dashboard path: Auth → Providers → Email → toggle off → Save
- Post-disable checks (this session):
  - `signUp` attempt must return error
  - Student magic-link login must still work for a ZZTEST student
  - If magic-link breaks: re-enable signups immediately

---

## Phase C–E
Not started. Blocked on signup verification + user go-ahead.

---

## Automation checks
| Check | Status |
|---|---|
| A4 Razorpay key prefix | rzp_live_ — confirmed |
| A5 Other apps on same Supabase project | None found |
| A7 Email deliverability | Deferred |
| A8a Webhook sig check | Working (401 on bad sig) |
| A8b Deposit poll RPC | ✅ Callable by anon, returns deposit_status |
| A8c create-razorpay-order | Working |
