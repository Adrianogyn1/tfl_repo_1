const { Op } = require("sequelize");
const repo = require("../repositories/repository");

/**
 * Cria uma mensagem de contato no banco de dados.
 */
async function createContactMessage({ name, email, subject, message, ip = "", userAgent = "", userId = null }) {
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanSubject = String(subject || "").trim();
  const cleanMessage = String(message || "").trim();

  if (!cleanName || cleanName.length < 2) {
    throw new Error("Por favor, informe seu nome completo (mínimo 2 caracteres).");
  }
  if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
    throw new Error("Por favor, forneça um endereço de e-mail válido para retorno.");
  }
  if (!cleanSubject || cleanSubject.length < 3) {
    throw new Error("Por favor, informe o assunto da mensagem (mínimo 3 caracteres).");
  }
  if (!cleanMessage || cleanMessage.length < 10) {
    throw new Error("A mensagem de contato deve ter pelo menos 10 caracteres.");
  }

  const record = await repo.ContactMessage.create({
    name: cleanName.slice(0, 120),
    email: cleanEmail.slice(0, 160),
    subject: cleanSubject.slice(0, 200),
    message: cleanMessage,
    ip: String(ip || "").slice(0, 64),
    userAgent: String(userAgent || "").slice(0, 255),
    userId: userId ? Number(userId) : null,
    status: "unread",
  });

  return record.get({ plain: true });
}

/**
 * Cria um relatório de bug no banco de dados com print/screenshot opcional.
 */
async function createBugReport({
  title,
  category = "geral",
  severity = "media",
  description,
  stepsToReproduce = "",
  expectedBehavior = "",
  screenshotUrl = "",
  email = "",
  ip = "",
  userAgent = "",
  userId = null,
}) {
  const cleanTitle = String(title || "").trim();
  const cleanDesc = String(description || "").trim();
  const cleanSteps = String(stepsToReproduce || "").trim();
  const cleanExpected = String(expectedBehavior || "").trim();
  const cleanScreenshot = String(screenshotUrl || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!cleanTitle || cleanTitle.length < 4) {
    throw new Error("Por favor, dê um título descritivo para o problema (mínimo 4 caracteres).");
  }
  if (!cleanDesc || cleanDesc.length < 10) {
    throw new Error("Por favor, descreva detalhadamente o que ocorreu (mínimo 10 caracteres).");
  }

  const validCategories = ["geral", "game_3d", "interface_web", "chat", "perfil", "loja_economia", "login_conta", "outro"];
  const finalCategory = validCategories.includes(category) ? category : "geral";

  const validSeverities = ["baixa", "media", "alta", "critica"];
  const finalSeverity = validSeverities.includes(severity) ? severity : "media";

  const record = await repo.BugReport.create({
    title: cleanTitle.slice(0, 200),
    category: finalCategory,
    severity: finalSeverity,
    description: cleanDesc,
    stepsToReproduce: cleanSteps,
    expectedBehavior: cleanExpected,
    screenshotUrl: cleanScreenshot.slice(0, 500),
    email: cleanEmail.slice(0, 160),
    ip: String(ip || "").slice(0, 64),
    userAgent: String(userAgent || "").slice(0, 255),
    userId: userId ? Number(userId) : null,
    status: "aberto",
  });

  return record.get({ plain: true });
}

/**
 * Cria uma sugestão de melhoria no banco de dados para votação popular da comunidade.
 */
async function createUserSuggestion({
  title,
  category = "geral",
  description,
  expectedBenefit = "",
  email = "",
  ip = "",
  userAgent = "",
  userId = null,
}) {
  const cleanTitle = String(title || "").trim();
  const cleanDesc = String(description || "").trim();
  const cleanBenefit = String(expectedBenefit || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!cleanTitle || cleanTitle.length < 4) {
    throw new Error("Por favor, dê um título para a sua ideia ou sugestão (mínimo 4 caracteres).");
  }
  if (!cleanDesc || cleanDesc.length < 10) {
    throw new Error("Por favor, elabore sua proposta ou sugestão (mínimo 10 caracteres).");
  }

  const validCategories = ["geral", "jogabilidade", "social", "visual", "economia", "nova_funcao", "outro"];
  const finalCategory = validCategories.includes(category) ? category : "geral";

  const record = await repo.UserSuggestion.create({
    title: cleanTitle.slice(0, 200),
    category: finalCategory,
    description: cleanDesc,
    expectedBenefit: cleanBenefit,
    votesCount: 0,
    email: cleanEmail.slice(0, 160),
    ip: String(ip || "").slice(0, 64),
    userAgent: String(userAgent || "").slice(0, 255),
    userId: userId ? Number(userId) : null,
    status: "em_votacao",
  });

  return record.get({ plain: true });
}

