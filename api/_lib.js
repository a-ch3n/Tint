const { sql } = require('@vercel/postgres');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.SESSION_SECRET || 'change-me-in-production-please';
const COOKIE_NAME = 'jou_admin';

let initialized = false;
async function ensureSchema() {
  if (initialized) return;
  await sql`
    CREATE TABLE IF NOT EXISTS quotes (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      vehicle TEXT,
      vehicle_type TEXT,
      package TEXT,
      film TEXT,
      darkness TEXT,
      message TEXT,
      status TEXT DEFAULT 'new',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  try { await sql`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS vehicle_type TEXT`; } catch {}
  await sql`CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotes(created_at DESC);`;
  initialized = true;
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return Object.fromEntries(
    header.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, decodeURIComponent(v.join('='))];
    }).filter(([k]) => k)
  );
}

function setAuthCookie(res, username) {
  const token = jwt.sign({ u: username }, JWT_SECRET, { expiresIn: '8h' });
  const secure = process.env.VERCEL_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 8}${secure}`
  );
}

function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`);
}

function checkAuth(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

async function sendNotificationEmail(quote) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.NOTIFY_EMAIL) return;
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    await transporter.sendMail({
      from: `"Jou Tints Website" <${process.env.SMTP_USER}>`,
      to: process.env.NOTIFY_EMAIL,
      subject: `New Quote Request — ${quote.name}`,
      text: `
New quote from joutints website:

Name:     ${quote.name}
Phone:    ${quote.phone || '(not given)'}
Email:    ${quote.email || '(not given)'}
Vehicle:  ${quote.vehicle || '(not given)'}
Type:     ${quote.vehicleType || '(not given)'}
Package:  ${quote.package || '(not specified)'}
Film:     ${quote.film || '(not specified)'}
Darkness: ${quote.darkness || '(not specified)'}

Message:
${quote.message || '(none)'}

View in dashboard: ${process.env.PUBLIC_URL || ''}/admin
      `.trim()
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

module.exports = {
  sql,
  ensureSchema,
  parseCookies,
  setAuthCookie,
  clearAuthCookie,
  checkAuth,
  bcrypt,
  sendNotificationEmail
};
