# User — Conta Civil, Autenticação e Credenciais

> **Caminho:** `app/user` · **Pai:** [app](../regras.md) · **Status:** ✅ Implementado

## Filhos
- [avatar](avatar/regras.md) — Persona ativa (escudo de privacidade)

## Regras
1. **1 conta → N avatares.** A conta (`users`) nunca aparece publicamente. Tudo o que é público pertence a um avatar.
2. Credenciais (login, e-mail, senha) só são mostradas e editadas na aba **Conta** (`view-account.ejs`).
3. **Senhas:** usar `encryptPassword` de `src/controllers/auth.js`. Não adicionar outra biblioteca de hash (ex.: `bcryptjs` foi removida no LOG #17).
4. **Autenticação:** sessão/cookie no site. `Authorization: Bearer <token>` ou `tfl-token` na API.
5. **Roles:** `player`, `moderador`, `desenvolvedor`, `ownner`, `owner`, `admin`. Acesso ao `/admin`: `admin`, `owner`, `ownner`, `desenvolvedor` ou usuário `#1`.
6. **Anti-farm:** avatares da mesma conta (`userId`) nunca geram recompensa uns para os outros.

## Implementação atual
- `src/models/User.js`, `src/controllers/auth.js`, `src/views/profile/partials/view-account.ejs`
