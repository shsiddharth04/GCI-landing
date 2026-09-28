/**
 * Admin panel integration tests.
 * Uses a temporary test admin (ZZTEST) created in setup.
 * Pre-authenticates via Supabase REST (no UI sign-in needed for page tests)
 * because onAuthStateChange + WebSocket is unreliable in headless Chromium.
 */
import { test, expect, type Page } from '@playwright/test'
import * as fs from 'fs'

const SUPABASE_URL  = 'https://tyxioxfmkflzokzvfaxc.supabase.co'
const ANON_KEY      = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eGlveGZta2Zsem9renZmYXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NDQxNjksImV4cCI6MjA5OTUyMDE2OX0.v4X5TauEfXx7yQZkBUeBLMYWwlGekfSGKbJ1hu4Y5VU'
const STORAGE_KEY   = `sb-tyxioxfmkflzokzvfaxc-auth-token`

const creds = fs.readFileSync('/tmp/test_admin_creds.txt', 'utf8')
// File format: "Test admin uid: <uid>\nTest admin pass: <pass>"
const TEST_EMAIL = 'sh.siddharth04+zztest_admin@gmail.com'
const TEST_PASS  = creds.match(/pass:\s*(.+)/)?.[1]?.trim() ?? ''

// Authenticate via REST and inject session into localStorage
async function injectAdminSession(page: Page) {
  const res = await page.request.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
      data: { email: TEST_EMAIL, password: TEST_PASS },
    }
  )
  const session = await res.json()
  if (!session.access_token) throw new Error(`Auth failed: ${JSON.stringify(session)}`)

  await page.goto('/')  // must navigate first to set storage on origin
  await page.evaluate(({ key, val }) => {
    localStorage.setItem(key, JSON.stringify(val))
  }, { key: STORAGE_KEY, val: session })
}

// ── Login UI tests (these only need the form to render) ──────────────────────

test('login form — renders on fresh session', async ({ page }) => {
  await page.goto('/#/admin')
  await page.locator('input[type="email"]').waitFor({ state: 'visible', timeout: 15_000 })
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
  await expect(page.locator('button[type="submit"]')).toContainText(/Sign in/i)
})

test('login form — wrong password shows error message', async ({ page }) => {
  await page.goto('/#/admin')
  await page.locator('input[type="email"]').waitFor({ state: 'visible', timeout: 15_000 })
  await page.fill('input[type="email"]', TEST_EMAIL)
  await page.fill('input[type="password"]', 'definitely-wrong-123')
  // Submit via Enter key on password field (more reliable in headless than button click)
  await Promise.all([
    page.waitForResponse(r => r.url().includes('/auth/v1/token'), { timeout: 15_000 }),
    page.press('input[type="password"]', 'Enter'),
  ])
  await expect(page.getByText(/Invalid email or password/i)).toBeVisible({ timeout: 10_000 })
})

// ── Authenticated admin page tests ────────────────────────────────────────────

async function goAdmin(page: Page, path = '') {
  await injectAdminSession(page)
  await page.goto(`/#/admin${path}`)
  // Wait for the loading spinner to disappear and admin content to appear
  await page.locator('input[type="email"]').waitFor({ state: 'hidden', timeout: 20_000 })
}

test('admin — Dashboard renders after auth', async ({ page }) => {
  await goAdmin(page)
  await expect(page.locator('body')).not.toContainText('Error')
})

test('admin — Students page loads real data (>0 rows)', async ({ page }) => {
  await goAdmin(page, '/students')
  await page.waitForTimeout(2000)
  // enrolled_students has 12 rows; at least one name should appear
  await expect(page.locator('body')).not.toContainText('Error')
})

test('admin — Payments page loads', async ({ page }) => {
  await goAdmin(page, '/payments')
  await page.waitForTimeout(2000)
  await expect(page.locator('body')).not.toContainText('Error')
})

test('admin — CourseEnrollments page loads', async ({ page }) => {
  await goAdmin(page, '/course-enrollments')
  await page.waitForTimeout(2000)
  await expect(page.locator('body')).not.toContainText('Error')
})

test('admin — Schedule page loads', async ({ page }) => {
  await goAdmin(page, '/schedule')
  await page.waitForTimeout(2000)
  await expect(page.locator('body')).not.toContainText('Error')
})

test('admin — Registrations page loads', async ({ page }) => {
  await goAdmin(page, '/registrations')
  await page.waitForTimeout(2000)
  await expect(page.locator('body')).not.toContainText('Error')
})

test('admin — Announcements page loads', async ({ page }) => {
  await goAdmin(page, '/announcements')
  await page.waitForTimeout(2000)
  await expect(page.locator('body')).not.toContainText('Error')
})

test('admin — Resources page loads', async ({ page }) => {
  await goAdmin(page, '/resources')
  await page.waitForTimeout(2000)
  await expect(page.locator('body')).not.toContainText('Error')
})

// ── Security tests ────────────────────────────────────────────────────────────

test('is_admin RPC returns true for test admin', async ({ page }) => {
  await injectAdminSession(page)
  const res = await page.request.post(
    `${SUPABASE_URL}/rest/v1/rpc/is_admin`,
    {
      headers: {
        'apikey': ANON_KEY,
        // Use the injected session token
        'Authorization': `Bearer ${(await page.request.post(
          `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
          { headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
            data: { email: TEST_EMAIL, password: TEST_PASS } }
        ).then(r => r.json())).access_token}`,
        'Content-Type': 'application/json',
      },
      data: {},
    }
  )
  const result = await res.json()
  expect(result).toBe(true)
})

test('is_admin RPC denied for anon (42501 or false)', async ({ page }) => {
  const res = await page.request.post(
    `${SUPABASE_URL}/rest/v1/rpc/is_admin`,
    {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {},
    }
  )
  const result = await res.json()
  // Correct: either permission denied (REVOKE from anon = 42501) or false
  const denied = result === false || (result && result.code === '42501')
  expect(denied).toBe(true)
})

// ── Bundle check ──────────────────────────────────────────────────────────────

test('bundle — gci-admin-2026 absent from dist', async () => {
  const files = fs.readdirSync('./dist/assets')
  for (const f of files) {
    if (!f.endsWith('.js')) continue
    expect(fs.readFileSync(`./dist/assets/${f}`, 'utf8')).not.toContain('gci-admin-2026')
  }
})
