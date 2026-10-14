const repo = require("../repositories/repository");
const { getEconomyRules } = require("./coinMarket.service");

/**
 * Calcula o Passivo Total Exigível em Cash dos Usuários
 * Todo Cash em carteira representa um passivo financeiro que a plataforma
 * tem a obrigação de honrar via saque Pix ou prestação de serviços.
 */
async function calculateUserCashLiabilities() {
  try {
    const rules = await getEconomyRules();
    const usdBrlRate = Number(rules?.usdBrlRate || 5.0);

    const [sumCash, sumCoins, sumChips, activeWalletsCount] = await Promise.all([
      repo.Currency.sum("cash") || 0,
      repo.Currency.sum("coins") || 0,
      repo.Currency.sum("chips") || 0,
      repo.Currency.count({ where: { cash: { [repo.Sequelize.Op.gt]: 0 } } }) || 0,
    ]);

    const totalCashUsd = Number(Number(sumCash || 0).toFixed(4));
    const totalCashBrl = Number((totalCashUsd * usdBrlRate).toFixed(2));
    const totalCoins = Math.floor(Number(sumCoins || 0));
    const totalChips = Math.floor(Number(sumChips || 0));

    return {
      totalCashUsd,
      totalCashBrl,
      totalCoins,
      totalChips,
      activeWalletsWithBalance: activeWalletsCount,
      exchangeRateUsdBrl: usdBrlRate,
    };
  } catch (err) {
    console.error("[calculateUserCashLiabilities]", err);
    return {
      totalCashUsd: 0,
      totalCashBrl: 0,
      totalCoins: 0,
      totalChips: 0,
      activeWalletsWithBalance: 0,
      exchangeRateUsdBrl: 5.0,
      error: err.message,
    };
  }
}

/**
 * Resumo de Despesas Operacionais da Plataforma
 */
async function getOperationalExpensesSummary(filter = {}) {
  try {
    if (!repo.PlatformOperationalExpense) {
      return { totalPaidBrl: 0, totalPendingBrl: 0, byCategory: [] };
    }

    const where = {};
    if (filter.startDate && filter.endDate) {
      where.date = {
        [repo.Sequelize.Op.between]: [filter.startDate, filter.endDate],
      };
    }

    const expenses = await repo.PlatformOperationalExpense.findAll({
      where,
      order: [["date", "DESC"], ["id", "DESC"]],
    });

    let totalPaidBrl = 0;
    let totalPendingBrl = 0;
    let totalForecastBrl = 0;
    const categoryMap = new Map();

    for (const exp of expenses) {
      const plain = exp.get({ plain: true });
      const val = Number(plain.amountBrl || 0);

      if (plain.status === "paid") totalPaidBrl += val;
      else if (plain.status === "pending") totalPendingBrl += val;
      else if (plain.status === "forecast") totalForecastBrl += val;

      const cat = plain.category || "other";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + val);
    }

    const byCategory = Array.from(categoryMap.entries()).map(([category, totalBrl]) => ({
      category,
      totalBrl: Number(totalBrl.toFixed(2)),
    }));

    return {
      totalPaidBrl: Number(totalPaidBrl.toFixed(2)),
      totalPendingBrl: Number(totalPendingBrl.toFixed(2)),
      totalForecastBrl: Number(totalForecastBrl.toFixed(2)),
      expensesCount: expenses.length,
      byCategory,
      recentExpenses: expenses.slice(0, 10).map((e) => e.get({ plain: true })),
    };
  } catch (err) {
    console.error("[getOperationalExpensesSummary]", err);
    return { totalPaidBrl: 0, totalPendingBrl: 0, totalForecastBrl: 0, byCategory: [], error: err.message };
  }
}

/**
 * Indicador Consolidado de Saúde Financeira da Plataforma
 */
