// Browser-only smoke tests for the separate public CMS preview.
// Never submit forms, pass Cloudflare Access credentials or modify production.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const PREVIEW = 'https://cms-preview.nawazsharif.in';
const PRODUCTION = 'https://nawazsharif.in';
const PAGES = [
  '/index.html', '/about.html', '/articles.html', '/faq.html',
  '/contact.html', '/privacy-policy.html', '/terms.html'
];
const SCREENSHOTS = 'test-results/cms-screenshots';

async function inspectPage(page, path, width, screenshot = false) {
  const response = await page.goto(PREVIEW + path, { waitUntil: 'domcontentloaded', timeout: 45000 });
  expect(response, 'Page should respond').toBeTruthy();
  expect(response.status(), path + ' HTTP status').toBe(200);
  expect(response.headers()['x-robots-tag'] || '', 'CMS preview must not be indexed').toContain('noindex');

  await expect(page.locator('main#main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).not.toBeEmpty();
  await expect(page.locator('a[href="/about.html"]').first()).toHaveAttribute('href', '/about.html');
  await expect(page.locator('link[rel="stylesheet"][href="/style.css"]')).toHaveCount(1);
  await expect(page.locator('script[src="/consent.js"]')).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);

  // Browser and viewport differ by a pixel due to rounding; allow 5px slack.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, width + 'px: no unexpected horizontal page overflow on ' + path).toBeLessThanOrEqual(5);

  if (screenshot) {
    fs.mkdirSync(SCREENSHOTS, { recursive: true });
    await page.screenshot({
      path: SCREENSHOTS + '/' + path.replace(/\W+/g, '-') + '-' + width + '.png',
      fullPage: true,
      animations: 'disabled'
    });
  }
}

test.describe('CMS preview desktop', () => {
  test.use({ viewport: { width: 1365, height: 900 }, deviceScaleFactor: 1 });
  for (const path of PAGES) {
    test('preserves original page on desktop: ' + path, async ({ page }) => {
      await inspectPage(page, path, 1365, path === '/index.html' || path === '/contact.html');
    });
  }
});

test.describe('CMS preview mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  for (const path of ['/index.html', '/articles.html', '/contact.html']) {
    test('preserves original page on mobile: ' + path, async ({ page }) => {
      await inspectPage(page, path, 390, path === '/index.html' || path === '/contact.html');
    });
  }
});

test('contact form markup matches live site without submitting a message', async ({ page, request }) => {
  const liveResponse = await request.get(PRODUCTION + '/contact.html');
  expect(liveResponse.status()).toBe(200);
  const html = await liveResponse.text();
  const expectedEndpoint = html.match(/<form\b[^>]*action="(https:\/\/formspree\.io\/f\/[a-z0-9]+)"/i)?.[1];
  const expectedSiteKey = html.match(/class="g-recaptcha"[^>]*data-sitekey="([^"]+)"/i)?.[1];
  expect(expectedEndpoint, 'Live contact endpoint').toBeTruthy();
  expect(expectedSiteKey, 'Live CAPTCHA site key').toBeTruthy();

  const response = await page.goto(PREVIEW + '/contact.html', { waitUntil: 'domcontentloaded' });
  expect(response.status()).toBe(200);
  const form = page.locator('form#portfolio-form');
  await expect(form).toHaveAttribute('action', expectedEndpoint);
  await expect(form.locator('.g-recaptcha')).toHaveAttribute('data-sitekey', expectedSiteKey);
  await expect(form.locator('textarea[name="message"]')).toHaveAttribute('maxlength', '2000');
  await expect(form.locator('input[name="subject"]')).toHaveAttribute('required', '');
  await expect(form.locator('input[name="designation"]')).toHaveCount(1);
  await expect(page.locator('script[src*="recaptcha/api.js"]')).toHaveCount(1);
  await expect(page.locator('script[src="/form-home.js"]')).toHaveCount(1);
  // Do not click Send or claim delivery/CAPTCHA validation: human verification is still needed.
});

test('privacy choices appear; rejecting optional analytics does not enable tracking', async ({ page }) => {
  await page.goto(PREVIEW + '/index.html', { waitUntil: 'domcontentloaded' });
  const privacyPanel = page.locator('#ns-privacy-panel');
  await expect(privacyPanel).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#ns-privacy-reject')).toBeVisible();
  await page.locator('#ns-privacy-reject').click();
  await expect(privacyPanel).toBeHidden();
  const choice = await page.evaluate(() => JSON.parse(localStorage.getItem('ns_cookie_preferences_v1') || 'null'));
  expect(choice).toMatchObject({ version: 1, analytics: false });
  await expect(page.locator('.ns-privacy-footer-link')).toHaveCount(1);
});


test('article API is readable from the CMS preview with explicit CORS', async ({ request }) => {
  const url = 'https://nawaz-site-api.nawaz-site-observer.workers.dev/api/v1/articles?limit=50';
  const response = await request.get(url, { headers: { Origin: PREVIEW } });
  expect(response.status()).toBe(200);
  expect(response.headers()['access-control-allow-origin']).toBe(PREVIEW);
  const body = await response.json();
  expect(Array.isArray(body.articles)).toBe(true);
  expect(body.articles.length).toBeGreaterThan(0);
  const preflight = await request.fetch(url, { method: 'OPTIONS', headers: { Origin: PREVIEW } });
  expect(preflight.status()).toBe(204);
  expect(preflight.headers()['access-control-allow-origin']).toBe(PREVIEW);
  // Public read-only API: anonymous writes must continue to be rejected.
  const denied = await request.post(url, { data: { title: 'do not publish' } });
  expect(denied.status()).toBe(405);
});

test('preview article archive uses dynamic content API, not static fallback', async ({ page }) => {
  const response = await page.goto(PREVIEW + '/articles.html', { waitUntil: 'domcontentloaded' });
  expect(response.status()).toBe(200);
  await expect(page.locator('#dynamic-article-grid')).toBeVisible({ timeout: 18000 });
  await expect(page.locator('#static-article-grid')).toBeHidden();
  expect(await page.locator('#dynamic-article-grid .card').count()).toBeGreaterThan(0);
});
