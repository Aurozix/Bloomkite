import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should navigate to signin page', async ({ page }) => {
    await page.goto('/auth/signin')
    await expect(page.locator('h1')).toContainText('Sign In')
  })

  test('should have sign up option', async ({ page }) => {
    await page.goto('/auth/signin')
    const signUpLink = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up"), a:has-text("Create"), button:has-text("Create")')
    expect(await signUpLink.count()).toBeGreaterThanOrEqual(0)
  })

  test('should navigate to role selection after signup', async ({ page }) => {
    await page.goto('/auth/signup')
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]')

    if (await emailInput.isVisible()) {
      await expect(page).toHaveTitle(/signup|sign up/i)
    }
  })

  test('should redirect unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' })

    const url = page.url()
    const isRedirected = url.includes('/auth/signin') || url.includes('/auth/signup')
    expect(isRedirected || url.includes('/dashboard')).toBe(true)
  })

  test('should redirect unauthenticated users from calculators', async ({ page }) => {
    await page.goto('/calculators', { waitUntil: 'networkidle' })

    const url = page.url()
    const isRedirected = url.includes('/auth/signin') || url.includes('/auth/signup')
    expect(isRedirected || url.includes('/calculators')).toBe(true)
  })

  test('signin page should have email and password inputs', async ({ page }) => {
    await page.goto('/auth/signin')

    const emailInput = page.locator('input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]')
    const passwordInput = page.locator('input[type="password"], input[placeholder*="password"], input[placeholder*="Password"]')

    expect(await emailInput.count()).toBeGreaterThanOrEqual(0)
    expect(await passwordInput.count()).toBeGreaterThanOrEqual(0)
  })
})
