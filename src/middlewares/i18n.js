// middleware/i18n.js
const i18n = require('../locales/i18n');

function i18nMiddleware(req, res, next)
{
  const lang = req.cookies?.lang || req.cookies?.locale || i18n.defaultLocale;
  i18n.defaultLocale = lang;
  // Anexa req.translate resolvendo o idioma do cookie
  req.translate = (key, params) => i18n.t(key, params, lang);

  next();
}

module.exports = i18nMiddleware;