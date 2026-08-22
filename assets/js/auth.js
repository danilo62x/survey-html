/* ===== Auth (fictícia) — porta o useAuthStore do React. Chave: "sv-auth" =====
   Qualquer e-mail/senha não vazios entram. Demo: pesquisa@sondagem.com / demo123.
   requireAuth() guarda as páginas app-*.html -> login.html?redirect=... */
(function (global) {
  const STORAGE_KEY = 'sv-auth';
  const DEMO_CREDENTIALS = { email: 'pesquisa@sondagem.com', password: 'demo123' };

  let user = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) user = JSON.parse(raw).user || null;
  } catch (_) {}

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
    } catch (_) {}
  }

  function isAuthenticated() {
    return user !== null;
  }
  function getUser() {
    return user;
  }

  // Autenticação fictícia: qualquer e-mail/senha não vazios entram.
  function login(email, password) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!email || !password) return resolve(false);
        const isDemo = email === DEMO_CREDENTIALS.email;
        const raw = email.split('@')[0].replace(/[._-]/g, ' ') || 'Pesquisa';
        const name = isDemo ? 'Helena Prado' : raw.charAt(0).toUpperCase() + raw.slice(1);
        user = {
          id: 1,
          name,
          email,
          role: 'Coordenadora de pesquisa',
          organization: 'Sondagem',
        };
        persist();
        resolve(true);
      }, 500);
    });
  }

  function register(name, email, password) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!name || !email || !password) return resolve(false);
        user = { id: 1, name, email, role: 'Analista de pesquisa', organization: '' };
        persist();
        resolve(true);
      }, 500);
    });
  }

  function logout() {
    user = null;
    persist();
  }

  function updateProfile(patch) {
    if (!user) return;
    user = Object.assign({}, user, patch);
    persist();
  }

  // Sem sessão, manda para login.html?redirect=<página atual>.
  function requireAuth() {
    if (!isAuthenticated()) {
      const here = window.location.pathname.split('/').pop() || 'index.html';
      const search = window.location.search || '';
      const redirect = encodeURIComponent(here + search);
      window.location.href = 'login.html?redirect=' + redirect;
      return false;
    }
    return true;
  }

  global.Auth = {
    DEMO_CREDENTIALS,
    isAuthenticated,
    getUser,
    login,
    register,
    logout,
    updateProfile,
    requireAuth,
  };
})(window);
