const { sql, ensureSchema, checkAuth } = require('../_lib');

module.exports = async (req, res) => {
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await ensureSchema();

    const url = new URL(req.url, `http://${req.headers.host}`);
    const idParam = url.searchParams.get('id');

    if (req.method === 'GET') {
      const status = url.searchParams.get('status');
      let quotes;
      if (status && ['new', 'contacted', 'closed'].includes(status)) {
        const r = await sql`SELECT * FROM quotes WHERE status = ${status} ORDER BY created_at DESC`;
        quotes = r.rows;
      } else {
        const r = await sql`SELECT * FROM quotes ORDER BY created_at DESC`;
        quotes = r.rows;
      }
      const [all, _new, contacted, closed] = await Promise.all([
        sql`SELECT COUNT(*)::int AS c FROM quotes`,
        sql`SELECT COUNT(*)::int AS c FROM quotes WHERE status = 'new'`,
        sql`SELECT COUNT(*)::int AS c FROM quotes WHERE status = 'contacted'`,
        sql`SELECT COUNT(*)::int AS c FROM quotes WHERE status = 'closed'`
      ]);
      return res.json({
        quotes,
        counts: {
          all: all.rows[0].c,
          new: _new.rows[0].c,
          contacted: contacted.rows[0].c,
          closed: closed.rows[0].c
        }
      });
    }

    if (req.method === 'PATCH') {
      if (!idParam) return res.status(400).json({ error: 'Missing id' });
      const { status } = req.body;
      if (!['new', 'contacted', 'closed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      await sql`UPDATE quotes SET status = ${status} WHERE id = ${parseInt(idParam)}`;
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      if (!idParam) return res.status(400).json({ error: 'Missing id' });
      await sql`DELETE FROM quotes WHERE id = ${parseInt(idParam)}`;
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Quotes endpoint error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
