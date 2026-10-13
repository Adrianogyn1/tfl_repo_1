const express = require('express');
const crypto = require('crypto');
const { asaas, getAsaasConfigStatus } = require('./assas_client');
const { auth } = require('../../../controllers/admin/index');
const repo = require('../../../repositories/repository');
const { reviewPaymentTransaction, getEconomyRules } = require('../../../services/coinMarket.service');

const router = express.Router();
router.use(express.json({ limit: '100kb' }));

// ---------- Constantes ----------
const PAYMENT_PAID = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']; // cobrança paga (Asaas)
const TRANSFER_DONE = ['DONE'];                                     // transferência concluída (Asaas)
const TIPOS_VALIDOS = ['Buy', 'Withdraw', 'Deposit', 'None'];
const PAYMENT_UPDATABLE = ['value', 'dueDate', 'description', 'externalReference', 'billingType'];

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
      message: e.message || 'Erro interno ao processar a requisição',
      details: e.details || undefined,
    });
  }
};

const isPositiveMoney = v => {
  const n = Number(v);
  return typeof v !== 'boolean' && v !== '' && v !== null && Number.isFinite(n) && n > 0;
};
const isDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const paging = q => ({
  offset: Math.max(parseInt(q?.offset, 10) || 0, 0),
  limit: Math.min(Math.max(parseInt(q?.limit, 10) || 20, 1), 100),
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
  const p = typeof row.get === 'function' ? row.get({ plain: true }) : row;
  return {
    id: p.id,
    uid: p.uid,
    type: p.type,
    provedor: p.provedor,
    value: Number(p.value || 0),
    cashAmount: Number(p.cash_amount || 0),
    pixKey: p.pix_key || '',
    pixKeyType: p.pix_key_type || '',
    approvalMode: p.approval_mode || 'AUTO',
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

// Credita Cash na carteira de um avatar/usuário a partir de uma compra paga
async function creditWalletFromPurchase(compra, newStatus = 'CONFIRMED') {
  const rules = await getEconomyRules().catch(() => null);
  const USD_RATE = Number(rules?.usdBrlRate || process.env.USD_BRL_RATE || 5.0);
  const cashToAdd = Number(compra.cash_amount) || Number((Number(compra.value) / USD_RATE).toFixed(2));

  const orConditions = [];
  if (compra.avatar_id) {
    orConditions.push({ avatarId: compra.avatar_id }, { ownerId: compra.avatar_id });
  }
  if (compra.user_id) {
    orConditions.push({ userId: compra.user_id });
  }

  let creditedWallet = null;
  if (orConditions.length > 0 && cashToAdd > 0) {
    const wallet = await repo.Currency.findOne({
      where: { [repo.Sequelize.Op.or]: orConditions },
    });
    if (wallet) {
      wallet.cash = Number((Number(wallet.cash) + cashToAdd).toFixed(4));
      await wallet.save();
      creditedWallet = wallet.get({ plain: true });
    }
  }

  await compra.update({ status: newStatus });
  return { cashAdded: cashToAdd, wallet: creditedWallet };
}

// ---------- Webhook de autorização de saque (Asaas) ----------
router.post('/withdraw', async (req, res) => {
  if (!tokenValido(req)) return res.status(401).json({ status: 'REFUSED' });

  try {
    const transfer = req.body?.transfer;
    const ref = transfer?.externalReference;

    const saque = ref
      ? await repo.PaymentBank.findOne({ where: { type: 'Withdraw', reference_id: ref } })
      : null;

    const estadoBloqueado = ['FAILED', 'CANCELLED', 'DONE', 'REJECTED', 'WAITING_APPROVAL'].includes(saque?.status);
    const aprovado = Boolean(saque) && !estadoBloqueado && Number(saque.value) === Number(transfer.value);

    if (!aprovado) console.warn('[asaas withdraw] recusado:', ref, transfer?.value);
    return res.status(200).json({ status: aprovado ? 'APPROVED' : 'REFUSED' });
  } catch (e) {
    console.error('[asaas withdraw] erro:', e.message);
    return res.status(200).json({ status: 'REFUSED' });
  }
});

// ---------- Webhook de Eventos Asaas ----------
router.post('/webhook', async (req, res) => {
  if (!tokenValido(req)) return res.status(401).json({ ok: false });

  res.status(200).json({ ok: true });

  try {
    const { id: eventId, event, payment, transfer } = req.body || {};
    if (!event) return;

    const eventKey = eventId || `${event}:${payment?.id || transfer?.id || ''}`;
    if (await repo.PaymentWebHook.findOne({ where: { event_key: eventKey } })) return;

    let compra = null;
    let saque = null;
    let remoteId = null;

    if (event.startsWith('PAYMENT_') && payment?.id) {
      remoteId = payment.id;

      if (event === 'PAYMENT_DELETED') {
        compra = await findCompra(payment.id);
        if (compra) await compra.update({ status: 'DELETED' });
      } else {
        const fresh = await asaas('GET', `/payments/${enc(payment.id)}`);
        compra = await findCompra(fresh.id);
        if (compra) {
          const wasPending = !['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'APPROVED_ADMIN'].includes(compra.status);
          if (PAYMENT_PAID.includes(fresh.status) && wasPending) {
            try {
              const rules = await getEconomyRules();
              const buyMode = rules?.buyApprovalMode || 'AUTO';
              const maxAutoBrl = Number(rules?.maxAutoBuyBrl ?? 500.0);
              const isAuto = buyMode === 'AUTO' && Number(compra.value) <= maxAutoBrl;

              if (!isAuto) {
                await compra.update({ status: 'WAITING_APPROVAL', approval_mode: 'MANUAL' });
              } else {
                await compra.update({ approval_mode: 'AUTO' });
                await creditWalletFromPurchase(compra, fresh.status);
              }
            } catch (errCredit) {
              console.error('[asaas] Erro ao creditar Cash na carteira:', errCredit);
            }
          } else {
            await compra.update({ status: fresh.status });
          }
        }
      }
    } else if (event.startsWith('TRANSFER_') && transfer?.id) {
      remoteId = transfer.id;

      const fresh = await asaas('GET', `/transfers/${enc(transfer.id)}`);
      if (fresh.externalReference) {
        saque = await repo.PaymentBank.findOne({
          where: { type: 'Withdraw', reference_id: fresh.externalReference },
        });
      }
      if (!saque) saque = await findSaque(fresh.id);

      if (saque) {
        await saque.update({ status: fresh.status, payment_id: fresh.id });
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
      if (!isUniqueError(e)) throw e;
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

// ---------- Demais rotas exigem autenticação Admin ----------
router.use(auth);

// =========================================================================
// 1. DIAGNÓSTICO, STATUS DA INTEGRAÇÃO, SALDO & ESTATÍSTICAS FINANCEIRAS
// =========================================================================
router.get('/status', wrap(async (req, res) => {
  const config = getAsaasConfigStatus();
  let balance = null;
  let statistics = null;
  let accountInfo = null;
  let apiError = null;

  if (config.configured) {
    try {
      const [balRes, statRes, accRes] = await Promise.all([
        asaas('GET', '/finance/balance').catch(e => { apiError = e.message; return null; }),
        asaas('GET', '/finance/payment/statistics').catch(() => null),
        asaas('GET', '/myAccount/commercialInfo').catch(() => null),
      ]);
      if (balRes) balance = balRes.balance;
      if (statRes) statistics = statRes;
      if (accRes) accountInfo = accRes;
    } catch (err) {
      apiError = err.message;
    }
  } else {
    apiError = 'ASAAS_API_KEY não definida no arquivo .env';
  }

  // Resumo do Banco Local TFL
  const Op = repo.Sequelize.Op;
  const [totalLocalPayments, pendingApprovals, totalWebhooks, recentLocal] = await Promise.all([
    repo.PaymentBank.count().catch(() => 0),
    repo.PaymentBank.count({
      where: { status: { [Op.in]: ['WAITING_APPROVAL', 'PENDING', 'APPROVED_AUTO'] } },
    }).catch(() => 0),
    repo.PaymentWebHook ? repo.PaymentWebHook.count().catch(() => 0) : 0,
    repo.PaymentBank.findAll({ order: [['id', 'DESC']], limit: 5 }).catch(() => []),
  ]);

  res.json({
    ok: true,
    config,
    balance,
    statistics,
    accountInfo,
    apiError,
    localSummary: {
      totalLocalPayments,
      pendingApprovals,
      totalWebhooks,
      recentLocal: recentLocal.map(toPayment),
    },
  });
}));

router.get('/balance', wrap(async (req, res) => {
  const config = getAsaasConfigStatus();
  if (!config.configured) {
    return res.json({
      ok: true,
      balance: 0,
      configured: false,
      config,
      warning: 'ASAAS_API_KEY não configurada no .env',
    });
  }
  const [data, stats] = await Promise.all([
    asaas('GET', '/finance/balance'),
    asaas('GET', '/finance/payment/statistics').catch(() => null),
  ]);
  res.json({ ok: true, balance: data.balance, statistics: stats, configured: true, config });
}));

// =========================================================================
// 2. GESTÃO DE CHAVES PIX (LISTAR, CRIAR EVP, EXCLUIR)
// =========================================================================
router.get('/pix/addressKeys', wrap(async (req, res) => {
  const query = { ...paging(req.query) };
  if (req.query.status) query.status = req.query.status;
  const data = await asaas('GET', '/pix/addressKeys', { query });
  res.json({ ok: true, data: data.data || [], totalCount: data.totalCount ?? (data.data || []).length });
}));

router.post('/pix/addressKeys', wrap(async (req, res) => {
  const type = req.body?.type || 'EVP';
  const data = await asaas('POST', '/pix/addressKeys', { body: { type } });
  res.json({ ok: true, data });
}));

router.delete('/pix/addressKeys/:id', wrap(async (req, res) => {
  const data = await asaas('DELETE', `/pix/addressKeys/${enc(req.params.id)}`);
  res.json({ ok: true, data });
}));

// =========================================================================
// 3. COBRANÇAS PIX / BOLETO (LISTAR, CRIAR, EDITAR, EXCLUIR, RESTAURAR, RECEBER EM MÃOS, ESTORNAR)
// =========================================================================
router.get('/payments', wrap(async (req, res) => {
  const query = { ...paging(req.query) };
  if (req.query.billingType) query.billingType = req.query.billingType;
  if (req.query.status) query.status = req.query.status;
  if (req.query.customer) query.customer = req.query.customer;
  if (req.query.externalReference) query.externalReference = req.query.externalReference;

  const data = await asaas('GET', '/payments', { query });
  res.json({ ok: true, data: data.data || [], totalCount: data.totalCount ?? 0 });
}));

router.get('/pix/receivable', wrap(async (req, res) => {
  const status = req.query.status || 'PENDING';
  const billingType = req.query.billingType || 'PIX';
  const query = { ...paging(req.query) };
  if (billingType !== 'ALL') query.billingType = billingType;
  if (status !== 'ALL') query.status = status;

  const data = await asaas('GET', '/payments', { query });
  res.json({ ok: true, data: data.data || [], totalCount: data.totalCount ?? 0 });
}));

router.get('/pix/received', wrap(async (req, res) => {
  const status = req.query.status || 'RECEIVED';
  const billingType = req.query.billingType || 'PIX';
  const query = { ...paging(req.query) };
  if (billingType !== 'ALL') query.billingType = billingType;
  if (status !== 'ALL') query.status = status;

  const data = await asaas('GET', '/payments', { query });
  res.json({ ok: true, data: data.data || [], totalCount: data.totalCount ?? 0 });
}));

// Gerar Pix dinâmico (ou Boleto) — grava no banco local com vínculo opcional ao Avatar TFL
router.post('/pix/dynamic', wrap(async (req, res) => {
  const {
    customer,
    value,
    dueDate,
    description,
    externalReference,
    billingType = 'PIX',
    userId,
    avatarId,
    cashAmount,
  } = req.body || {};

  if (!customer) throw httpError(400, 'customer é obrigatório');
  if (!isPositiveMoney(value)) throw httpError(400, 'value deve ser maior que zero');
  if (!isDate(dueDate)) throw httpError(400, 'dueDate deve estar no formato YYYY-MM-DD');

  const payment = await asaas('POST', '/payments', {
    body: {
      customer,
      billingType: ['PIX', 'BOLETO', 'UNDEFINED'].includes(billingType) ? billingType : 'PIX',
      value: Number(value),
      dueDate,
      description,
      externalReference,
    },
  });

  const rules = await getEconomyRules().catch(() => null);
  const usdRate = Number(rules?.usdBrlRate || 5.0);
  const computedCash = isPositiveMoney(cashAmount)
    ? Number(cashAmount)
    : Number((Number(value) / usdRate).toFixed(2));

  const compra = await repo.PaymentBank.create({
    user_id: userId ? Number(userId) : (req.user?.id ?? null),
    avatar_id: avatarId ? Number(avatarId) : null,
    description: description || `Cobrança ${billingType} R$ ${Number(value).toFixed(2)}`,
    payment_id: payment.id,
    reference_id: externalReference ?? `CHG-${Date.now()}`,
    customer_id: customer,
    status: payment.status,
    value: Number(value),
    cash_amount: computedCash,
    provedor: 'Asaas',
    type: 'Buy',
  });

  let qrCode = null;
  if (payment.billingType === 'PIX' || billingType === 'PIX') {
    qrCode = await asaas('GET', `/payments/${enc(payment.id)}/pixQrCode`).catch(() => null);
  }

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

// Restaurar cobrança excluída
router.post('/pix/payments/:id/restore', wrap(async (req, res) => {
  const payment = await asaas('POST', `/payments/${enc(req.params.id)}/restore`);
  const compra = await findCompra(req.params.id);
  if (compra) await compra.update({ status: payment.status || 'PENDING' });
  res.json({ ok: true, payment, purchase: compra ? toPayment(compra) : null });
}));

// Confirmar recebimento em dinheiro (Receive in Cash) + Opcionalmente creditar carteira TFL
router.post('/pix/payments/:id/receive-in-cash', wrap(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const paymentDate = req.body?.paymentDate || today;
  const value = req.body?.value ? Number(req.body.value) : undefined;
  const notifyCustomer = Boolean(req.body?.notifyCustomer);
  const creditTflWallet = req.body?.creditTflWallet !== false;

  const payment = await asaas('POST', `/payments/${enc(req.params.id)}/receiveInCash`, {
    body: { paymentDate, value, notifyCustomer },
  });

  const compra = await findCompra(req.params.id);
  let walletResult = null;
  if (compra) {
    const wasPaid = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'APPROVED_ADMIN'].includes(compra.status);
    if (creditTflWallet && !wasPaid) {
      walletResult = await creditWalletFromPurchase(compra, payment.status || 'RECEIVED_IN_CASH');
    } else {
      await compra.update({ status: payment.status || 'RECEIVED_IN_CASH' });
    }
  }

  res.json({ ok: true, payment, purchase: compra ? toPayment(compra) : null, walletResult });
}));

// Desfazer recebimento em dinheiro
router.post('/pix/payments/:id/undo-receive-in-cash', wrap(async (req, res) => {
  const payment = await asaas('POST', `/payments/${enc(req.params.id)}/undoReceivedInCash`);
  const compra = await findCompra(req.params.id);
  if (compra) await compra.update({ status: payment.status || 'PENDING' });
  res.json({ ok: true, payment, purchase: compra ? toPayment(compra) : null });
}));

// Estornar cobrança Pix (Refund)
router.post('/pix/payments/:id/refund', wrap(async (req, res) => {
  const body = {};
  if (isPositiveMoney(req.body?.value)) body.value = Number(req.body.value);
  if (req.body?.description) body.description = String(req.body.description).trim();

  const payment = await asaas('POST', `/payments/${enc(req.params.id)}/refund`, { body });
  const compra = await findCompra(req.params.id);
  if (compra) await compra.update({ status: 'REFUNDED' });

  res.json({ ok: true, payment, purchase: compra ? toPayment(compra) : null });
}));

// QR Code de uma cobrança existente
router.get('/pix/payments/:id/qrcode', wrap(async (req, res) => {
  const qr = await asaas('GET', `/payments/${enc(req.params.id)}/pixQrCode`);
  res.json({
    ok: true,
    qrCode: { payload: qr.payload, encodedImage: qr.encodedImage, expirationDate: qr.expirationDate },
  });
}));

// =========================================================================
// 4. PIX ESTÁTICO, DECODIFICADOR DE QR CODE E PAGAMENTO DE QR CODE PIX
// =========================================================================
router.post('/pix/static', wrap(async (req, res) => {
  const { addressKeyId, value, description, expirationDate, allowsMultiplePayments } = req.body || {};
  if (!addressKeyId) throw httpError(400, 'addressKeyId é obrigatório');
  if (value !== undefined && value !== null && value !== '' && !isPositiveMoney(value)) {
    throw httpError(400, 'value, se informado, deve ser maior que zero');
  }
  if (expirationDate && !isDate(expirationDate)) throw httpError(400, 'expirationDate deve ser YYYY-MM-DD');

  const data = await asaas('POST', '/pix/qrCodes/static', {
    body: {
      addressKeyId,
      value: value == null || value === '' ? undefined : Number(value),
      description,
      expirationDate,
      format: 'ALL',
      allowsMultiplePayments: allowsMultiplePayments ?? true,
    },
  });
  res.json({ ok: true, data });
}));

// Decodificar código Pix Copia e Cola antes de pagar
router.post('/pix/qrCodes/decode', wrap(async (req, res) => {
  const payload = String(req.body?.payload || '').trim();
  if (!payload) throw httpError(400, 'Informe o código Pix Copia e Cola (payload).');
  const data = await asaas('POST', '/pix/qrCodes/decode', { body: { payload } });
  res.json({ ok: true, data });
}));

// Pagar um QR Code Pix diretamente pelo saldo Asaas
router.post('/pix/qrCodes/pay', wrap(async (req, res) => {
  const payload = String(req.body?.payload || '').trim();
  const value = req.body?.value ? Number(req.body.value) : undefined;
  const description = req.body?.description ? String(req.body.description).trim() : undefined;
  const scheduleDate = req.body?.scheduleDate || undefined;

  if (!payload) throw httpError(400, 'payload do QR Code é obrigatório.');

  const data = await asaas('POST', '/pix/qrCodes/pay', {
    body: {
      qrCode: { payload },
      value,
      description,
      scheduleDate,
    },
  });
  res.json({ ok: true, data });
}));

// =========================================================================
// 5. TRANSFERÊNCIAS E SAQUES PIX (LISTAR, ENVIAR, APROVAR, CANCELAR)
// =========================================================================
router.get('/pix/transfers', wrap(async (req, res) => {
  const query = { ...paging(req.query) };
  if (req.query.status) query.status = req.query.status;
  if (req.query.dateCreated) query.dateCreated = req.query.dateCreated;

  const data = await asaas('GET', '/transfers', { query });
  res.json({ ok: true, data: data.data || [], totalCount: data.totalCount ?? 0 });
}));

router.get('/pix/transfers/pending', wrap(async (req, res) => {
  const data = await asaas('GET', '/transfers', {
    query: { status: 'PENDING', ...paging(req.query) },
  });
  res.json({ ok: true, data: data.data || [], totalCount: data.totalCount ?? 0 });
}));

// Enviar Pix (saque) com reserva idempotente no banco
router.post('/pix/send', wrap(async (req, res) => {
  const { value, pixAddressKey, pixAddressKeyType, description, externalReference, userId, avatarId } = req.body || {};

  if (!isPositiveMoney(value)) throw httpError(400, 'value deve ser maior que zero');
  if (!pixAddressKey || !pixAddressKeyType) throw httpError(400, 'pixAddressKey e pixAddressKeyType são obrigatórios');
  const extRef = externalReference || `pix-${crypto.randomUUID()}`;

  let saque;
  try {
    saque = await repo.PaymentBank.create({
      user_id: userId ? Number(userId) : (req.user?.id ?? null),
      avatar_id: avatarId ? Number(avatarId) : null,
      description: description || `Transferência Pix para ${pixAddressKey}`,
      reference_id: extRef,
      pix_key: pixAddressKey,
      pix_key_type: pixAddressKeyType,
      value: Number(value),
      status: 'PENDING',
      provedor: 'Asaas',
      type: 'Withdraw',
    });
  } catch (e) {
    if (isUniqueError(e)) throw httpError(409, `Operação ${extRef} já foi enviada ou está em andamento`);
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
        externalReference: extRef,
      },
    });
    await saque.update({ status: data.status || 'REQUESTED', payment_id: data.id });
    res.json({ ok: true, data, withdraw: toPayment(saque) });
  } catch (e) {
    if (e.status >= 400 && e.status < 500) await saque.destroy();
    throw e;
  }
}));

// Aprovar transferência / saque pendente
router.post('/pix/transfers/:id/approve', wrap(async (req, res) => {
  const idParam = req.params.id;
  let saque = await findSaque(idParam);
  if (!saque && /^\d+$/.test(idParam)) {
    saque = await repo.PaymentBank.findByPk(Number(idParam));
  }

  if (saque) {
    await saque.update({ status: 'APPROVED_ADMIN' });
  }

  // Consulta o estado atual da transferência no Asaas
  let remoteTransfer = null;
  if (!/^\d+$/.test(idParam)) {
    remoteTransfer = await asaas('GET', `/transfers/${enc(idParam)}`).catch(() => null);
  }

  res.json({
    ok: true,
    data: remoteTransfer,
    withdraw: saque ? toPayment(saque) : null,
    message: 'Transferência marcada como aprovada.',
  });
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
  res.json({ ok: true, externalReference: req.params.externalReference, status: row.status, withdraw: toPayment(row) });
}));

// =========================================================================
// 6. EXTRATO PIX & EXTRATO FINANCEIRO COMPLETO DA CONTA ASAAS
// =========================================================================
router.get('/pix/transactions', wrap(async (req, res) => {
  const type = req.query.type === 'DEBIT' ? 'DEBIT' : (req.query.type === 'ALL' ? undefined : 'CREDIT');
  const { startDate, finishDate } = req.query;
  if (startDate && !isDate(startDate)) throw httpError(400, 'startDate deve ser YYYY-MM-DD');
  if (finishDate && !isDate(finishDate)) throw httpError(400, 'finishDate deve ser YYYY-MM-DD');

  const data = await asaas('GET', '/pix/transactions', {
    query: { type, ...paging(req.query), startDate, finishDate },
  });
  res.json({ ok: true, data: data.data || [], totalCount: data.totalCount ?? 0 });
}));

router.get('/finance/transactions', wrap(async (req, res) => {
  const { startDate, finishDate } = req.query;
  if (startDate && !isDate(startDate)) throw httpError(400, 'startDate deve ser YYYY-MM-DD');
  if (finishDate && !isDate(finishDate)) throw httpError(400, 'finishDate deve ser YYYY-MM-DD');

  const data = await asaas('GET', '/financialTransactions', {
    query: { ...paging(req.query), startDate, finishDate },
  });
  res.json({ ok: true, data: data.data || [], totalCount: data.totalCount ?? 0 });
}));

// =========================================================================
// 7. CLIENTES ASAAS & SINCRONIZAÇÃO COM USUÁRIOS / AVATARES TFL
// =========================================================================
router.get('/customers', wrap(async (req, res) => {
  const data = await asaas('GET', '/customers', {
    query: {
      name: req.query.name,
      cpfCnpj: req.query.cpfCnpj,
      email: req.query.email,
      offset: req.query.offset,
      limit: req.query.limit,
    },
  });
  res.json({ ok: true, data: data.data || [], totalCount: data.totalCount ?? 0 });
}));

router.get('/customers/search', wrap(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 100);
  if (q.length < 2) return res.json({ ok: true, data: [] });
  const digits = q.replace(/\D/g, '');
  const isDoc = /^[\d.\-\/]+$/.test(q) && digits.length >= 3;
  const filter = isDoc ? { cpfCnpj: digits } : { name: q };
  const data = await asaas('GET', '/customers', { query: { ...filter, limit: 10 } });
  res.json({ ok: true, data: data.data || [] });
}));

router.get('/customers/:id', wrap(async (req, res) => {
  const data = await asaas('GET', `/customers/${enc(req.params.id)}`);
  res.json({ ok: true, data });
}));

router.post('/customers', wrap(async (req, res) => {
  const { name, cpfCnpj, email, mobilePhone, externalReference } = req.body || {};
  if (!name || !cpfCnpj) throw httpError(400, 'name e cpfCnpj são obrigatórios');
  const data = await asaas('POST', '/customers', {
    body: {
      name,
      cpfCnpj: cpfCnpj.replace(/\D/g, ''),
      email,
      mobilePhone,
      externalReference,
    },
  });
  res.json({ ok: true, data });
}));

router.put('/customers/:id', wrap(async (req, res) => {
  const { name, cpfCnpj, email, mobilePhone, externalReference } = req.body || {};
  if (!name || !cpfCnpj) throw httpError(400, 'name e cpfCnpj são obrigatórios');
  const data = await asaas('PUT', `/customers/${enc(req.params.id)}`, {
    body: {
      name,
      cpfCnpj: cpfCnpj.replace(/\D/g, ''),
      email,
      mobilePhone,
      externalReference,
    },
  });
  res.json({ ok: true, data });
}));

router.delete('/customers/:id', wrap(async (req, res) => {
  const data = await asaas('DELETE', `/customers/${enc(req.params.id)}`);
  res.json({ ok: true, data });
}));

router.post('/customers/:id/restore', wrap(async (req, res) => {
  const data = await asaas('POST', `/customers/${enc(req.params.id)}/restore`);
  res.json({ ok: true, data });
}));

// Lista Usuários e Avatares do TFL para facilitar vínculo e sincronização com Asaas
router.get('/tfl-users', wrap(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const Op = repo.Sequelize.Op;
  const whereUser = {};
  if (q) {
    whereUser[Op.or] = [
      { userName: { [Op.iLike]: `%${q}%` } },
      { login: { [Op.iLike]: `%${q}%` } },
      { email: { [Op.iLike]: `%${q}%` } },
    ];
  }

  const users = await repo.User.findAll({
    where: whereUser,
    attributes: ['id', 'userName', 'login', 'email', 'phone', 'role'],
    order: [['id', 'DESC']],
    limit: 30,
  });

  const userIds = users.map(u => u.id);
  const avatars = userIds.length
    ? await repo.Avatar.findAll({
        where: { userId: { [Op.in]: userIds } },
        attributes: ['id', 'userId', 'name', 'selected'],
      })
    : [];
  const avatarIds = avatars.map(a => a.id);
  const wallets = avatarIds.length
    ? await repo.Currency.findAll({
        where: { [Op.or]: [{ avatarId: { [Op.in]: avatarIds } }, { ownerId: { [Op.in]: avatarIds } }] },
      })
    : [];

  const walletByAvatar = new Map();
  wallets.forEach(w => {
    const plain = w.get({ plain: true });
    walletByAvatar.set(Number(plain.avatarId || plain.ownerId), plain);
  });

  const data = users.map(u => {
    const uPlain = u.get({ plain: true });
    const uAvatars = avatars
      .filter(a => Number(a.userId) === Number(uPlain.id))
      .map(a => {
        const aPlain = a.get({ plain: true });
        return {
          ...aPlain,
          wallet: walletByAvatar.get(Number(aPlain.id)) || { cash: 0, coins: 0, chips: 0 },
        };
      });
    return {
      ...uPlain,
      avatars: uAvatars,
    };
  });

  res.json({ ok: true, data });
}));

// Sincroniza/Cria um Cliente no Asaas a partir de um Usuário do TFL
router.post('/customers/sync-user', wrap(async (req, res) => {
  const { userId, cpfCnpj } = req.body || {};
  if (!userId || !cpfCnpj) throw httpError(400, 'Informe userId e cpfCnpj válido.');
  const user = await repo.User.findByPk(Number(userId));
  if (!user) throw httpError(404, 'Usuário TFL não encontrado.');

  const cleanDoc = String(cpfCnpj).replace(/\D/g, '');
  if (![11, 14].includes(cleanDoc.length)) {
    throw httpError(400, 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos.');
  }

  const data = await asaas('POST', '/customers', {
    body: {
      name: user.userName || user.login || `Jogador TFL #${user.id}`,
      cpfCnpj: cleanDoc,
      email: user.email || undefined,
      mobilePhone: user.phone ? String(user.phone).replace(/\D/g, '') : undefined,
      externalReference: `TFL_USER_${user.id}`,
    },
  });

  res.json({ ok: true, data });
}));

// =========================================================================
// 8. CONFIGURAÇÃO DE WEBHOOKS NA CONTA ASAAS
// =========================================================================
router.get('/webhooks-config', wrap(async (req, res) => {
  const data = await asaas('GET', '/webhooks');
  res.json({ ok: true, data: data.data || [] });
}));

router.post('/webhooks-config', wrap(async (req, res) => {
  const protocol = req.protocol || 'https';
  const host = req.get('host') || process.env.SERVER_URL || 'localhost:5000';
  const defaultUrl = `${protocol}://${host}/asaas/webhook`;
  const url = String(req.body?.url || defaultUrl).trim();
  const email = String(req.body?.email || req.user?.email || 'admin@thefantasylife.com').trim();
  const authToken = String(req.body?.authToken || process.env.ASAAS_WEBHOOK_TOKEN || '').trim();

  const data = await asaas('POST', '/webhooks', {
    body: {
      name: req.body?.name || 'TFL Webhook Oficial',
      url,
      email,
      enabled: true,
      interrupted: false,
      authToken: authToken || undefined,
      sendType: 'SEQUENTIALLY',
      events: [
        'PAYMENT_CREATED',
        'PAYMENT_UPDATED',
        'PAYMENT_CONFIRMED',
        'PAYMENT_RECEIVED',
        'PAYMENT_OVERDUE',
        'PAYMENT_DELETED',
        'PAYMENT_REFUNDED',
        'TRANSFER_CREATED',
        'TRANSFER_PENDING',
        'TRANSFER_IN_BANK_PROCESSING',
        'TRANSFER_DONE',
        'TRANSFER_FAILED',
        'TRANSFER_CANCELLED',
      ],
    },
  });
  res.json({ ok: true, data });
}));

// =========================================================================
// 9. BANCO LOCAL TFL, CONCILIAÇÃO, APROVAÇÃO E CRÉDITO MANUAL
// =========================================================================
router.get('/db/payments', wrap(async (req, res) => {
  const where = {};
  if (TIPOS_VALIDOS.includes(req.query.type)) where.type = req.query.type;
  if (req.query.status) where.status = String(req.query.status).slice(0, 30);
  if (req.query.avatarId) where.avatar_id = Number(req.query.avatarId);
  if (req.query.userId) where.user_id = Number(req.query.userId);

  const { offset, limit } = paging(req.query);
  const { rows, count } = await repo.PaymentBank.findAndCountAll({
    where,
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    offset,
    limit,
  });

  res.json({ ok: true, data: rows.map(toPayment), totalCount: count });
}));

// Aprovar ou Recusar Compra/Saque no Banco Local (e opcionalmente disparar Pix real no Asaas para Saque)
router.post('/db/payments/:id/review', wrap(async (req, res) => {
  const paymentId = Number(req.params.id);
  const action = String(req.body?.action || 'APPROVE').toUpperCase();
  const executeAsaasTransfer = Boolean(req.body?.executeAsaasTransfer);

  const payment = await repo.PaymentBank.findByPk(paymentId);
  if (!payment) throw httpError(404, 'Registro não encontrado no banco local.');

  const result = await reviewPaymentTransaction(paymentId, action);

  let asaasTransfer = null;
  if (action === 'APPROVE' && payment.type === 'Withdraw' && executeAsaasTransfer && payment.pix_key) {
    const extRef = payment.reference_id || `WD-${payment.id}-${Date.now()}`;
    asaasTransfer = await asaas('POST', '/transfers', {
      body: {
        operationType: 'PIX',
        value: Number(payment.value),
        pixAddressKey: payment.pix_key,
        pixAddressKeyType: payment.pix_key_type || 'EVP',
        description: payment.description || `Saque TFL #${payment.id}`,
        externalReference: extRef,
      },
    });
    await payment.update({
      payment_id: asaasTransfer.id,
      status: asaasTransfer.status || 'REQUESTED',
      reference_id: extRef,
    });
  }

  const updated = await repo.PaymentBank.findByPk(paymentId);
  res.json({
    ok: true,
    result,
    asaasTransfer,
    payment: updated ? toPayment(updated) : null,
  });
}));

// Sincronizar status de um registro do Banco Local consultando a API do Asaas
router.post('/db/payments/:id/sync', wrap(async (req, res) => {
  const payment = await repo.PaymentBank.findByPk(Number(req.params.id));
  if (!payment) throw httpError(404, 'Registro local não encontrado.');
  if (!payment.payment_id) throw httpError(400, 'Este registro não possui um Payment ID / Transfer ID do Asaas vinculado.');

  if (payment.type === 'Buy') {
    const fresh = await asaas('GET', `/payments/${enc(payment.payment_id)}`);
    const wasPaid = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'APPROVED_ADMIN'].includes(payment.status);
    let walletResult = null;
    if (PAYMENT_PAID.includes(fresh.status) && !wasPaid) {
      walletResult = await creditWalletFromPurchase(payment, fresh.status);
    } else {
      await payment.update({ status: fresh.status });
    }
    return res.json({ ok: true, remote: fresh, payment: toPayment(payment), walletResult });
  } else if (payment.type === 'Withdraw') {
    const fresh = await asaas('GET', `/transfers/${enc(payment.payment_id)}`);
    await payment.update({ status: fresh.status });
    return res.json({ ok: true, remote: fresh, payment: toPayment(payment) });
  }

  throw httpError(400, 'Tipo de registro não suporta sincronização remota.');
}));

// Lançamento Manual de Crédito / Depósito / Compra no Banco Local + Carteira TFL
router.post('/db/payments/manual', wrap(async (req, res) => {
  const {
    type = 'Buy',
    userId,
    avatarId,
    value,
    cashAmount,
    description,
    applyToWallet = true,
  } = req.body || {};

  if (!isPositiveMoney(value) && !isPositiveMoney(cashAmount)) {
    throw httpError(400, 'Informe um valor em R$ (value) ou Cash (cashAmount) maior que zero.');
  }

  const rules = await getEconomyRules().catch(() => null);
  const usdRate = Number(rules?.usdBrlRate || 5.0);
  const finalCash = isPositiveMoney(cashAmount) ? Number(cashAmount) : Number((Number(value) / usdRate).toFixed(2));
  const finalBrl = isPositiveMoney(value) ? Number(value) : Number((finalCash * usdRate).toFixed(2));

  const record = await repo.PaymentBank.create({
    user_id: userId ? Number(userId) : (req.user?.id ?? null),
    avatar_id: avatarId ? Number(avatarId) : null,
    type: ['Buy', 'Deposit', 'Withdraw'].includes(type) ? type : 'Buy',
    provedor: 'ManualAdmin',
    value: finalBrl,
    cash_amount: finalCash,
    status: 'CONFIRMED',
    approval_mode: 'MANUAL',
    reference_id: `ADM-${Date.now()}`,
    description: description || `Lançamento manual Admin ($${finalCash.toFixed(2)} Cash)`,
  });

  let updatedWallet = null;
  if (applyToWallet && (avatarId || userId)) {
    const orConds = [];
    if (avatarId) orConds.push({ avatarId: Number(avatarId) }, { ownerId: Number(avatarId) });
    else if (userId) orConds.push({ userId: Number(userId) });

    const wallet = await repo.Currency.findOne({ where: { [repo.Sequelize.Op.or]: orConds } });
    if (wallet) {
      const delta = type === 'Withdraw' ? -finalCash : finalCash;
      wallet.cash = Math.max(0, Number((Number(wallet.cash) + delta).toFixed(4)));
      await wallet.save();
      updatedWallet = wallet.get({ plain: true });
    }
  }

  res.json({ ok: true, payment: toPayment(record), wallet: updatedWallet });
}));

// Excluir registro local de teste/cancelado
router.delete('/db/payments/:id', wrap(async (req, res) => {
  const row = await repo.PaymentBank.findByPk(Number(req.params.id));
  if (!row) throw httpError(404, 'Registro não encontrado.');
  await row.destroy();
  res.json({ ok: true, deletedId: Number(req.params.id) });
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
      value: undefined,
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