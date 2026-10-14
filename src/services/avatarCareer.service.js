const repo = require("../repositories/repository");

const DEFAULT_CAREER_DEFINITIONS = [
  {
    careerKey: "explorer",
    careerName: "Explorador Dimensional",
    badgeIcon: "🧭",
    level: 1,
    xp: 0,
    nextLevelXp: 100,
    titleReward: "O Desbravador",
    description: "Explora salas 3D e mundos virtuais por todo o metaverso.",
    isEquipped: true,
  },
  {
    careerKey: "writer",
    careerName: "Escriba do Diário",
    badgeIcon: "✒️",
    level: 1,
    xp: 0,
    nextLevelXp: 100,
    titleReward: "Coração Poético",
    description: "Escreve no diário secreto e compartilha desabafos no mural anônimo.",
    isEquipped: false,
  },
  {
    careerKey: "trader",
    careerName: "Magnata P2P",
    badgeIcon: "💎",
    level: 1,
    xp: 0,
    nextLevelXp: 100,
    titleReward: "Operador de Coins",
    description: "Negocia moedas, converte ativos e opera no mercado livre.",
    isEquipped: false,
  },
  {
    careerKey: "socialite",
    careerName: "Estrela Social",
    badgeIcon: "💖",
    level: 1,
    xp: 0,
    nextLevelXp: 100,
    titleReward: "Celebridade da Rede",
    description: "Interage no feed, compartilha fotos, Mini Reels e conquista amizades.",
    isEquipped: false,
  },
  {
    careerKey: "host",
    careerName: "Grande Anfitrião",
    badgeIcon: "🏠",
    level: 1,
    xp: 0,
    nextLevelXp: 100,
    titleReward: "Senhor dos Mundos",
    description: "Cria e hospeda salas interativas acolhendo múltiplos jogadores.",
    isEquipped: false,
  },
];

async function ensureAvatarCareers(avatarId) {
  const avId = Number(avatarId);
  if (!avId) return [];

  if (!repo.AvatarCareer) return [];

  const existing = await repo.AvatarCareer.findAll({
    where: { avatarId: avId },
    order: [["id", "ASC"]],
  });

  if (existing && existing.length > 0) {
    return existing.map((c) => c.get({ plain: true }));
  }

  // Inicializa a trilha de carreiras com a primeira equipada por padrão
  const created = [];
  for (const def of DEFAULT_CAREER_DEFINITIONS) {
    const item = await repo.AvatarCareer.create({
      avatarId: avId,
      careerKey: def.careerKey,
      careerName: def.careerName,
      badgeIcon: def.badgeIcon,
      level: def.level,
      xp: def.xp,
      nextLevelXp: def.nextLevelXp,
      titleReward: def.titleReward,
      description: def.description,
      isEquipped: def.isEquipped,
      unlockedAt: new Date(),
    });
    created.push(item.get({ plain: true }));
  }

  return created;
}

async function getAvatarCareers(avatarId) {
  return await ensureAvatarCareers(avatarId);
}

async function equipAvatarBadge(avatarId, careerKey) {
  const avId = Number(avatarId);
  if (!avId || !careerKey) {
    throw new Error("Avatar e carreira são obrigatórios.");
  }

  await ensureAvatarCareers(avId);

  // Desequipa os outros selos para manter 1 selo principal ativo
  await repo.AvatarCareer.update(
    { isEquipped: false },
    { where: { avatarId: avId } }
  );

  // Equipa a carreira desejada
  const [updated] = await repo.AvatarCareer.update(
    { isEquipped: true },
    { where: { avatarId: avId, careerKey: String(careerKey).trim() } }
  );

  return { success: true, equippedCareerKey: careerKey };
}

async function addCareerXp(avatarId, careerKey, xpAmount) {
  const avId = Number(avatarId);
  const xp = Math.max(0, Math.floor(Number(xpAmount) || 0));
  if (!avId || !careerKey || xp <= 0) return null;

  await ensureAvatarCareers(avId);

  const career = await repo.AvatarCareer.findOne({
    where: { avatarId: avId, careerKey: String(careerKey).trim() },
  });

  if (!career) return null;

  let newXp = career.xp + xp;
  let newLevel = career.level;
  let nextLevelXp = career.nextLevelXp;

  while (newXp >= nextLevelXp) {
    newXp -= nextLevelXp;
    newLevel += 1;
    nextLevelXp = Math.floor(nextLevelXp * 1.5);
  }

  await career.update({
    level: newLevel,
    xp: newXp,
    nextLevelXp,
  });

  return career.get({ plain: true });
}

module.exports = {
  getAvatarCareers,
  equipAvatarBadge,
  addCareerXp,
  DEFAULT_CAREER_DEFINITIONS,
};
