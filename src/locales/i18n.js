const fs = require('fs');
const path = require('path');
const { AsyncLocalStorage } = require('async_hooks');
const asyncLocalStorage = new AsyncLocalStorage();

class I18n {
  constructor({ dir = __dirname, defaultLocale = 'pt-BR', fallbackLocale = 'pt-BR' } = {}) {
    this.defaultLocale = defaultLocale;
    this.fallbackLocale = fallbackLocale;
    this.locales = {};

    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.json')) continue;
      const locale = path.basename(file, '.json');
      try {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        this.locales[locale] = content.trim() ? JSON.parse(content) : {};
      } catch (err) {
        console.error(`Erro ao ler o arquivo de tradução ${file}:`, err.message);
        this.locales[locale] = {};
      }
    }
  }

  t = (key, params = {}) => {
    // Pega o idioma da requisição atual ou usa o padrão
    const locale = asyncLocalStorage.getStore() || this.defaultLocale;

    const resolve = (dict, path) =>
      path.split('.').reduce((obj, k) => (obj && typeof obj === 'object' ? obj[k] : undefined), dict);

    const template =
      resolve(this.locales[locale] || {}, key) ??
      resolve(this.locales[this.fallbackLocale] || {}, key) ??
      key;

    return String(template).replace(/\{\{(\w+)\}\}/g, (_, name) =>
      params[name] !== undefined ? String(params[name]) : `{{${name}}}`
    );
  }

  // Middleware para salvar o cookie no contexto da requisição
  middleware = (req, res, next) => {
    const lang = req.cookies?.lang || req.cookies?.locale || this.defaultLocale;
    asyncLocalStorage.run(lang, () => next());
  }
}

module.exports = new I18n();