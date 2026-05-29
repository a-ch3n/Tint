// POST /api/admin/login — authenticate admin
const { bcrypt, setAuthCookie } = require('../_lib');

const DEFAULT_HASH = '$2b$10$nA6gn73PMUHCAmkMyMu3e.jf1Cnfn.Ho.Xj3JDf1phjPPxhNEBf12'; // "changeme"

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Accept both form-encoded and JSON
    const username = req.body.username;
    const password = req.body.password;

    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminHash = process.env.ADMIN_PASS_HASH || DEFAULT_HASH;

    if (username !== adminUser) {
      return res.redirect(302, '/admin/login?error=1');
    }

    const ok = await bcrypt.compare(password || '', adminHash);
    if (!ok) {
      return res.redirect(302, '/admin/login?error=1');
    }

    setAuthCookie(res, username);
    res.redirect(302, '/admin');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error');
  }
};
