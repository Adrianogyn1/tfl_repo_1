const express = require('express');
const crypto = require('crypto');
const { asaas } = require('./assas_client');
const { auth } = require('../admin/index');
const repo = require('../../repository');

const router = express.Router();
router.use(express.json({ limit: '100kb' }));

// ---------- Constantes ----------
const PAYMENT_PAID = ['RECEIVED', 'CONFIRMED'];   // cobrança paga (Asaas)
const TRANSFER_DONE = ['DONE'];                   // transferência concluída (Asaas)
const TIPOS_VALIDOS = ['Buy', 'Withdraw', 'Deposit', 'None'];
const PAYMENT_UPDATABLE = ['value', 'dueDate', 'description', 'externalReference'];

// ---------- Helpers ----------
const httpError = (status, message, details) => Object.assign(new Error(message), { status, details });

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
const enc = v => encodeURIComponent(v);
const isUniqueError = e => e?.name === 'SequelizeUniqueConstraintError';

const tokenValido = req => {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN || '';
  const received = req.get('asaas-access-token') || '';
  return expected.length > 0 &&
    received.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
};

// Mapeia linha do banco para o formato da resposta
const toPayment = row => {
  const p = row.get({ plain: true });
  return {
    id: p.id,
    uid: p.uid,
    type: p.type,
    provedor: p.provedor,
    value: Number(p.value),
    status: p.status,
    paymentId: p.payment_id,
    referenceId: p.reference_id,
    customerId: p.customer_id,
    description: p.description,
    userId: p.user_id,
    avatarId: p.avatar_id,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
};

// Busca a compra local pelo id da cobrança na API
const findCompra = paymentId => repo.PaymentBank.findOne({
  where: { provedor: 'Asaas', type: 'Buy', payment_id: paymentId },
});

// Busca o saque local pelo id da transferência na API
const findSaque = transferId => repo.PaymentBank.findOne({
  where: { provedor: 'Asaas', type: 'Withdraw', payment_id: transferId },
});

// ---------- Webhook de autorização de saque ----------
// ---------- Autorização de saque (Asaas) ----------
// Responde { status: 'APPROVED' | 'REFUSED' } em até 10s
router.post('/withdraw', async (req, res) => {
  if (!tokenValido(req)) return res.status(401).json({ status: 'REFUSED' });

  try {
    const transfer = req.body?.transfer;
    const ref = transfer?.externalReference;

    const saque = ref
      ? await repo.PaymentBank.findOne({ where: { type: 'Withdraw', reference_id: ref } })
      : null;

    const estadoFinal = ['FAILED', 'CANCELLED', 'DONE'].includes(saque?.status);
    const aprovado = Boolean(saque) && !estadoFinal && Number(saque.value) === Number(transfer.value);

    if (!aprovado) console.warn('[asaas withdraw] recusado:', ref, transfer?.value);
    return res.status(200).json({ status: aprovado ? 'APPROVED' : 'REFUSED' });
  } catch (e) {
    console.error('[asaas withdraw] erro:', e.message);
    return res.status(200).json({ status: 'REFUSED' }); // na dúvida, recusa
  }
});

// ---------- Webhook ----------
router.post('/webhook', async (req, res) => {
  if (!tokenValido(req)) return res.status(401).json({ ok: false });

  // Responde antes de processar; o Asaas reenvia se não receber 2xx
  res.status(200).json({ ok: true });

  try {
    const { id: eventId, event, payment, transfer } = req.body || {};
    if (!event) return;

    const eventKey = eventId || `${event}:${payment?.id || transfer?.id || ''}`;
    if (await repo.PaymentWebHook.findOne({ where: { event_key: eventKey } })) return; // já processado

    let compra = null;
    let saque = null;
    let remoteId = null;

    if (event.startsWith('PAYMENT_') && payment?.id) {
      remoteId = payment.id;

      if (event === 'PAYMENT_DELETED') {
        // Cobrança excluída: a API não retorna mais o recurso, usa o corpo do evento
        compra = await findCompra(payment.id);
        if (compra) await compra.update({ status: 'DELETED' });
      } else {
        // Não confie no corpo: busca o estado atual na API
        const fresh = await asaas('GET', `/payments/${enc(payment.id)}`);
        compra = await findCompra(fresh.id);
        if (compra) {
          await compra.update({ status: fresh.status });
          if (PAYMENT_PAID.includes(fresh.status)) console.log('[asaas] compra paga:', fresh.id);
        }
      }
    } else if (event.startsWith('TRANSFER_') && transfer?.id) {
      remoteId = transfer.id;

      // Status confirmado pela API, não pelo corpo
      const fresh = await asaas('GET', `/transfers/${enc(transfer.id)}`);
      if (fresh.externalReference) {
        saque = await repo.PaymentBank.findOne({
          where: { type: 'Withdraw', reference_id: fresh.externalReference },
        });
      }
      if (!saque) saque = await findSaque(fresh.id);

      if (saque) {
        await saque.update({ status: fresh.status, payment_id: fresh.id });
        if (TRANSFER_DONE.includes(fresh.status)) console.log('[asaas] saque concluído:', fresh.id);
      }
    }

    try {
      await repo.PaymentWebHook.create({
        event_key: eventKey,
        event,
        payment_id: remoteId,
        payment_bank_id: (compra || saque)?.id ?? null,
      });
    } catch (e) {
      if (!isUniqueError(e)) throw e; // corrida: outro processo gravou o mesmo evento
    }
  } catch (e) {
    console.error('[asaas webhook] falha ao processar:', e.message);
  }
});

// ---------- QR Code público ----------
router.get('/qrcode', wrap(async (req, res) => {
  const message = req.query.message || 'Obrigado pelo apoio';
  const data = await GerarQrCode(message);
  res.json(data);
}));

// ---------- Demais rotas exigem autenticação ----------
router.use(auth);

// Saldo
router.get('/balance', wrap(async (req, res) => {
  const data = await asaas('GET', '/finance/balance');
  res.json({ ok: true, balance: data.balance });
}));

// Chaves Pix cadastradas
router.get('/pix/addressKeys', wrap(async (req, res) => {
  const data = await asaas('GET', '/pix/addressKeys', { query: { status: 'ACTIVE' } });
  res.json({ ok: true, data: data.data });
}));

// Pix a receber: cobranças pendentes
router.get('/pix/receivable', wrap(async (req, res) => {
  const data = await asaas('GET', '/payments', {
    query: { billingType: 'PIX', status: 'PENDING', ...paging(req.query) },
  });
  res.json({ ok: true, data: data.data, totalCount: data.totalCount });
}));

// Pix recebido: cobranças pagas
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

// Gerar Pix dinâmico (cobrança com QR code) — grava como compra
router.post('/pix/dynamic', wrap(async (req, res) => {
  const { customer, value, dueDate, description, externalReference } = req.body || {};
  if (!customer) throw httpError(400, 'customer é obrigatório');
  if (!isPositiveMoney(value)) throw httpError(400, 'value deve ser maior que zero');
  if (!isDate(dueDate)) throw httpError(400, 'dueDate deve estar no formato YYYY-MM-DD');

  const payment = await asaas('POST', '/payments', {
    body: { customer, billingType: 'PIX', value: Number(value), dueDate, description, externalReference },
  });

  const compra = await repo.PaymentBank.create({
    user_id: req.user?.id ?? null,
    description,
    payment_id: payment.id,
    reference_id: externalReference ?? null,
    customer_id: customer,
    status: payment.status,
    value: Number(value),
    provedor: 'Asaas',
    type: 'Buy',
  });

  const qrCode = await asaas('GET', `/payments/${enc(payment.id)}/pixQrCode`);
  res.json({ ok: true, payment, purchase: toPayment(compra), qrCode });
}));

// Editar cobrança (API + banco local)
router.put('/pix/payments/:id', wrap(async (req, res) => {
  const body = {};
  for (const k of PAYMENT_UPDATABLE) {
    if (req.body?.[k] !== undefined) body[k] = req.body[k];
  }
  if (body.value !== undefined) {
    if (!isPositiveMoney(body.value)) throw httpError(400, 'value deve ser maior que zero');
    body.value = Number(body.value);
  }
  if (body.dueDate !== undefined && !isDate(body.dueDate)) throw httpError(400, 'dueDate deve ser YYYY-MM-DD');
  if (!Object.keys(body).length) throw httpError(400, 'Nenhum campo válido para atualizar');

  const payment = await asaas('PUT', `/payments/${enc(req.params.id)}`, { body });

  const compra = await findCompra(payment.id);
  if (compra) {
    const local = { status: payment.status, description: payment.description ?? compra.description };
    if (body.value !== undefined) local.value = body.value;
    if (body.externalReference !== undefined) local.reference_id = body.externalReference;
    await compra.update(local);
  }

  res.json({ ok: true, payment, purchase: compra ? toPayment(compra) : null });
}));

// Excluir cobrança (API + marca como excluída no banco)
router.delete('/pix/payments/:id', wrap(async (req, res) => {
  const data = await asaas('DELETE', `/payments/${enc(req.params.id)}`);

  const compra = await findCompra(req.params.id);
  if (compra) await compra.update({ status: 'DELETED' });

  res.json({ ok: true, data, purchase: compra ? toPayment(compra) : null });
}));

// QR Code de uma cobrança existente
router.get('/pix/payments/:id/qrcode', wrap(async (req, res) => {
  const qr = await asaas('GET', `/payments/${enc(req.params.id)}/pixQrCode`);
  res.json({
    ok: true,
    qrCode: { payload: qr.payload, encodedImage: qr.encodedImage },
  });
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

// Enviar Pix (saque) com reserva idempotente no banco
router.post('/pix/send', wrap(async (req, res) => {
  const { value, pixAddressKey, pixAddressKeyType, description, externalReference } = req.body || {};

  if (!isPositiveMoney(value)) throw httpError(400, 'value deve ser maior que zero');
  if (!pixAddressKey || !pixAddressKeyType) throw httpError(400, 'pixAddressKey e pixAddressKeyType são obrigatórios');
  if (!externalReference || typeof externalReference !== 'string') {
    throw httpError(400, 'externalReference é obrigatório e deve ser único por operação');
  }

  // Reserva: a unique (type, reference_id) barra duplicidade atomicamente
  let saque;
  try {
    saque = await repo.PaymentBank.create({
      user_id: req.user?.id ?? null,
      description,
      reference_id: externalReference,
      value: Number(value),
      status: 'PENDING',
      provedor: 'Asaas',
      type: 'Withdraw',
    });
  } catch (e) {
    if (isUniqueError(e)) throw httpError(409, `Operação ${externalReference} já foi enviada ou está em andamento`);
    throw e;
  }

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
    await saque.update({ status: data.status || 'REQUESTED', payment_id: data.id });
    res.json({ ok: true, data, withdraw: toPayment(saque) });
  } catch (e) {
    // 4xx: a API recusou, remove a reserva para permitir nova tentativa
    // 5xx/rede: resultado desconhecido, mantém PENDING para conciliação
    if (e.status >= 400 && e.status < 500) await saque.destroy();
    throw e;
  }
}));

// Transferências aguardando aprovação
router.get('/pix/transfers/pending', wrap(async (req, res) => {
  const data = await asaas('GET', '/transfers', {
    query: { status: 'PENDING', ...paging(req.query) },
  });
  res.json({ ok: true, data: data.data, totalCount: data.totalCount });
}));

// Cancelar transferência (API + banco local)
router.post('/pix/transfers/:id/cancel', wrap(async (req, res) => {
  const data = await asaas('DELETE', `/transfers/${enc(req.params.id)}`);

  const saque = await findSaque(req.params.id);
  if (saque) await saque.update({ status: 'CANCELLED' });

  res.json({ ok: true, data, withdraw: saque ? toPayment(saque) : null });
}));

// Consulta de status do saque pelo externalReference
router.get('/pix/send/:externalReference', wrap(async (req, res) => {
  const row = await repo.PaymentBank.findOne({
    where: { type: 'Withdraw', reference_id: req.params.externalReference },
  });
  if (!row) throw httpError(404, 'Operação não encontrada');
  res.json({ ok: true, externalReference: req.params.externalReference, status: row.status });
}));

// Listar clientes
router.get('/customers', wrap(async (req, res) => {
  const data = await asaas('GET', '/customers', {
    query: {
      name: req.query.name, cpfCnpj: req.query.cpfCnpj, email: req.query.email,
      offset: req.query.offset, limit: req.query.limit,
    },
  });
  res.json({ ok: true, data: data.data, totalCount: data.totalCount });
}));

// Busca para autocomplete (deve vir antes de /customers/:id)
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
  const data = await asaas('GET', `/customers/${enc(req.params.id)}`);
  res.json({ ok: true, data });
}));

