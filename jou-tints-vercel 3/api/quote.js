const { sql, ensureSchema, sendNotificationEmail } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await ensureSchema();

    const { name, phone, email, vehicle, vehicleType, package: pkg, film, darkness, message } = req.body;

    if (!name || (!phone && !email)) {
      return res.status(400).json({ error: 'Name and either phone or email are required' });
    }

    const result = await sql`
      INSERT INTO quotes (name, phone, email, vehicle, vehicle_type, package, film, darkness, message)
      VALUES (${name}, ${phone || null}, ${email || null}, ${vehicle || null}, ${vehicleType || null},
              ${pkg || null}, ${film || null}, ${darkness || null}, ${message || null})
      RETURNING id;
    `;

    sendNotificationEmail({ name, phone, email, vehicle, vehicleType, package: pkg, film, darkness, message })
      .catch(err => console.error('Notification error:', err.message));

    res.json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Quote submission error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
