const repo = require('../repositories/repository.js');

/**
 * Middleware para validar a sessão/token e garantir que o avatar requisitado
 * pertença estritamente ao usuário autenticado (Prevenção contra IDOR).
 */
async function resolveAvatar(req, res, next) {
  try {
    const user = req.session?.user || req.user;
    if (!user) {
      if (req.xhr || req.path.startsWith('/api/')) {
        return res.status(401).json({ success: false, error: 'unauthorized', message: 'Faça login para continuar.' });
      }
      return res.redirect('/profile/login');
    }

    const requestedAvatarId = req.header('x-profile-id') || req.session?.avatarId || req.query?.avatarId || req.body?.avatarId;

    if (requestedAvatarId) {
      const avatar = await repo.Avatar.findOne({
        where: {
          id: requestedAvatarId,
          userId: user.id
        }
      });

      if (!avatar) {
        return res.status(403).json({
          success: false,
          error: 'avatar_not_owned',
          message: 'Você não tem permissão para atuar em nome deste avatar.'
        });
      }

      req.avatar = avatar;
      req.avatarId = avatar.id;
    } else {
      // Fallback para o primeiro avatar do usuário
      const firstAvatar = await repo.Avatar.findOne({
        where: { userId: user.id }
      });
      if (firstAvatar) {
        req.avatar = firstAvatar;
        req.avatarId = firstAvatar.id;
        if (req.session) req.session.avatarId = firstAvatar.id;
      }
    }

    next();
  } catch (err) {
    console.error('Erro em resolveAvatar middleware:', err);
    return res.status(500).json({ success: false, error: 'internal_error', message: err.message });
  }
}

module.exports = resolveAvatar;
