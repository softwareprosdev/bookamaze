# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> Dashboard >> should redirect to login when not authenticated
- Location: e2e\app.spec.ts:131:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://localhost:3000/login"
Received: "http://localhost:3000/dashboard"
Timeout:  5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    8 × unexpected value "http://localhost:3000/dashboard"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "An error occurred while server rendering /dashboard: (intermediate value).default.fetch is not a function"
  - generic [ref=e5]: "TypeError: (intermediate value).default.fetch is not a function at file:///C:/Users/RangerOne/Documents/bookamaze/node_modules/.pnpm/@tanstack+start-plugin-core_3031f5a704cadc127cbb657880f4795f/node_modules/@tanstack/start-plugin-core/dist/esm/vite/dev-server-plugin/plugin.js:71:106 at process.processTicksAndRejections (node:internal/process/task_queues:103:5)"
  - generic [ref=e6]:
    - text: Click outside, press Esc key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e7]: server.hmr.overlay
    - text: to
    - code [ref=e8]: "false"
    - text: in
    - code [ref=e9]: vite.config.ts
    - text: .
```

# Test source

```ts
  33  | 
  34  |   test('should navigate to register page when clicking register', async ({ page }) => {
  35  |     await page.goto('/')
  36  |     await page.getByRole('link', { name: 'Register' }).click()
  37  |     await expect(page).toHaveURL('/register')
  38  |   })
  39  | })
  40  | 
  41  | test.describe('Login Page', () => {
  42  |   test('should display login form', async ({ page }) => {
  43  |     await page.goto('/login')
  44  |     await expect(page.locator('h2')).toContainText('Welcome back')
  45  |     await expect(page.getByLabel('Email')).toBeVisible()
  46  |     await expect(page.getByLabel('Password')).toBeVisible()
  47  |   })
  48  | 
  49  |   test('should show error for empty credentials', async ({ page }) => {
  50  |     await page.goto('/login')
  51  |     await page.getByRole('button', { name: 'Login' }).click()
  52  |     await expect(page.locator('text=Email and password are required')).toBeVisible()
  53  |   })
  54  | 
  55  |   test('should show error for invalid email format', async ({ page }) => {
  56  |     await page.goto('/login')
  57  |     await page.getByLabel('Email').fill('invalid-email')
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
> 133 |     await expect(page).toHaveURL('/login')
      |                        ^ Error: expect(page).toHaveURL(expected) failed
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
  158 |     await page.goto('/library')
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