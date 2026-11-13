// Synthetic browser fixtures only: intercept every auth, data and email request.
// This script never signs in a real user and never sends live email.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { loadEnv } from 'vite';
import { renderEmail } from '../server/follow-up-email.mjs';

const env = loadEnv('development', process.cwd(), '');
const dbUrl = new URL(env.VITE_SUPABASE_URL);
const ids = [1, 2, 3, 4].map(n => `00000000-0000-4000-8000-00000000000${n}`);
const names = ['Alpha Partner', 'Bravo Partner', 'Charlie Partner', 'Delta Partner'];
const rows = ids.map((id, i) => ({ id, first_name: names[i], last_name: '', email: `partner${i}@example.com`, registered_at: '2026-11-10T00:00:00Z', ai_profile_completed: i === 1 || i === 3 }));
const user = { id: '00000000-0000-4000-8000-000000000099', aud: 'authenticated', role: 'authenticated', email: 'admin@example.com', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
const jwt = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })).toString('base64url')}.fixture`;
const browser = await chromium.launch({ executablePath: process.env.PRERENDER_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(({ key, jwt, user }) => {
    if (window.top !== window) return;
    localStorage.setItem('adminUser', JSON.stringify({ email: user.email, adminId: 'Admin' }));
    localStorage.setItem(key, JSON.stringify({ access_token: jwt, refresh_token: 'fixture-only', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user }));
  }, { key: `sb-${dbUrl.hostname.split('.')[0]}-auth-token`, jwt, user });
  await page.route(`${dbUrl.origin}/**`, route => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith('/storage/v1/object/public/logo/')) return route.fulfill({ path: 'public/Photas/aaf68a14-dda6-4743-824f-5bc2592df449.png', contentType: 'image/png' });
    let json = [];
    if (path === '/auth/v1/user') json = user;
    else if (path.endsWith('/admin_profiles')) json = { id: user.id };
    else if (path.endsWith('/admin_partner_overview')) json = rows;
    else if (path.endsWith('/registration_partner_profiles')) json = ids.map((id, i) => ({ id, agreement_signed: i >= 2 }));
    return route.fulfill({ json });
  });
  let drafts = 0;
  let sends = 0;
  await page.route('**/api/follow-up', route => {
    const body = route.request().postDataJSON();
    if (body.action === 'send') {
      sends++;
      if (body.draftToken === `draft-${ids[1]}`) return route.fulfill({ status: 502, json: { error: 'Mock delivery status unknown. Check ZeptoMail logs.' } });
      return route.fulfill({ json: { sent: true, messageId: `mock-${sends}` } });
    }
    drafts++;
    const i = ids.indexOf(body.partnerId);
    const partner = { id: body.partnerId, name: names[i], email: rows[i].email, registrationDate: rows[i].registered_at, milestones: [{ id: 'profile', complete: rows[i].ai_profile_completed }, { id: 'agreement', complete: i >= 2 }] };
    const html = renderEmail({ subject: `Follow-up for ${partner.name}`, heading: 'Your next chapter starts here.', paragraphs: ['Thank you for registering with BNC LEG.', 'Please complete your remaining onboarding steps.'], closing: 'We look forward to working together.' }, partner, 'https://partners.bncglobal.in/login');
    return route.fulfill({ json: { subject: `Follow-up for ${partner.name}`, html, to: partner.email, from: 'noreply@bncglobal.in', draftToken: `draft-${partner.id}` } });
  });
  await page.goto(`${process.env.CRM_TEST_URL || 'http://localhost:5173'}/admin-dashboard?view=followups`);
  await page.getByRole('heading', { name: 'Follow-ups', exact: true }).waitFor({ timeout: 30000 });
  assert.equal(await page.locator('tbody tr').count(), 4);
  await page.getByRole('button', { name: 'Alpha Partner', exact: true }).click();
  await page.getByRole('dialog', { name: 'Alpha Partner' }).waitFor();
  assert.equal(await page.locator('tbody tr').count(), 4, 'Journey keeps the table mounted');
  await page.getByRole('button', { name: 'Close partner journey' }).click();
  await page.getByLabel('Filter agreement').selectOption('unsigned');
  assert.equal(await page.locator('tbody tr').count(), 2);
  await page.getByRole('button', { name: 'Select all (2)', exact: true }).click();
  await page.getByLabel('Filter AI profile').selectOption('incomplete');
  assert.equal(await page.locator('tbody tr').count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Email selected', exact: true }).isDisabled(), true, 'Changing filters clears the selection');
  await page.getByLabel('Filter AI profile').selectOption('all');
  await page.getByLabel('Filter agreement').selectOption('all');
  await page.getByRole('button', { name: 'Select all (3)', exact: true }).click();
  assert.equal(await page.getByRole('checkbox', { name: 'Select Delta Partner', exact: true }).isDisabled(), true);
  await page.getByRole('button', { name: 'Email selected (3)', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Email 3 partners' });
  await drawer.waitFor();
  await drawer.evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
  const bounds = await drawer.boundingBox();
  assert.ok(Math.abs(bounds.x + bounds.width - 1440) <= 2, 'Drawer aligns to the right');
  await page.getByRole('button', { name: 'Generate 3 drafts', exact: true }).click();
  await page.getByRole('button', { name: 'Send 3 emails', exact: true }).waitFor();
  const frame = page.frameLocator('iframe[title="HTML follow-up email preview"]');
  await frame.getByRole('heading', { name: /Your next chapter starts here/ }).waitFor();
  await frame.locator('img').first().evaluate(image => image.decode());
  assert.equal(drafts, 3);
  assert.equal(sends, 0, 'Generating drafts never sends');
  await page.screenshot({ path: `${process.env.TEMP}/bnc-bulk-drawer-final.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const sendBox = await page.getByRole('button', { name: 'Send 3 emails', exact: true }).boundingBox();
  assert.ok(sendBox && sendBox.y + sendBox.height <= 844 && sendBox.x + sendBox.width <= 390);
  await page.getByRole('button', { name: 'Send 3 emails', exact: true }).click();
  await page.getByText('2 of 3 emails accepted by ZeptoMail.', { exact: false }).waitFor();
  assert.equal(sends, 3);
  assert.equal(await page.getByRole('button', { name: /^Send \d+ emails$/ }).count(), 0, 'No automatic resending of attempted recipients');
  assert.deepEqual(errors, []);
  console.log('Journey modal, combined filters, Select All, personalised previews, right drawer, mobile footer and partial delivery statuses passed. Real emails sent: 0.');
} finally {
  await browser.close();
}
