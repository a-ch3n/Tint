// GET /api/admin/export — download all quotes as CSV
const { sql, ensureSchema, checkAuth } = require('../_lib');

module.exports = async (req, res) => {
  if (!checkAuth(req)) {
    return res.status(401).send('Unauthorized');
  }

  try {
    await ensureSchema();
    const r = await sql`SELECT * FROM quotes ORDER BY created_at DESC`;
    const header = ['id','name','phone','email','vehicle','package','film','darkness','message','status','created_at'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [header.join(',')];
    r.rows.forEach(q => rows.push(header.map(h => esc(q[h])).join(',')));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="joutints-quotes-${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(rows.join('\n'));
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).send('Server error');
  }
};
