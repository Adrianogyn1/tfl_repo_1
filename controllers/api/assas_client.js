require('dotenv').config();


const BASE_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3/';
if (!BASE_URL) throw new Error(`ASAAS_ENV inválido:`);
if (!(process.env.ASAAS_API_KEY || false)) throw new Error('ASAAS_API_KEY não definida');

async function asaas(method, path, { body, query } = {}) {
  const url = new URL(BASE_URL + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'prefab-admin',
      access_token: process.env.ASAAS_API_KEY || '',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.errors?.[0]?.description || `HTTP ${res.status}`);
    err.status = res.status;
    err.details = data;
    throw err;
  }
  return data;
}

module.exports = { asaas };