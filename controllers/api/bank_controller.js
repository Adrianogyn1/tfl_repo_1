const express = require('express');
const crypto = require('crypto');
const { asaas } = require('./assas_client'); // confirme o nome exato do arquivo no disco
const { auth } = require('../admin/index'); // ajuste o caminho se necessário
const { route } = require('../../router');

const router = express.Router();
router.use(express.json({ limit: '100kb' }));

// ---------- Helpers ----------
const httpError = (status, message, details) => Object.assign(new Error(message), { status, details });

// Envolve handlers async: erro vira JSON, sem enviar resposta duas vezes
const wrap = fn => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (e) {
    if (res.headersSent) return next(e);
    const status = e.status >= 400 && e.status < 600 ? e.status : 500;
    res.status(status).json({
      ok: false,
      message: status >= 500 ? 'Erro interno ao processar a requisição' : e.message,
      details: status < 500 ? e.details : undefined,
    });
  }
};

const isPositiveMoney = v => {
  const n = Number(v);
  return typeof v !== 'boolean' && v !== '' && v !== null && Number.isFinite(n) && n > 0;
};
const isDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const paging = q => ({
  offset: Math.max(parseInt(q.offset, 10) || 0, 0),
  limit: Math.min(Math.max(parseInt(q.limit, 10) || 20, 1), 100),
});

// Estado de idempotência. Em memória: reinicia com o processo.
// Em produção, trocar por tabela no banco (chave única em externalReference e eventKey).
const transfers = new Map();   // externalReference -> 'PENDING' | status final
const seenEvents = new Map();  // eventKey -> timestamp


// ---------- Webhook (sem auth de sessão; valida token próprio) ----------
//autorização de saque
router.post('/withdraw', async (req, res) => {
    
});


router.post('/webhook', async (req, res) => {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN || '';
  const received = req.get('asaas-access-token') || '';
  const ok = expected.length > 0 &&
    received.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  if (!ok) return res.status(401).json({ ok: false });

  // Responde antes de processar; o Asaas reenvia se não receber 2xx
  res.status(200).json({ ok: true });

  try {
    const { id: eventId, event, payment, transfer } = req.body || {};
    const eventKey = eventId || `${event}:${payment?.id || transfer?.id || ''}`;
    if (!event || seenEvents.has(eventKey)) return; // idempotência
    seenEvents.set(eventKey, Date.now());

    if (event.startsWith('PAYMENT_') && payment?.id) {
      // Não confie no corpo: busca o estado atual na API
      const fresh = await asaas('GET', `/payments/${encodeURIComponent(payment.id)}`);
      console.log('[asaas webhook]', event, fresh.id, fresh.status);
      // TODO: atualizar pedido no banco com fresh.status
    } else if (event.startsWith('TRANSFER_') && transfer?.id) {
      console.log('[asaas webhook]', event, transfer.id);
      // TODO: atualizar transferência pelo externalReference, com status confirmado pela API
    }
  } catch (e) {
    console.error('[asaas webhook] falha ao processar:', e.message);
  }
});
router.get('/qrcode', async (req, res) => {
    const {message} = req.query || "Obrigado pelo apoio";
    const data = await GerarQrCode(message);
   return res.json(data);
});


// ---------- Demais rotas exigem autenticação ----------
router.use(auth);

// Saldo
router.get('/balance', wrap(async (req, res) => {
  const data = await asaas('GET', '/finance/balance');
  res.json({ ok: true, balance: data.balance });
}));

// Chaves Pix cadastradas (necessárias para Pix estático)
router.get('/pix/addressKeys', wrap(async (req, res) => {
  const data = await asaas('GET', '/pix/addressKeys', { query: { status: 'ACTIVE' } });
  res.json({ ok: true, data: data.data });
}));

// Pix a receber: cobranças Pix pendentes
router.get('/pix/receivable', wrap(async (req, res) => {
  const data = await asaas('GET', '/payments', {
    query: { billingType: 'PIX', status: 'PENDING', ...paging(req.query) },
  });
  res.json({ ok: true, data: data.data, totalCount: data.totalCount });
}));

// Pix recebido: cobranças Pix pagas
router.get('/pix/received', wrap(async (req, res) => {
  const data = await asaas('GET', '/payments', {
    query: { billingType: 'PIX', status: 'RECEIVED', ...paging(req.query) },
  });
  res.json({ ok: true, data: data.data, totalCount: data.totalCount });
}));

// Extrato Pix: CREDIT = recebido, DEBIT = enviado
router.get('/pix/transactions', wrap(async (req, res) => {
  const type = req.query.type === 'DEBIT' ? 'DEBIT' : 'CREDIT';
  const { startDate, finishDate } = req.query;
  if (startDate && !isDate(startDate)) throw httpError(400, 'startDate deve ser YYYY-MM-DD');
  if (finishDate && !isDate(finishDate)) throw httpError(400, 'finishDate deve ser YYYY-MM-DD');

  const data = await asaas('GET', '/pix/transactions', {
    query: { type, ...paging(req.query), startDate, finishDate },
  });
  res.json({ ok: true, data: data.data, totalCount: data.totalCount });
}));

