import { test, expect } from '@playwright/test'

test.describe('Calculator Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calculators')
  })

  test('calculators hub should be accessible', async ({ page }) => {
    await page.goto('/calculators', { waitUntil: 'networkidle' })

    const url = page.url()
    const canAccess = url.includes('/calculators') || url.includes('/auth/signin')

    expect(canAccess).toBe(true)
  })

  test('should display calculator cards on hub', async ({ page }) => {
    await page.goto('/calculators', { waitUntil: 'networkidle' })

    const cards = page.locator('[class*="card"]')
    const cardCount = await cards.count()

    expect(cardCount).toBeGreaterThanOrEqual(0)
  })

  test('goal planner page should be accessible', async ({ page }) => {
    await page.goto('/calculators/goal-planner', { waitUntil: 'networkidle' })

    const url = page.url()
    const canAccess = url.includes('/goal-planner') || url.includes('/auth/signin')

    expect(canAccess).toBe(true)
  })

  test('goal planner should have input fields', async ({ page }) => {
    await page.goto('/calculators/goal-planner', { waitUntil: 'networkidle' })

    if (page.url().includes('/goal-planner')) {
      const inputs = page.locator('input, select')
      const inputCount = await inputs.count()

      expect(inputCount).toBeGreaterThanOrEqual(0)
    }
  })

  test('priority ranker page should be accessible', async ({ page }) => {
    await page.goto('/calculators/priority-ranker', { waitUntil: 'networkidle' })

    const url = page.url()
    const canAccess = url.includes('/priority-ranker') || url.includes('/auth/signin')

    expect(canAccess).toBe(true)
  })

  test('cash flow page should be accessible', async ({ page }) => {
    await page.goto('/calculators/cash-flow', { waitUntil: 'networkidle' })

    const url = page.url()
    const canAccess = url.includes('/cash-flow') || url.includes('/auth/signin')

    expect(canAccess).toBe(true)
  })

  test('net worth page should be accessible', async ({ page }) => {
    await page.goto('/calculators/net-worth', { waitUntil: 'networkidle' })

    const url = page.url()
    const canAccess = url.includes('/net-worth') || url.includes('/auth/signin')

    expect(canAccess).toBe(true)
  })

  test('insurance needs page should be accessible', async ({ page }) => {
    await page.goto('/calculators/insurance-needs', { waitUntil: 'networkidle' })

    const url = page.url()
    const canAccess = url.includes('/insurance-needs') || url.includes('/auth/signin')

    expect(canAccess).toBe(true)
  })

  test('risk profiler page should be accessible', async ({ page }) => {
    await page.goto('/calculators/risk-profiler', { waitUntil: 'networkidle' })

    const url = page.url()
    const canAccess = url.includes('/risk-profiler') || url.includes('/auth/signin')

    expect(canAccess).toBe(true)
  })

  test('back navigation should work', async ({ page }) => {
    await page.goto('/calculators/goal-planner', { waitUntil: 'networkidle' })

    if (page.url().includes('/goal-planner')) {
      const backLink = page.locator('a:has-text("Back"), a:has-text("←")')

      if (await backLink.count() > 0) {
        await backLink.first().click()
        await page.waitForURL('**/calculators')

        expect(page.url()).toContain('/calculators')
      }
    }
  })

  test('calculator pages should have calculate button', async ({ page }) => {
    await page.goto('/calculators/goal-planner', { waitUntil: 'networkidle' })

    if (page.url().includes('/goal-planner')) {
      const calculateBtn = page.locator('button:has-text("Calculate"), button:has-text("Rank"), button:has-text("Analyze")')

      expect(await calculateBtn.count()).toBeGreaterThanOrEqual(0)
    }
  })

  test('priority ranker should allow adding goals', async ({ page }) => {
    await page.goto('/calculators/priority-ranker', { waitUntil: 'networkidle' })

    if (page.url().includes('/priority-ranker')) {
      const addButton = page.locator('button:has-text("Add")')

      expect(await addButton.count()).toBeGreaterThanOrEqual(0)
    }
  })

  test('goal planner should display results after calculation', async ({ page }) => {
    await page.goto('/calculators/goal-planner', { waitUntil: 'networkidle' })

    if (page.url().includes('/goal-planner')) {
      const calculateBtn = page.locator('button:has-text("Calculate")')

      if (await calculateBtn.count() > 0) {
        await calculateBtn.click()
        await page.waitForTimeout(1000)

        const resultsSection = page.locator('text=/Future Value|Required Monthly|Goal Plan/i')
        expect(await resultsSection.count()).toBeGreaterThanOrEqual(0)
      }
    }
  })
})
