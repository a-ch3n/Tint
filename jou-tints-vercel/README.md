# Jou Tints — Window Tinting Website (Vercel Edition)

Full-stack site for **JOU TINTS** window tinting business. Marketing site + quote form + admin dashboard.

## Stack

- **Frontend:** Static HTML/CSS/JS (5 pages — Home, Services, Gallery, About, Contact)
- **Backend:** Vercel Serverless Functions (Node.js)
- **Database:** Vercel Postgres (free tier)
- **Auth:** JWT cookies, bcrypt password hashing
- **Email:** Optional SMTP notifications when new quotes come in

## Project Structure

```
jou-tints/
├── public/                # Static files served at /
│   ├── index.html
│   ├── services.html
│   ├── gallery.html
│   ├── about.html
│   ├── contact.html
│   ├── styles.css
│   ├── script.js
│   ├── assets/logo.jpg
│   └── views/             # Admin HTML
│       ├── login.html
│       └── dashboard.html
├── api/                   # Serverless functions
│   ├── _lib.js            # Shared helpers (DB, auth, email)
│   ├── quote.js           # POST /api/quote (public)
│   └── admin/
│       ├── login.js       # POST /api/admin/login
│       ├── logout.js      # POST /api/admin/logout
│       ├── quotes.js      # GET/PATCH/DELETE /api/admin/quotes
│       └── export.js      # GET /api/admin/export (CSV)
├── vercel.json            # Routing config
├── package.json
└── README.md
```

---

## Deploy to Vercel — Full Walkthrough

### Step 1: Push to GitHub

1. Create a new repo at [github.com/new](https://github.com/new) — name it `jou-tints` or whatever.
2. Upload the entire `jou-tints-vercel` folder contents. Easy ways:
   - **Web UI:** On the empty repo page, click "uploading an existing file" → drag the whole folder in.
   - **Command line:** `cd jou-tints-vercel && git init && git add . && git commit -m "init" && git remote add origin <your-repo-url> && git push -u origin main`

### Step 2: Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in (use GitHub for easiest setup).
2. Click **Import** next to your `jou-tints` repo.
3. **Framework Preset:** leave as "Other" (Vercel auto-detects).
4. Click **Deploy**. Wait ~30 seconds.

You'll get a live URL like `jou-tints-abc123.vercel.app`. **The site itself will work** at this point but the quote form will fail because there's no database yet — let's fix that.

### Step 3: Add Vercel Postgres

1. In your Vercel project dashboard → **Storage** tab.
2. Click **Create Database** → choose **Postgres** → **Create**.
3. Pick a name (e.g. `joutints-db`) and region closest to you.
4. Click **Connect** to your project. Vercel automatically adds the `POSTGRES_*` environment variables.

That's it — `@vercel/postgres` reads those env vars automatically.

### Step 4: Set Required Environment Variables

In Vercel project → **Settings → Environment Variables**, add:

| Variable | Value | Why |
|---|---|---|
| `SESSION_SECRET` | Random 32+ char string. Generate: `openssl rand -hex 32` or use [random.org](https://www.random.org/strings/) | Signs admin JWT tokens |
| `ADMIN_USER` | Your username (e.g. `jou`) | Admin login username |
| `ADMIN_PASS_HASH` | bcrypt hash of your password (see Step 5) | Admin login password |

### Step 5: Generate Your Admin Password Hash

On your computer (you need Node.js installed):

```bash
npx bcryptjs-cli hash YourActualPasswordHere 10
```

OR if that command doesn't exist:

```bash
# In any folder
npm install bcryptjs
node -e "console.log(require('bcryptjs').hashSync('YourActualPasswordHere', 10))"
```

Copy the output (starts with `$2b$10$...`) and paste it as `ADMIN_PASS_HASH` in Vercel.

**Or skip this step entirely** — the default password is `changeme` with username `admin`. Just change it before going public.

### Step 6: Redeploy

After adding env vars, trigger a redeploy: **Deployments tab → top deployment → ••• menu → Redeploy**.

### Step 7: Test

- Visit `your-app.vercel.app` — site loads ✓
- Visit `your-app.vercel.app/contact` and submit a test quote
- Visit `your-app.vercel.app/admin/login` → log in (`admin` / `changeme` by default) → see your test quote in the dashboard

### Step 8 (Optional): Email Notifications

Want an email every time a quote is submitted? Add these env vars (Gmail example):

| Variable | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your sending email |
| `SMTP_PASS` | A **Google App Password** ([generate one here](https://myaccount.google.com/apppasswords) — you need 2FA on first) |
| `NOTIFY_EMAIL` | Where to send alerts (usually the same as `SMTP_USER`) |
| `PUBLIC_URL` | Your live URL (so email links work) |

Redeploy after adding these.

### Step 9: Custom Domain

1. In Vercel project → **Settings → Domains** → add your domain.
2. Vercel gives you DNS records to add at your domain registrar.
3. SSL is automatic and free.

---

## Editing Site Content

All site text and placeholders live in `public/*.html`. Find and replace:

| Placeholder | Replace with |
|---|---|
| `[YOUR PHONE]` | Your phone number, e.g. `(612) 555-1234` |
| `YOURPHONE` | Same number, digits only, no spaces: `6125551234` (this is in `tel:` links) |
| `[YOUR@EMAIL.COM]` | Your business email |
| `[YOUR STREET ADDRESS]` | Your shop address — or `Mobile Service` / `By Appointment` if no shop |
| `[CITY, STATE ZIP]` | Your city/state |

Prices are in `services.html` and `index.html` — search for `$189`, `$349`, etc.

**To replace the logo:** drop a new file at `public/assets/logo.jpg` (keep the filename to avoid editing references).

After editing, push to GitHub — Vercel auto-redeploys.

---

## Admin Dashboard Features

- Real-time list of quote requests (auto-refreshes every 30s)
- Filter: All / New / Contacted / Closed
- One-click status changes
- Click phone/email to call/email
- Delete spam or tests
- Export all data to CSV

---

## Why Vercel Postgres Instead of a File?

Vercel runs your backend as **serverless functions** — short-lived processes that spin up per request. They have no permanent disk, so a SQLite file would get wiped between requests. Postgres lives separately and persists everything. The free tier (~60 hours compute/month) is more than enough for a tinting business's lead volume.

---

## Local Development

```bash
npm install
npm install -g vercel  # if not already
vercel dev             # runs local dev server with all routing
```

You'll need to either:
- Pull env vars from your Vercel project: `vercel env pull`, OR
- Create a `.env.local` file with your `POSTGRES_*` vars copied from Vercel

---

## Troubleshooting

**"404: NOT_FOUND" after deploy**
This usually means Vercel deployed but didn't find an `index.html`. Make sure your repo has the `public/` folder at the root with `index.html` inside it.

**Quote form gives "Server error"**
Postgres probably isn't connected. Go to Vercel → Storage → make sure the database is linked to this project, then redeploy.

**Admin login redirects back to login**
Cookie can't be set — make sure `SESSION_SECRET` is set in env vars and you redeployed after adding it.