// Gerar Pix dinâmico (cobrança com QR code)
router.post('/pix/dynamic', wrap(async (req, res) => {
  const { customer, value, dueDate, description, externalReference } = req.body || {};
  if (!customer) throw httpError(400, 'customer é obrigatório');
  if (!isPositiveMoney(value)) throw httpError(400, 'value deve ser maior que zero');
  if (!isDate(dueDate)) throw httpError(400, 'dueDate deve estar no formato YYYY-MM-DD');

  const payment = await asaas('POST', '/payments', {
    body: { customer, billingType: 'PIX', value: Number(value), dueDate, description, externalReference },
  });
  const qrCode = await asaas('GET', `/payments/${encodeURIComponent(payment.id)}/pixQrCode`);
  res.json({ ok: true, payment, qrCode });
}));

// Gerar Pix estático (QR reutilizável)
router.post('/pix/static', wrap(async (req, res) => {
  const { addressKeyId, value, description, expirationDate, allowsMultiplePayments } = req.body || {};
  if (!addressKeyId) throw httpError(400, 'addressKeyId é obrigatório');
  if (value !== undefined && value !== null && !isPositiveMoney(value)) {
    throw httpError(400, 'value, se informado, deve ser maior que zero');
  }
  if (expirationDate && !isDate(expirationDate)) throw httpError(400, 'expirationDate deve ser YYYY-MM-DD');

  const data = await asaas('POST', '/pix/qrCodes/static', {
    body: {
      addressKeyId,
      value: value == null ? undefined : Number(value),
      description,
      expirationDate,
      format: 'ALL',
      allowsMultiplePayments: allowsMultiplePayments ?? true,
    },
  });
  res.json({ ok: true, data });
}));

// Enviar Pix (transferência) com proteção contra duplicidade
router.post('/pix/send', wrap(async (req, res) => {
  const { value, pixAddressKey, pixAddressKeyType, description, externalReference } = req.body || {};

  if (!isPositiveMoney(value)) throw httpError(400, 'value deve ser maior que zero');
  if (!pixAddressKey || !pixAddressKeyType) throw httpError(400, 'pixAddressKey e pixAddressKeyType são obrigatórios');
  if (!externalReference || typeof externalReference !== 'string') {
    throw httpError(400, 'externalReference é obrigatório e deve ser único por operação');
  }
  if (transfers.has(externalReference)) {
    throw httpError(409, `Operação ${externalReference} já foi enviada ou está em andamento`);
  }

  transfers.set(externalReference, 'PENDING'); // reserva antes da chamada
  try {
    const data = await asaas('POST', '/transfers', {
      body: {
        operationType: 'PIX',
        value: Number(value),
        pixAddressKey,
        pixAddressKeyType,
        description,
        externalReference,
      },
    });
    transfers.set(externalReference, data.status || 'REQUESTED');
    res.json({ ok: true, data });
  } catch (e) {
    // Erro 4xx: a API recusou, então libera a reserva para nova tentativa.
    // Erro 5xx ou de rede: resultado desconhecido, mantém PENDING para conciliar.
    if (e.status >= 400 && e.status < 500) transfers.delete(externalReference);
    throw e;
  }
}));

// Consulta de status da transferência pelo externalReference local
router.get('/pix/send/:externalReference', wrap(async (req, res) => {
  const status = transfers.get(req.params.externalReference);
  if (!status) throw httpError(404, 'Operação não encontrada');
  res.json({ ok: true, externalReference: req.params.externalReference, status });
}));

// Listar clientes (paginado, com filtros opcionais)
router.get('/customers', wrap(async (req, res) => {
  const data = await asaas('GET', '/customers', {
    query: { name: req.query.name, cpfCnpj: req.query.cpfCnpj, email: req.query.email,
             offset: req.query.offset, limit: req.query.limit },
  });
  res.json({ ok: true, data: data.data, totalCount: data.totalCount });
}));

// Busca para autocomplete: CPF/CNPJ se a entrada for numérica, senão nome
router.get('/customers/search', wrap(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 100);
  if (q.length < 2) return res.json({ ok: true, data: [] });
  const digits = q.replace(/\D/g, '');
  const isDoc = /^[\d.\-\/]+$/.test(q) && digits.length >= 3;
  const filter = isDoc ? { cpfCnpj: digits } : { name: q };
  const data = await asaas('GET', '/customers', { query: { ...filter, limit: 10 } });
  res.json({ ok: true, data: data.data });
}));

// Detalhe de um cliente
router.get('/customers/:id', wrap(async (req, res) => {
  const data = await asaas('GET', `/customers/${encodeURIComponent(req.params.id)}`);
  res.json({ ok: true, data });
}));

// Cadastrar cliente
router.post('/customers', wrap(async (req, res) => {
  const { name, cpfCnpj, email, mobilePhone } = req.body || {};
  if (!name || !cpfCnpj) return res.status(400).json({ ok: false, message: 'name e cpfCnpj são obrigatórios' });
  const data = await asaas('POST', '/customers', {
    body: { name, cpfCnpj: cpfCnpj.replace(/\D/g, ''), email, mobilePhone },
  });
  res.json({ ok: true, data });
}));


async function  GerarQrCode(_description)
{
    const  expiration_date = new Date();
    const addressKeyId = 1;
    const value = 0;
    const description = _description||"donate";
    const expirationDate = expiration_date.toISOString().slice(0, 10);
    const allowsMultiplePayments = true;

    const data = await asaas('POST', '/pix/qrCodes/static', {
    body: {
      addressKeyId,
      value: value == null ? undefined : Number(value),
      description,
      expirationDate,
      format: 'ALL',
      allowsMultiplePayments: allowsMultiplePayments ?? true,
    },
  });
  
    return {
        payload: data.payload,
        encodedImage: `data:image/png;base64,${data.encodedImage}`
    };
}


module.exports = { router , GerarQrCode};