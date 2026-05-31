const { clearAuthCookie } = require('../_lib');

module.exports = async (req, res) => {
  clearAuthCookie(res);
  res.redirect(302, '/admin/login');
};
