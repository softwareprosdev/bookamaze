import { test as base } from '@playwright/test'
import type { Page, BrowserContext } from '@playwright/test'

interface AuthenticatedUser {
  id: string
  email: string
  displayName: string
}

interface TestFixtures {
  authenticatedPage: Page
  authenticatedContext: BrowserContext
  createTestUser: () => Promise<AuthenticatedUser>
  loginUser: (email: string, password: string) => Promise<void>
  cleanupTestUser: (email: string) => Promise<void>
}

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await use(page)
  },
  authenticatedContext: async ({ browser }, use) => {
    const context = await browser.newContext()
    await use(context)
  },
  createTestUser: async () => {
    const timestamp = Date.now()
    const email = `test-${timestamp}@example.com`
    const password = 'testpass123'
    const displayName = `Test User ${timestamp}`
    
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to create test user: ${await response.text()}`)
    }
    
    const data = await response.json()
    return { id: data.user.id, email: data.user.email, displayName: data.user.displayName }
  },
  loginUser: async ({ page }, use) => {
    const login = async (email: string, password: string) => {
      await page.goto('/login')
      await page.getByLabel('Email').fill(email)
      await page.getByLabel('Password').fill(password)
      await page.getByRole('button', { name: 'Login' }).click()
      await page.waitForURL('/dashboard')
    }
    await use(login)
    await page.context().clearCookies()
  },
  cleanupTestUser: async ({ request }, use) => {
    const cleanup = async (email: string) => {
      // Note: There's no delete user API, but we can clean up the database manually if needed
    }
    await use(cleanup)
  },
})

export { expect } from '@playwright/test'