// Cadastrar cliente
router.post('/customers', wrap(async (req, res) => {
  const { name, cpfCnpj, email, mobilePhone } = req.body || {};
  if (!name || !cpfCnpj) throw httpError(400, 'name e cpfCnpj são obrigatórios');
  const data = await asaas('POST', '/customers', {
    body: { name, cpfCnpj: cpfCnpj.replace(/\D/g, ''), email, mobilePhone },
  });
  res.json({ ok: true, data });
}));

// Atualizar cliente
router.put('/customers/:id', wrap(async (req, res) => {
  const { name, cpfCnpj, email, mobilePhone } = req.body || {};
  if (!name || !cpfCnpj) throw httpError(400, 'name e cpfCnpj são obrigatórios');
  const data = await asaas('PUT', `/customers/${enc(req.params.id)}`, {
    body: { name, cpfCnpj: cpfCnpj.replace(/\D/g, ''), email, mobilePhone },
  });
  res.json({ ok: true, data });
}));

// ---------- Banco local ----------
// Compras e saques gravados em bank_payments
router.get('/db/payments', wrap(async (req, res) => {
  const where = {};
  if (TIPOS_VALIDOS.includes(req.query.type)) where.type = req.query.type;
  if (req.query.status) where.status = String(req.query.status).slice(0, 30);

  const { offset, limit } = paging(req.query);
  const { rows, count } = await repo.PaymentBank.findAndCountAll({
    where,
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    offset,
    limit,
  });

  res.json({ ok: true, data: rows.map(toPayment), totalCount: count });
}));

// Eventos de webhook gravados em bank_webhook
router.get('/db/webhooks', wrap(async (req, res) => {
  const { offset, limit } = paging(req.query);
  const { rows, count } = await repo.PaymentWebHook.findAndCountAll({
    order: [['id', 'DESC']],
    offset,
    limit,
  });

  res.json({
    ok: true,
    totalCount: count,
    data: rows.map(r => {
      const w = r.get({ plain: true });
      return {
        id: w.id,
        event: w.event,
        eventKey: w.event_key,
        paymentId: w.payment_id,
        paymentBankId: w.payment_bank_id,
        receiveAt: w.receiveAt,
      };
    }),
  });
}));

async function GerarQrCode(description = 'donate') {
  const expirationDate = new Date().toISOString().slice(0, 10);

  const data = await asaas('POST', '/pix/qrCodes/static', {
    body: {
      addressKeyId: 1,
      value: undefined,            // QR sem valor fixo
      description,
      expirationDate,
      format: 'ALL',
      allowsMultiplePayments: true,
    },
  });

  return {
    payload: data.payload,
    encodedImage: `data:image/png;base64,${data.encodedImage}`,
  };
}

module.exports = { router, GerarQrCode };