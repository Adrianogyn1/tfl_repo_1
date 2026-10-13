const fs = require('fs');
const path = require('path');
const { AsyncLocalStorage } = require('async_hooks');
const asyncLocalStorage = new AsyncLocalStorage();

class I18n {
  constructor({ dir = __dirname, defaultLocale = 'pt-BR', fallbackLocale = 'pt-BR' } = {}) {
    this.dir = dir;
    this.defaultLocale = defaultLocale;
    this.fallbackLocale = fallbackLocale;
    this.locales = {};
    this.loadLocales();
  }

  loadLocales() {
    for (const file of fs.readdirSync(this.dir)) {
      if (!file.endsWith('.json')) continue;
      const locale = path.basename(file, '.json');
      try {
        const content = fs.readFileSync(path.join(this.dir, file), 'utf8');
        this.locales[locale] = content.trim() ? JSON.parse(content) : {};
      } catch (err) {
        console.error(`Erro ao ler o arquivo de tradução ${file}:`, err.message);
        this.locales[locale] = {};
      }
    }
  }

  normalizeLocale(lang) {
    if (!lang) return this.defaultLocale;
    const clean = String(lang).trim();
    if (this.locales[clean]) return clean;
    const lower = clean.toLowerCase();
    if (lower.startsWith('pt')) return 'pt-BR';
    if (lower.startsWith('en')) return 'en-US';
    if (lower.startsWith('es')) return 'es-ES';
    return this.defaultLocale;
  }

  t = (key, params = {}, fallbackOrLocale = null, explicitLocale = null) => {
    let locale = explicitLocale;
    let fallback = null;

    if (fallbackOrLocale && this.locales[fallbackOrLocale]) {
      locale = fallbackOrLocale;
    } else if (typeof fallbackOrLocale === 'string' && fallbackOrLocale !== key) {
      fallback = fallbackOrLocale;
    }

    const activeLocale = this.normalizeLocale(locale || asyncLocalStorage.getStore() || this.defaultLocale);

    const resolve = (dict, keyPath) =>
      String(keyPath)
        .split('.')
        .reduce((obj, k) => (obj && typeof obj === 'object' ? obj[k] : undefined), dict);

    const template =
      resolve(this.locales[activeLocale] || {}, key) ??
      resolve(this.locales[this.fallbackLocale] || {}, key) ??
      fallback ??
      key;

    const safeParams = params && typeof params === 'object' ? params : {};
    return String(template).replace(/\{\{(\w+)\}\}/g, (_, name) =>
      safeParams[name] !== undefined ? String(safeParams[name]) : `{{${name}}}`
    );
  };

  middleware = (req, res, next) => {
    const rawLang = req.query?.lang || req.cookies?.lang || req.cookies?.locale || req.headers?.['accept-language']?.split(',')[0] || this.defaultLocale;
    const lang = this.normalizeLocale(rawLang);
    req.lang = lang;
    req.translate = (key, params = {}, fallback = null) => this.t(key, params, fallback, lang);
    res.locals.t = req.translate;
    res.locals.currentLang = lang;
    asyncLocalStorage.run(lang, () => next());
  };
}

module.exports = new I18n();