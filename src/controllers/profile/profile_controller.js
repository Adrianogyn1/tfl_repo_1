const router = require('express').Router();
const repo = require('../../repositories/repository');

router.get('/login', (req, res) =>
{
    return  res.render('profile/login', { title: 'Login', t: req.translate });
});

router.get('/register', (req, res) =>
{
  return  res.render('profile/register', { title: 'Register', t: req.translate });
});

router.get('/forgot', (req, res) =>
{
  return  res.render('profile/forgot', { title: 'Esqueci a Senha', t: req.translate });
});

router.get('/logout', (req, res) =>
{
  req.session.destroy(() => {
    res.clearCookie('userToken');
    return res.redirect('/profile/login');
  });
});

// Middleware de proteção de rota do perfil
router.use(async (req, res, next) =>
{
  if (req.session?.user) {
    req.user = req.session.user;
    return next();
  }

  const token = req.cookies?.userToken || req.headers?.['tfl-token'] || req.headers?.['token'];
  if (token) {
    try {
      const user = await repo.User.findOne({ where: { token } });
      if (user) {
        req.user = user.get({ plain: true });
        req.session.user = req.user;
        return next();
      }
    } catch (e) {
      console.error("Erro auth profile:", e);
    }
  }

  return res.redirect('/profile/login');
});

router.get('/', async (req, res) =>
{
  const user = req.user || req.session?.user;
  if (!user) {
    return res.redirect('/profile/login');
  }

  return res.render('profile/index', { title: 'Perfil', t: req.translate, user });
});

module.exports = router;