require('dotenv').config();

const RAW_BASE_URL = (process.env.ASAAS_API_URL || 'https://api.asaas.com/v3').trim();
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

function getAsaasConfigStatus() {
  const apiKey = (process.env.ASAAS_API_KEY || '').trim();
  const webhookToken = (process.env.ASAAS_WEBHOOK_TOKEN || '').trim();
  const isSandbox = BASE_URL.toLowerCase().includes('sandbox');

  return {
    configured: apiKey.length > 0,
    webhookTokenConfigured: webhookToken.length > 0,
    baseUrl: BASE_URL,
    environment: isSandbox ? 'SANDBOX' : 'PRODUCTION',
    maskedKey: apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : 'Não definida',
  };
}

async function asaas(method, endpointPath, { body, query } = {}) {
  const cleanPath = String(endpointPath || '').replace(/^\/+/, '');
  const url = new URL(`${BASE_URL}/${cleanPath}`);

  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, v);
      }
    }
  }

  const apiKey = (process.env.ASAAS_API_KEY || '').trim();
  if (!apiKey) {
    const err = new Error('ASAAS_API_KEY não está configurada no arquivo .env do servidor.');
    err.status = 503;
    err.details = { missingEnv: 'ASAAS_API_KEY', baseUrl: BASE_URL };
    throw err;
  }

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'tfl-admin-asaas',
      access_token: apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.errors?.[0]?.description || `Erro Asaas HTTP ${res.status}`);
    err.status = res.status;
    err.details = data;
    throw err;
  }
  return data;
}

module.exports = { asaas, getAsaasConfigStatus, BASE_URL };