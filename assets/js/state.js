/* ===== Estado global de interface — porta o useUiStore do React =====
   Tema, sidebar, banner de cookies e o aviso a cada resposta recebida.
   Chave de persistência: "sv-ui". */
(function (global) {
  const STORAGE_KEY = 'sv-ui';

  const DEFAULTS = {
    darkMode: false,
    sidebarCollapsed: false,
    sidebarMobileOpen: false,
    cookiesAccepted: false,
    showCookieBanner: false,
    /** Avisar a cada resposta recebida — usado nas configurações. */
    notifyOnResponse: true,
  };

  let state = Object.assign({}, DEFAULTS);
  const listeners = new Set();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        state = Object.assign({}, DEFAULTS, {
          darkMode: !!p.darkMode,
          sidebarCollapsed: !!p.sidebarCollapsed,
          cookiesAccepted: !!p.cookiesAccepted,
          notifyOnResponse: p.notifyOnResponse === undefined ? true : !!p.notifyOnResponse,
        });
      }
    } catch (_) {}
  }

  function persist() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          darkMode: state.darkMode,
          sidebarCollapsed: state.sidebarCollapsed,
          cookiesAccepted: state.cookiesAccepted,
          notifyOnResponse: state.notifyOnResponse,
        })
      );
    } catch (_) {}
  }

  function set(patch) {
    state = Object.assign({}, state, patch);
    persist();
    listeners.forEach((cb) => cb(state));
  }

  function get() {
    return state;
  }

  function subscribe(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  function applyTheme() {
    const root = document.documentElement;
    if (state.darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }

  function toggleDarkMode() {
    set({ darkMode: !state.darkMode });
    applyTheme();
  }
  function setDarkMode(val) {
    set({ darkMode: val });
    applyTheme();
  }
  function toggleSidebar() {
    set({ sidebarCollapsed: !state.sidebarCollapsed });
  }
  function toggleSidebarMobile(val) {
    set({ sidebarMobileOpen: val !== undefined ? val : !state.sidebarMobileOpen });
  }
  function acceptCookies() {
    set({ cookiesAccepted: true, showCookieBanner: false });
  }
  function declineCookies() {
    set({ cookiesAccepted: false, showCookieBanner: false });
  }
  function openCookieBanner() {
    set({ showCookieBanner: true });
  }
  function closeCookieBanner() {
    set({ showCookieBanner: false });
  }
  function setNotifyOnResponse(val) {
    set({ notifyOnResponse: !!val });
  }

  function notify(message, type, duration) {
    if (global.UIToast) global.UIToast(message, type, duration);
    else console.log('[notify]', message);
  }

  load();
  applyTheme();

  global.UIState = {
    get,
    set,
    subscribe,
    applyTheme,
    toggleDarkMode,
    setDarkMode,
    toggleSidebar,
    toggleSidebarMobile,
    acceptCookies,
    declineCookies,
    openCookieBanner,
    closeCookieBanner,
    setNotifyOnResponse,
    notify,
    notifySuccess: (m) => notify(m, 'success'),
    notifyError: (m) => notify(m, 'error'),
    notifyWarning: (m) => notify(m, 'warning'),
  };
})(window);
