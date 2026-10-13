// middleware/i18n.js
const i18n = require('../locales/i18n');

function i18nMiddleware(req, res, next) {
  if (req.query?.lang) {
    const normalized = i18n.normalizeLocale(req.query.lang);
    res.cookie('lang', normalized, { maxAge: 365 * 24 * 60 * 60 * 1000, path: '/' });
  }
  return i18n.middleware(req, res, next);
}

module.exports = i18nMiddleware;