/**
 * Alterna (toggle) o voto do usuário em uma sugestão.
 * Quem decide são os próprios usuários no painel de votação.
 */
async function toggleSuggestionVote({ suggestionId, userId = null, ip = "" }) {
  const sId = Number(suggestionId);
  if (!sId) throw new Error("ID de sugestão inválido.");

  const suggestion = await repo.UserSuggestion.findByPk(sId);
  if (!suggestion) throw new Error("Sugestão não encontrada.");

  // Critério de verificação: por usuário logado (userId) ou por IP
  const whereVote = { suggestionId: sId };
  if (userId) {
    whereVote.userId = Number(userId);
  } else if (ip) {
    whereVote.ip = String(ip);
  } else {
    throw new Error("Identificação de voto necessária.");
  }

  const existingVote = await repo.SuggestionVote.findOne({ where: whereVote });

  let hasVoted = false;
  if (existingVote) {
    // Remove o voto (unvote)
    await existingVote.destroy();
    const newCount = Math.max(0, (suggestion.votesCount || 0) - 1);
    await suggestion.update({ votesCount: newCount });
    hasVoted = false;
  } else {
    // Registra novo voto
    await repo.SuggestionVote.create({
      suggestionId: sId,
      userId: userId ? Number(userId) : null,
      ip: String(ip || "").slice(0, 64),
    });
    const newCount = (suggestion.votesCount || 0) + 1;
    await suggestion.update({ votesCount: newCount });
    hasVoted = true;
  }

  return {
    success: true,
    hasVoted,
    votesCount: suggestion.votesCount,
    suggestionId: sId,
  };
}

/**
 * Lista as sugestões ativas para o painel de votação pública da comunidade.
 */
async function listCommunitySuggestions({ sort = "votes", category = "all", limit = 50, offset = 0, userId = null, ip = "" } = {}) {
  const where = {};
  if (category && category !== "all") {
    where.category = category;
  }

  let order = [["votesCount", "DESC"], ["createdAt", "DESC"]];
  if (sort === "recent") {
    order = [["createdAt", "DESC"]];
  }

  const rows = await repo.UserSuggestion.findAll({
    where,
    order,
    limit: Math.min(Number(limit) || 30, 100),
    offset: Number(offset) || 0,
  });

  // Identifica votos do usuário atual para marcar hasVoted: true
  let userVotedIds = new Set();
  if (repo.SuggestionVote && (userId || ip)) {
    const voteConditions = [];
    if (userId) voteConditions.push({ userId: Number(userId) });
    if (ip) voteConditions.push({ ip: String(ip) });

    const votes = await repo.SuggestionVote.findAll({
      where: {
        suggestionId: rows.map((r) => r.id),
        [Op.or]: voteConditions,
      },
      attributes: ["suggestionId"],
    });
    votes.forEach((v) => userVotedIds.add(v.suggestionId));
  }

  return rows.map((row) => {
    const plain = row.get({ plain: true });
    plain.hasVoted = userVotedIds.has(plain.id);
    return plain;
  });
}

/**
 * Listagem para suporte e métricas administrativas
 */
async function listContactMessages({ limit = 50, offset = 0, status = null } = {}) {
  const where = {};
  if (status) where.status = status;
  return repo.ContactMessage.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: Math.min(limit, 100),
    offset,
  });
}

async function listBugReports({ limit = 50, offset = 0, status = null } = {}) {
  const where = {};
  if (status) where.status = status;
  return repo.BugReport.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: Math.min(limit, 100),
    offset,
  });
}

module.exports = {
  createContactMessage,
  createBugReport,
  createUserSuggestion,
  toggleSuggestionVote,
  listCommunitySuggestions,
  listContactMessages,
  listBugReports,
};
