# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> Navigation >> should have library page placeholder
- Location: e2e\app.spec.ts:157:3

# Error details

```
Error: page.goto: NS_ERROR_CONNECTION_REFUSED
Call log:
  - navigating to "http://localhost:3000/library", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - heading "Unable to connect" [level=1] [ref=e5]
    - paragraph [ref=e6]: Firefox can’t establish a connection to the server at localhost:3000.
    - paragraph
    - list [ref=e8]:
      - listitem [ref=e9]: The site could be temporarily unavailable or too busy. Try again in a few moments.
      - listitem [ref=e10]: If you are unable to load any pages, check your computer’s network connection.
      - listitem [ref=e11]: If your computer or network is protected by a firewall or proxy, make sure that Nightly is permitted to access the web.
  - button "Try Again" [active] [ref=e13]
```

# Test source

```ts
  58  |     await page.getByLabel('Password').fill('password123')
  59  |     await page.getByRole('button', { name: 'Login' }).click()
  60  |     await expect(page.locator('text=Email and password are required')).toBeVisible()
  61  |   })
  62  | 
  63  |   test('should show error for non-existent user', async ({ page }) => {
  64  |     await page.goto('/login')
  65  |     await page.getByLabel('Email').fill('nonexistent@example.com')
  66  |     await page.getByLabel('Password').fill('password123')
  67  |     await page.getByRole('button', { name: 'Login' }).click()
  68  |     await expect(page.locator('text=Invalid email or password')).toBeVisible()
  69  |   })
  70  | 
  71  |   test('should navigate to register page', async ({ page }) => {
  72  |     await page.goto('/login')
  73  |     await page.getByRole('link', { name: 'Create one' }).click()
  74  |     await expect(page).toHaveURL('/register')
  75  |   })
  76  | 
  77  |   test('should show loading state during login', async ({ page }) => {
  78  |     await page.goto('/login')
  79  |     await page.getByLabel('Email').fill('test@example.com')
  80  |     await page.getByLabel('Password').fill('password123')
  81  |     await page.getByRole('button', { name: 'Login' }).click()
  82  |     await expect(page.getByText('Logging in...')).toBeVisible()
  83  |   })
  84  | })
  85  | 
  86  | test.describe('Register Page', () => {
  87  |   test('should display registration form', async ({ page }) => {
  88  |     await page.goto('/register')
  89  |     await expect(page.locator('h2')).toContainText('Get started')
  90  |     await expect(page.getByLabel('Email')).toBeVisible()
  91  |     await expect(page.getByLabel('Display Name')).toBeVisible()
  92  |     await expect(page.getByLabel('Password')).toBeVisible()
  93  |     await expect(page.getByLabel('Confirm Password')).toBeVisible()
  94  |   })
  95  | 
  96  |   test('should show error for password mismatch', async ({ page }) => {
  97  |     await page.goto('/register')
  98  |     await page.getByLabel('Email').fill('test@example.com')
  99  |     await page.getByLabel('Password').fill('password123')
  100 |     await page.getByLabel('Confirm Password').fill('password456')
  101 |     await page.getByRole('button', { name: 'Create Account' }).click()
  102 |     await expect(page.locator('text=Passwords do not match')).toBeVisible()
  103 |   })
  104 | 
  105 |   test('should show error for short password', async ({ page }) => {
  106 |     await page.goto('/register')
  107 |     await page.getByLabel('Email').fill('test@example.com')
  108 |     await page.getByLabel('Password').fill('12345')
  109 |     await page.getByLabel('Confirm Password').fill('12345')
  110 |     await page.getByRole('button', { name: 'Create Account' }).click()
  111 |     await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible()
  112 |   })
  113 | 
  114 |   test('should show error for duplicate email', async ({ page }) => {
  115 |     await page.goto('/register')
  116 |     await page.getByLabel('Email').fill('test@example.com')
  117 |     await page.getByLabel('Password').fill('password123')
  118 |     await page.getByLabel('Confirm Password').fill('password123')
  119 |     await page.getByRole('button', { name: 'Create Account' }).click()
  120 |     await expect(page.locator('text=Email already registered')).toBeVisible()
  121 |   })
  122 | 
  123 |   test('should navigate to login page', async ({ page }) => {
  124 |     await page.goto('/register')
  125 |     await page.getByRole('link', { name: 'Login' }).click()
  126 |     await expect(page).toHaveURL('/login')
  127 |   })
  128 | })
  129 | 
  130 | test.describe('Dashboard', () => {
  131 |   test('should redirect to login when not authenticated', async ({ page }) => {
  132 |     await page.goto('/dashboard')
  133 |     await expect(page).toHaveURL('/login')
  134 |   })
  135 | 
  136 |   test('should display dashboard when authenticated', async ({ page, context }) => {
  137 |     await context.addCookies([
  138 |       {
  139 |         name: 'bookamaze_session',
  140 |         value: 'test-session',
  141 |         domain: 'localhost',
  142 |         path: '/',
  143 |       },
  144 |     ])
  145 |     await page.goto('/dashboard')
  146 |     await expect(page.locator('h1')).toContainText('Bookamaze')
  147 |   })
  148 | })
  149 | 
  150 | test.describe('Navigation', () => {
  151 |   test('should have upload page placeholder', async ({ page }) => {
  152 |     await page.goto('/upload')
  153 |     await expect(page.locator('h1')).toContainText('Upload PDF')
  154 |     await expect(page.locator('text=Coming soon')).toBeVisible()
  155 |   })
  156 | 
  157 |   test('should have library page placeholder', async ({ page }) => {
> 158 |     await page.goto('/library')
      |                ^ Error: page.goto: NS_ERROR_CONNECTION_REFUSED
  159 |     await expect(page.locator('h1')).toContainText('My Library')
  160 |     await expect(page.locator('text=Coming soon')).toBeVisible()
  161 |   })
  162 | 
  163 |   test('should have discover page placeholder', async ({ page }) => {
  164 |     await page.goto('/discover')
  165 |     await expect(page.locator('h1')).toContainText('Discover Books')
  166 |     await expect(page.locator('text=Coming soon')).toBeVisible()
  167 |   })
  168 | })
  169 | 
  170 | test.describe('API Endpoints', () => {
  171 |   test('GET /api/auth/me should return unauthorized when not logged in', async ({ request }) => {
  172 |     const response = await request.get('/api/auth/me')
  173 |     expect(response.status()).toBe(200)
  174 |     const data = await response.json()
  175 |     expect(data.user).toBeNull()
  176 |   })
  177 | 
  178 |   test('POST /api/auth/logout should return success', async ({ request }) => {
  179 |     const response = await request.post('/api/auth/logout')
  180 |     expect(response.status()).toBe(200)
  181 |     const data = await response.json()
  182 |     expect(data.success).toBe(true)
  183 |   })
  184 | })
```