async function getPlatformFinancialHealth() {
  const [userLiabilities, expensesSummary, rules] = await Promise.all([
    calculateUserCashLiabilities(),
    getOperationalExpensesSummary(),
    getEconomyRules().catch(() => null),
  ]);

  const collectedFeesCash = Number(rules?.collectedFeesCash || 0);
  const collectedFeesCoins = Number(rules?.collectedFeesCoins || 0);
  const usdBrlRate = userLiabilities.exchangeRateUsdBrl;
  const collectedFeesBrl = Number((collectedFeesCash * usdBrlRate).toFixed(2));

  // Obrigações imediatas (Passivo de Cash dos Usuários + Despesas Pendentes)
  const totalImmediateObligationsBrl = Number(
    (userLiabilities.totalCashBrl + expensesSummary.totalPendingBrl).toFixed(2)
  );

  // Status de Saúde Financeira da Plataforma
  let status = "HEALTHY";
  const warnings = [];

  if (userLiabilities.totalCashBrl > 5000 && expensesSummary.totalPendingBrl > 1000) {
    status = "ATTENTION";
    warnings.push("O passivo de Cash em circulação ultrapassou R$ 5.000,00 com despesas pendentes.");
  }

  if (expensesSummary.totalPendingBrl > 5000) {
    status = "CRITICAL";
    warnings.push("Despesas operacionais pendentes acima de R$ 5.000,00 requerem quitação imediata.");
  }

  return {
    timestamp: new Date().toISOString(),
    status,
    warnings,
    userLiabilities,
    operationalExpenses: expensesSummary,
    platformTreasury: {
      collectedFeesCash,
      collectedFeesCoins,
      collectedFeesBrl,
    },
    obligations: {
      totalImmediateObligationsBrl,
      reserveTargetBrl: Number((userLiabilities.totalCashBrl * 1.2).toFixed(2)), // Reserva recomendada: 120% do Cash de usuários
    },
  };
}

/**
 * Criação de Nova Despesa Operacional
 */
async function recordOperationalExpense({
  category = "server_hosting",
  description,
  amountBrl = 0,
  amountCash = 0,
  date,
  status = "paid",
  receiptUrl = "",
  notes = "",
  createdById = null,
}) {
  if (!description || String(description).trim().length < 3) {
    throw new Error("Descrição da despesa é obrigatória.");
  }

  const valBrl = Number(amountBrl || 0);
  if (valBrl <= 0) {
    throw new Error("O valor em BRL deve ser maior que zero.");
  }

  const expense = await repo.PlatformOperationalExpense.create({
    category: String(category).trim(),
    description: String(description).trim(),
    amountBrl: valBrl,
    amountCash: Number(amountCash || 0),
    date: date || new Date(),
    status: String(status || "paid").trim(),
    receiptUrl: String(receiptUrl || "").trim(),
    notes: String(notes || "").trim(),
    createdById: createdById ? Number(createdById) : null,
  });

  return expense.get({ plain: true });
}

/**
 * Listagem Paginada de Despesas Operacionais
 */
async function listOperationalExpenses({ page = 1, limit = 20, status, category } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (p - 1) * l;

  const where = {};
  if (status) where.status = String(status).trim();
  if (category) where.category = String(category).trim();

  const { rows, count } = await repo.PlatformOperationalExpense.findAndCountAll({
    where,
    order: [["date", "DESC"], ["id", "DESC"]],
    limit: l,
    offset,
  });

  return {
    expenses: rows.map((r) => r.get({ plain: true })),
    pagination: {
      total: count,
      page: p,
      limit: l,
      totalPages: Math.ceil(count / l),
    },
  };
}

/**
 * Remoção de Despesa Operacional
 */
async function deleteOperationalExpense(id) {
  const expenseId = Number(id);
  if (!expenseId) throw new Error("ID de despesa inválido.");

  const row = await repo.PlatformOperationalExpense.findByPk(expenseId);
  if (!row) throw new Error("Despesa operacional não encontrada.");

  await row.destroy();
  return { success: true, message: `Despesa #${expenseId} removida com sucesso.` };
}

module.exports = {
  calculateUserCashLiabilities,
  getOperationalExpensesSummary,
  getPlatformFinancialHealth,
  recordOperationalExpense,
  listOperationalExpenses,
  deleteOperationalExpense,
};
