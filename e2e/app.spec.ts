import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should load the home page with correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Welcome to Bookamaze')
  })

  test('should show login and register buttons when not authenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible()
  })

  test('should have links to other pages', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login')
    await expect(page.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register')
  })

  test('should display feature list', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Secure email/password authentication')).toBeVisible()
    await expect(page.locator('text=Protected dashboard')).toBeVisible()
    await expect(page.locator('text=Local SQLite storage')).toBeVisible()
  })

  test('should navigate to login page when clicking login', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Login' }).click()
    await expect(page).toHaveURL('/login')
  })

  test('should navigate to register page when clicking register', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Register' }).click()
    await expect(page).toHaveURL('/register')
  })
})

test.describe('Login Page', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h2')).toContainText('Welcome back')
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })

  test('should show error for empty credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Login' }).click()
    await expect(page.locator('text=Email and password are required')).toBeVisible()
  })

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('invalid-email')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()
    await expect(page.locator('text=Email and password are required')).toBeVisible()
  })

  test('should show error for non-existent user', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('nonexistent@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()
    await expect(page.locator('text=Invalid email or password')).toBeVisible()
  })

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Create one' }).click()
    await expect(page).toHaveURL('/register')
  })

  test('should show loading state during login', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()
    await expect(page.getByText('Logging in...')).toBeVisible()
  })
})

test.describe('Register Page', () => {
  test('should display registration form', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('h2')).toContainText('Get started')
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Display Name')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByLabel('Confirm Password')).toBeVisible()
  })

  test('should show error for password mismatch', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByLabel('Confirm Password').fill('password456')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(page.locator('text=Passwords do not match')).toBeVisible()
  })

  test('should show error for short password', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('12345')
    await page.getByLabel('Confirm Password').fill('12345')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible()
  })

  test('should show error for duplicate email', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByLabel('Confirm Password').fill('password123')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(page.locator('text=Email already registered')).toBeVisible()
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('link', { name: 'Login' }).click()
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Dashboard', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test('should display dashboard when authenticated', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'bookamaze_session',
        value: 'test-session',
        domain: 'localhost',
        path: '/',
      },
    ])
    await page.goto('/dashboard')
    await expect(page.locator('h1')).toContainText('Bookamaze')
  })
})

test.describe('Navigation', () => {
  test('should have upload page placeholder', async ({ page }) => {
    await page.goto('/upload')
    await expect(page.locator('h1')).toContainText('Upload PDF')
    await expect(page.locator('text=Coming soon')).toBeVisible()
  })

  test('should have library page placeholder', async ({ page }) => {
    await page.goto('/library')
    await expect(page.locator('h1')).toContainText('My Library')
    await expect(page.locator('text=Coming soon')).toBeVisible()
  })

  test('should have discover page placeholder', async ({ page }) => {
    await page.goto('/discover')
    await expect(page.locator('h1')).toContainText('Discover Books')
    await expect(page.locator('text=Coming soon')).toBeVisible()
  })
})

test.describe('API Endpoints', () => {
  test('GET /api/auth/me should return unauthorized when not logged in', async ({ request }) => {
    const response = await request.get('/api/auth/me')
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.user).toBeNull()
  })

  test('POST /api/auth/logout should return success', async ({ request }) => {
    const response = await request.post('/api/auth/logout')
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })
})