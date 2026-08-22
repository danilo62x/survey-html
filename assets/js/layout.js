/* ===== Layout do Sondagem (três shells) + biblioteca de componentes =====
   Shell PUBLIC (navbar + rodapé) para o site e o formulário público, shell APP
   (sidebar + topbar) para as páginas app-*.html e shell BLANK (autenticação /
   404). A escolha vem de <body data-shell>. Expõe os helpers UI.* e liga os
   handlers de tema, idioma e menus. Espelha os layouts e os componentes sv do
   React. */
(function (global) {
  const SHELL = (document.body.getAttribute('data-shell') || 'public').toLowerCase();

  function t(key, opts) {
    return global.I18n ? global.I18n.t(key, opts) : key;
  }
  function tArr(key) {
    return global.I18n ? global.I18n.tArr(key) : [];
  }
  function lang() {
    return global.I18n ? global.I18n.getLang() : 'pt-BR';
  }
  const F = global.Format;
  const fmt = (v) => F.formatCurrency(v, lang());
  const fmtCompact = (v) => F.formatCompact(v, lang());
  const fmtNumber = (v) => F.formatNumber(v, lang());
  const fmtDate = (v) => F.formatDate(v, lang());
  const fmtDateTime = (v) => F.formatDateTime(v, lang());
  const fmtTime = (v) => F.formatTime(v, lang());

  const LANGS = global.I18n ? global.I18n.LANGUAGES : [{ code: 'pt-BR', flag: '🇧🇷', label: 'Português' }];

  /** Escapa um valor usado dentro de um atributo ou de um nó de texto. */
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Carrega os scripts compartilhados uma única vez (pwa).
  (function loadScriptsOnce() {
    ['assets/js/pwa.js'].forEach((src) => {
      if (!document.querySelector('script[src="' + src + '"]')) {
        const sc = document.createElement('script');
        sc.src = src;
        document.head.appendChild(sc);
      }
    });
  })();

  /** Endereço público de um formulário — usado no compartilhar e no copiar link. */
  function publicLink(slug) {
    const dir = window.location.pathname.replace(/[^/]*$/, '');
    return window.location.origin + dir + 'formulario.html?slug=' + encodeURIComponent(slug);
  }

  /** Valor de um parâmetro da barra de endereços. */
  function param(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  // ============================================================
  // Helpers de renderização compartilhados
  // ============================================================
  function langMenu() {
    return LANGS.map(
      (l) =>
        '<button type="button" class="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ' +
        (l.code === lang() ? 'font-medium text-brand-600' : 'text-body') +
        '" data-action="set-lang" data-lang="' +
        l.code +
        '"><span>' +
        l.flag +
        '</span> ' +
        l.label +
        (l.code === lang() ? icon('check', { size: 14, className: 'ml-auto' }) : '') +
        '</button>'
    ).join('');
  }

  function langDropdown(id) {
    const active = LANGS.find((l) => l.code === lang()) || LANGS[0];
    return (
      '<div class="relative" id="' +
      id +
      '"><button type="button" data-action="toggle-lang" data-menu="#' +
      id +
      '-menu" aria-label="Language" class="flex h-10 w-10 items-center justify-center rounded-full border border-themed text-base hover:bg-gray-50 dark:hover:bg-gray-800">' +
      active.flag +
      '</button><div id="' +
      id +
      '-menu" class="surface-card absolute right-0 mt-3 w-44 rounded-xl border py-1 shadow-theme-lg hidden z-50">' +
      langMenu() +
      '</div></div>'
    );
  }

  // ---- Avatar — porta o React Avatar ----
  const AVATAR_SIZE = {
    xs: 'h-7 w-7 text-[10px]',
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-16 w-16 text-lg',
  };
  function initials(name) {
    if (!name) return '?';
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => (p[0] || '').toUpperCase())
      .join('');
  }
  // avatar(nameOrOpts, size) — opts: { src, name, size }
  function avatar(a, size) {
    let src, name;
    if (a && typeof a === 'object') {
      src = a.src;
      name = a.name;
      size = a.size || size;
    } else {
      name = a;
    }
    const dims = AVATAR_SIZE[size] || AVATAR_SIZE.md;
    if (src)
      return '<img src="' + esc(src) + '" alt="' + esc(name || '') + '" loading="lazy" class="shrink-0 rounded-full object-cover ' + dims + '"/>';
    return (
      '<span class="flex shrink-0 items-center justify-center rounded-full bg-brand-500 font-semibold text-white ' +
      dims +
      '">' +
      esc(initials(name)) +
      '</span>'
    );
  }

  // ---- Badge — porta o React Badge ----
  const BADGE_SOFT = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
    success: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500',
    warning: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500',
    error: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };
  const BADGE_SOLID = {
    brand: 'bg-brand-500 text-white',
    success: 'bg-success-500 text-white',
    warning: 'bg-warning-500 text-white',
    error: 'bg-error-500 text-white',
    gray: 'bg-gray-500 text-white',
  };
  const BADGE_DOT = {
    brand: 'bg-brand-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    gray: 'bg-gray-400',
  };
  // badge(label, color, opts) — opts: { variant:'soft'|'solid', dot:bool, icon:name }
  function badge(label, color, opts) {
    color = color || 'brand';
    opts = opts || {};
    const solid = opts.variant === 'solid';
    const styles = solid ? BADGE_SOLID[color] || BADGE_SOLID.brand : BADGE_SOFT[color] || BADGE_SOFT.brand;
    const dot = opts.dot
      ? '<span class="h-1.5 w-1.5 rounded-full ' + (solid ? 'bg-white' : BADGE_DOT[color] || BADGE_DOT.gray) + '"></span>'
      : '';
    const ic = opts.icon ? icon(opts.icon, { size: 12, strokeWidth: 2.2 }) : '';
    return (
      '<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ' +
      styles +
      '">' +
      dot +
      ic +
      esc(label) +
      '</span>'
    );
  }

  // ---- StatusPill — porta o React StatusPill ----
  const STATUS_COLOR = { rascunho: 'warning', publicado: 'success', encerrado: 'gray' };

  function surveyStatus(status) {
    return badge(t('statuses.' + status), STATUS_COLOR[status] || 'gray', { dot: true });
  }

  const SOURCE_ICON = { link: 'link', email: 'mail', qr: 'qr', incorporado: 'code' };

  function sourceBadge(source) {
    return badge(t('sources.' + source), 'gray', { icon: SOURCE_ICON[source] || 'link' });
  }

  function typeBadge(type) {
    return badge(t('questionTypes.' + type), 'brand', { icon: Data.QUESTION_ICON[type] });
  }

  // ---- KpiCard — porta o React sv/KpiCard ----
  const KPI_BG = {
    brand: 'bg-brand-50 dark:bg-brand-500/15',
    success: 'bg-success-50 dark:bg-success-500/15',
    warning: 'bg-warning-50 dark:bg-warning-500/15',
    error: 'bg-error-50 dark:bg-error-500/15',
    info: 'bg-blue-light-50 dark:bg-blue-light-500/15',
  };
  const KPI_COLOR = {
    brand: 'text-brand-500',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-error-500',
    info: 'text-blue-light-500',
  };
  // kpiCard(o) — o: { title, value, icon, accent, hint }
  function kpiCard(o) {
    const accent = o.accent || 'brand';
    return (
      '<div class="surface-card rounded-2xl border p-5 shadow-theme-sm">' +
      '<div class="flex items-start justify-between gap-3"><div class="min-w-0">' +
      '<p class="truncate text-sm text-muted">' + o.title + '</p>' +
      '<p class="mt-2 text-title-sm font-bold text-heading">' + o.value + '</p></div>' +
      '<span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ' + KPI_BG[accent] + '">' +
      icon(o.icon, { size: 20, className: KPI_COLOR[accent] }) +
      '</span></div>' +
      (o.hint ? '<p class="mt-3 text-xs text-muted">' + o.hint + '</p>' : '') +
      '</div>'
    );
  }

  function emptyState(o) {
    o = o || {};
    return (
      '<div class="flex flex-col items-center justify-center py-16 text-center">' +
      '<span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/15">' +
      icon(o.icon || 'package', { size: 28 }) +
      '</span>' +
      '<h3 class="mt-5 text-lg font-semibold text-heading">' + (o.title || '') + '</h3>' +
      (o.description ? '<p class="mt-2 max-w-sm text-sm text-muted">' + o.description + '</p>' : '') +
      (o.action ? '<div class="mt-6">' + o.action + '</div>' : '') +
      '</div>'
    );
  }

  function breadcrumb(items) {
    const lis = items
      .map((item, i) => {
        const last = i === items.length - 1;
        const ic = item.icon ? icon(item.icon, { size: 15 }) : '';
        const content =
          item.href && !last
            ? '<a href="' + item.href + '" class="inline-flex items-center gap-1.5 text-muted transition hover:text-brand-600 dark:hover:text-brand-400">' + ic + esc(item.label) + '</a>'
            : '<span ' + (last ? 'aria-current="page"' : '') + ' class="inline-flex items-center gap-1.5 ' + (last ? 'font-medium text-heading' : 'text-muted') + '">' + ic + esc(item.label) + '</span>';
        const sep = !last ? icon('chevron-right', { size: 14, className: 'text-gray-400' }) : '';
        return '<li class="flex items-center gap-1.5">' + content + sep + '</li>';
      })
      .join('');
    return '<nav aria-label="Breadcrumb"><ol class="flex flex-wrap items-center gap-1.5 text-sm">' + lis + '</ol></nav>';
  }

  function pageHeader(o) {
    return (
      '<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">' +
      '<div class="min-w-0">' +
      (o.crumbs && o.crumbs.length ? '<div class="mb-2">' + breadcrumb(o.crumbs) + '</div>' : '') +
      '<h1 class="text-2xl font-bold break-words text-heading">' + esc(o.title) + '</h1>' +
      (o.subtitle ? '<p class="mt-1 text-sm break-words text-muted">' + esc(o.subtitle) + '</p>' : '') +
      '</div>' +
      (o.action ? '<div class="shrink-0">' + o.action + '</div>' : '') +
      '</div>'
    );
  }

  function switchToggle(checked, attrs) {
    return (
      '<button type="button" role="switch" aria-checked="' + !!checked + '" ' + (attrs || '') +
      ' class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ' +
      (checked ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700') +
      '"><span class="inline-block h-5 w-5 transform rounded-full bg-white shadow-theme-xs transition ' +
      (checked ? 'translate-x-5' : 'translate-x-1') +
      '"></span></button>'
    );
  }

  // ---- FilterBar — porta o React FilterBar / FilterSelect ----
  // filterSelect(o) — o: { name, label, value, options:[{value,label}] }
  function filterSelect(o) {
    const opts = o.options
      .map((op) => '<option value="' + esc(op.value) + '" ' + (String(op.value) === String(o.value) ? 'selected' : '') + '>' + esc(op.label) + '</option>')
      .join('');
    return (
      '<label class="flex items-center gap-2 text-sm text-muted">' +
      (o.label ? '<span class="whitespace-nowrap">' + esc(o.label) + '</span>' : '') +
      '<select data-filter="' + o.name + '" class="focus-ring rounded-lg border border-themed bg-transparent px-3 py-2 text-sm text-body">' +
      opts +
      '</select></label>'
    );
  }
  // filterBar(o) — o: { search:bool, searchValue, searchPlaceholder, children, action }
  function filterBar(o) {
    o = o || {};
    const search = o.search
      ? '<div class="relative w-full lg:max-w-xs"><span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">' +
        icon('search', { size: 16 }) +
        '</span><input data-filter-search value="' + esc(o.searchValue || '') + '" placeholder="' + esc(o.searchPlaceholder || '') +
        '" class="focus-ring w-full rounded-lg border border-themed bg-transparent py-2 pr-3 pl-9 text-sm text-body"/></div>'
      : '';
    return (
      '<div class="surface-card mb-5 flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-center">' +
      search +
      (o.children ? '<div class="flex flex-wrap items-center gap-3">' + o.children + '</div>' : '') +
      (o.action ? '<div class="lg:ml-auto">' + o.action + '</div>' : '') +
      '</div>'
    );
  }

  // ---- Tabs — porta o React Tabs. O clique chama window.onTabChange ----
  function tabs(items, active) {
    active = active || 0;
    const heads = items
      .map(
        (it, i) =>
          '<button type="button" role="tab" aria-selected="' + (i === active) + '" data-tab="' + i +
          '" class="-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition ' +
          (i === active
            ? 'border-brand-500 text-brand-600 dark:text-brand-400'
            : 'border-transparent text-muted hover:border-gray-300 hover:text-body dark:hover:border-gray-700') +
          '">' + (it.icon ? icon(it.icon, { size: 16 }) : '') + esc(it.label) + '</button>'
      )
      .join('');
    return (
      '<div data-tabs><div class="flex gap-1 overflow-x-auto border-b border-themed no-scrollbar" role="tablist">' + heads + '</div>' +
      '<div data-tab-panel class="pt-5 text-sm text-body" role="tabpanel">' + (items[active] ? items[active].content : '') + '</div></div>'
    );
  }

  // ---- Modal — porta o React ModalBase. Começa escondido ----
  const MODAL_SIZE = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  function modal(id, opts) {
    opts = opts || {};
    return (
      '<div id="' + id + '" class="fixed inset-0 z-[80] hidden" data-modal>' +
      '<div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" data-modal-close></div>' +
      '<div class="relative flex min-h-full items-center justify-center p-4"><div class="surface-card w-full ' +
      (MODAL_SIZE[opts.size] || MODAL_SIZE.md) +
      ' overflow-hidden rounded-2xl border shadow-theme-xl">' +
      '<header class="flex items-start justify-between gap-3 border-b border-themed px-5 py-4"><div class="min-w-0">' +
      '<h3 class="text-base font-semibold break-words text-heading" data-modal-title>' + (opts.title || '') + '</h3>' +
      '<p class="mt-0.5 text-xs break-words text-muted" data-modal-subtitle>' + (opts.subtitle || '') + '</p></div>' +
      '<button type="button" data-modal-close class="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="' + t('common.close') + '">' +
      icon('x', { size: 20 }) + '</button></header>' +
      '<div class="max-h-[70vh] overflow-y-auto px-5 py-5" data-modal-body>' + (opts.body || '') + '</div>' +
      (opts.footer
        ? '<footer class="flex flex-wrap items-center justify-end gap-2 border-t border-themed px-5 py-3" data-modal-footer>' + opts.footer + '</footer>'
        : '') +
      '</div></div></div>'
    );
  }
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }
  function closeModal(id) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (el) el.classList.add('hidden');
  }

  // ---- Drawer — porta o React Drawer (painel lateral direito) ----
  function drawer(id, opts) {
    opts = opts || {};
    return (
      '<div id="' + id + '" class="fixed inset-0 z-[70] hidden" data-drawer>' +
      '<div class="absolute inset-0 bg-gray-900/50" data-drawer-close></div>' +
      '<aside class="surface-card absolute right-0 top-0 flex h-full w-full ' + (opts.width || 'max-w-md') +
      ' flex-col border-l shadow-theme-xl" role="dialog">' +
      '<div class="flex items-start justify-between gap-3 border-b border-themed px-5 py-4"><div class="min-w-0">' +
      '<h2 class="text-lg font-semibold break-words text-heading" data-drawer-title>' + (opts.title || '') + '</h2>' +
      '<p class="mt-0.5 text-xs text-muted" data-drawer-subtitle>' + (opts.subtitle || '') + '</p></div>' +
      '<button type="button" data-drawer-close class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:text-heading" aria-label="' + t('common.close') + '">' +
      icon('x', { size: 20 }) + '</button></div>' +
      '<div class="flex-1 overflow-y-auto px-5 py-4" data-drawer-body>' + (opts.body || '') + '</div>' +
      '</aside></div>'
    );
  }
  function openDrawer(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }
  function closeDrawer(id) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (el) el.classList.add('hidden');
  }

  // ---- Pagination — porta o React Pagination. O clique chama window.onPageChange ----
  function pagination(page, totalPages) {
    if (totalPages <= 1) return '';
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
      else if (pages[pages.length - 1] !== '...') pages.push('...');
    }
    const btn =
      'flex h-10 min-w-10 items-center justify-center rounded-lg border border-themed px-3 text-sm font-medium transition disabled:opacity-40';
    return (
      '<nav class="flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">' +
      '<button type="button" data-page="' + (page - 1) + '" ' + (page <= 1 ? 'disabled' : '') +
      ' class="' + btn + ' text-muted hover:text-heading" aria-label="' + t('common.previous') + '">' +
      icon('chevron-left', { size: 16 }) + '</button>' +
      pages
        .map((p) =>
          p === '...'
            ? '<span class="px-1 text-muted">…</span>'
            : '<button type="button" data-page="' + p + '" class="' + btn + ' ' +
              (p === page ? 'border-brand-500 bg-brand-500 text-white' : 'text-body hover:text-heading') + '">' + p + '</button>'
        )
        .join('') +
      '<button type="button" data-page="' + (page + 1) + '" ' + (page >= totalPages ? 'disabled' : '') +
      ' class="' + btn + ' text-muted hover:text-heading" aria-label="' + t('common.next') + '">' +
      icon('chevron-right', { size: 16 }) + '</button></nav>'
    );
  }

  // ---- AuthShell — layout em branco de login / registro ----
  function authShell(title, subtitle, inner, footer) {
    return (
      '<div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-100 px-4 py-10 dark:from-gray-900 dark:via-gray-dark dark:to-gray-900">' +
      '<div class="absolute inset-0 -z-10 overflow-hidden"><div class="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-500/10"></div><div class="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-warning-100/60 blur-3xl dark:bg-brand-700/10"></div></div>' +
      '<div class="w-full max-w-md"><div class="mb-6 flex flex-col items-center">' +
      '<a href="index.html" class="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-theme-md">' +
      icon('clipboard-list', { size: 26 }) + '</a>' +
      '<h1 class="mt-5 text-center text-title-sm font-bold text-heading">' + title + '</h1>' +
      '<p class="mt-2 text-center text-sm text-muted">' + subtitle + '</p></div>' +
      '<div class="surface-card rounded-2xl border p-6 shadow-theme-md md:p-8">' + inner + '</div>' +
      (footer ? '<p class="mt-6 text-center text-sm text-muted">' + footer + '</p>' : '') +
      '<p class="mt-6 text-center text-xs text-muted"><a href="index.html" class="hover:text-brand-500">← ' + t('brand') + '</a></p></div></div>'
    );
  }

  // ============================================================
  // Componentes de domínio (sv)
  // ============================================================

  const CHART_PALETTE = ['#465fff', '#12b76a', '#f79009', '#f04438', '#0ba5ec', '#7592ff', '#039855', '#dc6803'];

  /** Barra de progresso do formulário público — conta só as perguntas alcançáveis. */
  function progressBar(current, total, percent, color) {
    color = color || '#465fff';
    return (
      '<div><div class="mb-2 flex items-center justify-between text-xs text-muted">' +
      '<span>' + t('fill.step', { current: current, total: total }) + '</span><span>' + percent + '%</span></div>' +
      '<div class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700" role="progressbar" aria-valuenow="' + percent +
      '" aria-valuemin="0" aria-valuemax="100">' +
      '<div class="h-full rounded-full transition-[width] duration-300" style="width:' + Math.max(4, percent) + '%;background-color:' + esc(color) + '"></div>' +
      '</div></div>'
    );
  }

  /** Barra para escolha única; barra empilhada para múltipla escolha. */
  function choiceChart(slices, opts) {
    opts = opts || {};
    const color = opts.color || '#465fff';
    const total = slices.reduce((sum, s) => sum + s.value, 0);
    if (total === 0) return '<p class="text-sm text-muted">' + t('results.noAnswers') + '</p>';

    if (opts.variant === 'stacked') {
      const positive = slices.filter((s) => s.value > 0);
      return (
        '<div><div class="flex h-4 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">' +
        positive
          .map(
            (slice, i) =>
              '<span title="' + esc(slice.label + ': ' + slice.value) + '" style="width:' + (slice.value / total) * 100 +
              '%;background-color:' + CHART_PALETTE[i % CHART_PALETTE.length] + '"></span>'
          )
          .join('') +
        '</div><ul class="mt-4 grid gap-2 sm:grid-cols-2">' +
        slices
          .map(
            (slice, i) =>
              '<li class="flex min-w-0 items-center gap-2 text-sm">' +
              '<span class="h-2.5 w-2.5 shrink-0 rounded-full" style="background-color:' + CHART_PALETTE[i % CHART_PALETTE.length] + '"></span>' +
              '<span class="min-w-0 flex-1 truncate text-body" title="' + esc(slice.label) + '">' + esc(slice.label) + '</span>' +
              '<span class="shrink-0 tabular-nums text-muted">' + slice.value + ' · ' + slice.percent + '%</span></li>'
          )
          .join('') +
        '</ul></div>'
      );
    }

    const max = Math.max.apply(null, slices.map((s) => s.value).concat([1]));
    return (
      '<ul class="flex flex-col gap-3">' +
      slices
        .map(
          (slice) =>
            '<li class="min-w-0"><div class="flex items-baseline justify-between gap-3 text-sm">' +
            '<span class="min-w-0 truncate text-body" title="' + esc(slice.label) + '">' + esc(slice.label) + '</span>' +
            '<span class="shrink-0 tabular-nums text-muted">' + slice.value + ' · ' + slice.percent + '%</span></div>' +
            '<div class="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">' +
            '<div class="h-full rounded-full" style="width:' + (slice.value / max) * 100 + '%;background-color:' + esc(color) + '"></div>' +
            '</div></li>'
        )
        .join('') +
      '</ul>'
    );
  }

  /** Média em destaque + distribuição em colunas — escala e número. */
  function scaleDistribution(scale, opts) {
    opts = opts || {};
    const color = opts.color || '#465fff';
    if (scale.total === 0) return '<p class="text-sm text-muted">' + t('results.noAnswers') + '</p>';
    const max = Math.max.apply(null, scale.distribution.map((d) => d.value).concat([1]));
    return (
      '<div><div class="flex flex-wrap items-end gap-x-8 gap-y-3">' +
      '<div><p class="text-xs text-muted">' + (opts.averageLabel || t('results.average')) + '</p>' +
      '<p class="text-title-sm font-bold text-heading">' + scale.average + '</p></div>' +
      '<div><p class="text-xs text-muted">' + t('results.range') + '</p>' +
      '<p class="text-lg font-semibold text-heading">' + scale.min + ' – ' + scale.max + '</p></div>' +
      '<div><p class="text-xs text-muted">' + t('results.answers') + '</p>' +
      '<p class="text-lg font-semibold text-heading">' + scale.total + '</p></div></div>' +
      '<div class="mt-6 flex items-end gap-1.5 sm:gap-2.5" style="height:140px">' +
      scale.distribution
        .map(
          (step) =>
            '<div class="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">' +
            '<span class="text-[11px] tabular-nums text-muted">' + step.value + '</span>' +
            '<div class="w-full rounded-t-md transition-all" style="height:' + Math.max(3, (step.value / max) * 100) +
            '%;background-color:' + esc(color) + ';opacity:' + (step.value === 0 ? 0.25 : 1) + '" title="' +
            esc(step.label + ': ' + step.value + ' (' + step.percent + '%)') + '"></div>' +
            '<span class="w-full truncate text-center text-[11px] text-muted" title="' + esc(step.label) + '">' + esc(step.label) + '</span></div>'
        )
        .join('') +
      '</div></div>'
    );
  }

  /** Medidor de promotores, neutros e detratores — o NPS é calculado, nunca gravado. */
  const NPS_RADIUS = 70;
  const NPS_CIRCUMFERENCE = Math.PI * NPS_RADIUS;
  function npsArc(value) {
    const clamped = Math.max(-100, Math.min(100, value));
    return ((clamped + 100) / 200) * NPS_CIRCUMFERENCE;
  }
  function npsGauge(nps, size) {
    const tone = nps.score >= 50 ? '#12b76a' : nps.score >= 0 ? '#f79009' : '#f04438';
    const pct = (n) => (nps.total ? Math.round((n / nps.total) * 1000) / 10 : 0);
    return (
      '<div class="flex flex-col items-center">' +
      '<svg viewBox="0 0 180 104" class="' + (size === 'sm' ? 'w-40' : 'w-56') + '" role="img" aria-label="' + t('results.nps') + '">' +
      '<path d="M20 92 A70 70 0 0 1 160 92" fill="none" stroke-width="14" stroke-linecap="round" class="stroke-gray-200 dark:stroke-gray-700"/>' +
      '<path d="M20 92 A70 70 0 0 1 160 92" fill="none" stroke="' + tone + '" stroke-width="14" stroke-linecap="round" stroke-dasharray="' +
      npsArc(nps.score) + ' ' + NPS_CIRCUMFERENCE + '"/>' +
      '<text x="90" y="80" text-anchor="middle" class="fill-current text-heading" font-size="30" font-weight="700">' + nps.score + '</text>' +
      '<text x="90" y="98" text-anchor="middle" class="fill-current text-muted" font-size="11">' + t('results.npsScore') + '</text>' +
      '</svg>' +
      '<div class="mt-3 grid w-full grid-cols-3 gap-2 text-center">' +
      '<div class="rounded-lg bg-success-50 px-2 py-2 dark:bg-success-500/10"><p class="text-sm font-bold text-success-600">' + pct(nps.promoters) + '%</p>' +
      '<p class="text-[11px] text-muted">' + t('results.promoters') + '</p></div>' +
      '<div class="rounded-lg bg-warning-50 px-2 py-2 dark:bg-warning-500/10"><p class="text-sm font-bold text-warning-600">' + pct(nps.passives) + '%</p>' +
      '<p class="text-[11px] text-muted">' + t('results.passives') + '</p></div>' +
      '<div class="rounded-lg bg-error-50 px-2 py-2 dark:bg-error-500/10"><p class="text-sm font-bold text-error-600">' + pct(nps.detractors) + '%</p>' +
      '<p class="text-[11px] text-muted">' + t('results.detractors') + '</p></div></div>' +
      '<p class="mt-3 text-center text-xs text-muted">' +
      t('results.npsFormula', { promoters: pct(nps.promoters), detractors: pct(nps.detractors) }) +
      '</p></div>'
    );
  }

  function hexToRgb(hex) {
    const clean = String(hex).replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
  }

  /** Matriz de calor: quanto mais escuro, mais respostas naquela combinação. */
  function matrixHeat(matrix, color) {
    color = color || '#465fff';
    const rgb = hexToRgb(color);
    if (matrix.total === 0) return '<p class="text-sm text-muted">' + t('results.noAnswers') + '</p>';
    const cellOf = (row, column) => matrix.cells.find((c) => c.row === row && c.column === column);
    return (
      '<div class="-mx-1 overflow-x-auto px-1"><table class="w-full min-w-[34rem] border-collapse text-sm"><thead><tr>' +
      '<th class="w-1/3 px-2 pb-2 text-left text-xs font-medium text-muted">' + t('results.matrixRow') + '</th>' +
      matrix.columns.map((c) => '<th class="px-2 pb-2 text-center text-xs font-medium text-muted">' + esc(c) + '</th>').join('') +
      '</tr></thead><tbody>' +
      matrix.rows
        .map(
          (row) =>
            '<tr><th scope="row" class="py-1.5 pr-3 text-left text-sm font-medium text-body">' +
            '<span class="block max-w-[14rem] truncate" title="' + esc(row) + '">' + esc(row) + '</span></th>' +
            matrix.columns
              .map((column) => {
                const cell = cellOf(row, column);
                const count = cell ? cell.count : 0;
                const percent = cell ? cell.percent : 0;
                const intensity = matrix.max ? count / matrix.max : 0;
                const strong = intensity > 0.55;
                return (
                  '<td class="p-1"><div class="flex h-12 flex-col items-center justify-center rounded-lg text-xs font-semibold ' +
                  (strong ? 'text-white' : 'text-body') +
                  '" style="background-color:rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', ' + (0.08 + intensity * 0.85) + ')" title="' +
                  esc(row + ' — ' + column + ': ' + count + ' (' + percent + '%)') + '">' +
                  '<span>' + count + '</span><span class="text-[10px] font-normal ' + (strong ? 'text-white/80' : 'text-muted') + '">' + percent + '%</span>' +
                  '</div></td>'
                );
              })
              .join('') +
            '</tr>'
        )
        .join('') +
      '</tbody></table></div>'
    );
  }

  /** Termos frequentes + amostras — o "gráfico" das perguntas de texto livre. */
  function termCloud(terms, samples) {
    if (terms.length === 0 && samples.length === 0) return '<p class="text-sm text-muted">' + t('results.noAnswers') + '</p>';
    const max = Math.max.apply(null, terms.map((term) => term.count).concat([1]));
    return (
      '<div>' +
      (terms.length > 0
        ? '<p class="text-xs font-medium tracking-wide text-muted uppercase">' + t('results.topTerms') + '</p>' +
          '<div class="mt-3 flex flex-wrap gap-2">' +
          terms
            .map((term) => {
              const weight = term.count / max;
              return (
                '<span class="inline-flex items-center gap-1.5 rounded-full border border-themed px-3 py-1" style="font-size:' +
                (12 + Math.round(weight * 5)) + 'px;background-color:rgba(70, 95, 255, ' + (0.06 + weight * 0.16) + ')">' +
                '<span class="text-body">' + esc(term.term) + '</span>' +
                '<span class="text-xs tabular-nums text-muted">' + term.count + '</span></span>'
              );
            })
            .join('') +
          '</div>'
        : '') +
      (samples.length > 0
        ? '<p class="mt-6 text-xs font-medium tracking-wide text-muted uppercase">' + t('results.samples') + '</p>' +
          '<ul class="mt-3 flex flex-col gap-2">' +
          samples
            .map((sample) => '<li class="rounded-xl border border-themed px-4 py-3 text-sm break-words text-body">“' + esc(sample) + '”</li>')
            .join('') +
          '</ul>'
        : '') +
      '</div>'
    );
  }

  /** Um gráfico por tipo de pergunta — o resumo escolhe o recorte certo. */
  function questionSummaryCard(summary, index, color) {
    color = color || '#465fff';
    const question = summary.question;
    let chart = '';
    switch (summary.kind) {
      case 'escolha':
        chart = choiceChart(summary.slices, { color: color });
        break;
      case 'multipla':
        chart = choiceChart(summary.slices, { variant: 'stacked', color: color });
        break;
      case 'escala':
        chart = summary.scale ? scaleDistribution(summary.scale, { color: color }) : '';
        break;
      case 'numero':
        chart = summary.scale ? scaleDistribution(summary.scale, { color: color, averageLabel: t('results.averageValue') }) : '';
        break;
      case 'nps':
        chart = summary.nps ? npsGauge(summary.nps) : '';
        break;
      case 'matriz':
        chart = summary.matrix ? matrixHeat(summary.matrix, color) : '';
        break;
      case 'data':
        chart = choiceChart(summary.slices, { color: color });
        break;
      default:
        chart = termCloud(summary.terms, summary.samples);
    }
    return (
      '<section class="surface-card rounded-2xl border p-5 shadow-theme-sm md:p-6">' +
      '<div class="flex flex-wrap items-start justify-between gap-3"><div class="flex min-w-0 items-start gap-3">' +
      '<span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white" style="background-color:' + esc(color) + '">' +
      icon(Data.QUESTION_ICON[question.type], { size: 18 }) + '</span><div class="min-w-0">' +
      '<p class="text-xs text-muted">' + t('results.questionNumber', { index: index + 1 }) + ' · ' + t('questionTypes.' + question.type) + '</p>' +
      '<h3 class="mt-0.5 text-base font-semibold break-words text-heading">' + esc(question.title || t('builder.untitledQuestion')) + '</h3>' +
      '</div></div><div class="shrink-0 text-right">' +
      '<p class="text-sm font-semibold text-heading">' + summary.answered + '</p>' +
      '<p class="text-xs text-muted">' +
      (summary.skipped === 0 ? t('results.noSkips') : t('results.skippedCount', { count: summary.skipped })) +
      '</p></div></div><div class="mt-6">' + chart + '</div></section>'
    );
  }

  function surveyCard(stats) {
    const survey = stats.survey;
    return (
      '<article class="surface-card flex flex-col overflow-hidden rounded-2xl border shadow-theme-sm transition hover:shadow-theme-md">' +
      '<a href="app-construtor.html?id=' + survey.id + '" class="relative block h-32 overflow-hidden">' +
      '<img src="' + esc(Data.svImage(survey.coverSeed, 640, 320)) + '" alt="" loading="lazy" class="h-full w-full object-cover transition duration-300 hover:scale-105"/>' +
      '<span class="absolute top-3 left-3">' + surveyStatus(survey.status) + '</span></a>' +
      '<div class="flex min-w-0 flex-1 flex-col p-5">' +
      '<h3 class="text-base font-semibold break-words text-heading">' + esc(survey.title) + '</h3>' +
      '<p class="mt-1.5 line-clamp-2 text-sm text-muted">' + esc(survey.description) + '</p>' +
      '<dl class="mt-4 grid grid-cols-3 gap-2 text-center">' +
      '<div class="min-w-0 rounded-lg bg-gray-50 px-2 py-2 dark:bg-gray-800/60"><dt class="truncate text-[11px] text-muted">' + t('forms.responses') + '</dt>' +
      '<dd class="text-sm font-semibold text-heading">' + stats.responses + '</dd></div>' +
      '<div class="min-w-0 rounded-lg bg-gray-50 px-2 py-2 dark:bg-gray-800/60"><dt class="truncate text-[11px] text-muted">' + t('forms.completion') + '</dt>' +
      '<dd class="text-sm font-semibold text-heading">' + Math.round(stats.completionRate * 100) + '%</dd></div>' +
      '<div class="min-w-0 rounded-lg bg-gray-50 px-2 py-2 dark:bg-gray-800/60"><dt class="truncate text-[11px] text-muted">' + t('forms.nps') + '</dt>' +
      '<dd class="text-sm font-semibold text-heading">' + (stats.nps === null ? '—' : stats.nps) + '</dd></div></dl>' +
      '<div class="mt-5 flex flex-wrap items-center gap-2">' +
      '<a href="app-construtor.html?id=' + survey.id + '" class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-themed px-3 text-xs font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800">' +
      icon('edit', { size: 14 }) + t('forms.edit') + '</a>' +
      '<a href="app-respostas.html?id=' + survey.id + '" class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-themed px-3 text-xs font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800">' +
      icon('chart', { size: 14 }) + t('forms.results') + '</a>' +
      (survey.status === 'publicado'
        ? '<a href="formulario.html?slug=' + encodeURIComponent(survey.slug) +
          '" class="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10">' +
          icon('external-link', { size: 14 }) + t('forms.open') + '</a>'
        : '') +
      '</div></div></article>'
    );
  }

  // templateCard(template, opts) — opts: { actionLabel, action (atributos do botão), showCover }
  function templateCard(template, opts) {
    opts = opts || {};
    const showCover = opts.showCover !== false;
    const preview = template.questions.slice(0, 4);
    return (
      '<article class="surface-card flex h-full flex-col overflow-hidden rounded-2xl border shadow-theme-sm transition hover:shadow-theme-md">' +
      (showCover
        ? '<div class="relative h-28 overflow-hidden">' +
          '<img src="' + esc(Data.svImage(template.slug, 640, 280)) + '" alt="" loading="lazy" class="h-full w-full object-cover"/>' +
          '<span class="absolute bottom-3 left-4 flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-theme-md" style="background-color:' +
          esc(template.color) + '">' + icon(template.icon, { size: 20 }) + '</span></div>'
        : '') +
      '<div class="flex min-w-0 flex-1 flex-col p-5"><div class="flex min-w-0 items-start gap-3">' +
      (!showCover
        ? '<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style="background-color:' +
          esc(template.color) + '">' + icon(template.icon, { size: 20 }) + '</span>'
        : '') +
      '<div class="min-w-0"><h3 class="text-base font-semibold break-words text-heading">' + esc(template.name) + '</h3>' +
      '<p class="mt-1 text-sm text-muted">' + esc(template.objective) + '</p></div></div>' +
      '<ul class="mt-4 flex flex-1 flex-col gap-1.5">' +
      preview
        .map(
          (question) =>
            '<li class="flex min-w-0 items-center gap-2 text-xs text-muted">' +
            icon(Data.QUESTION_ICON[question.type], { size: 13, className: 'shrink-0' }) +
            '<span class="min-w-0 truncate">' + esc(question.title) + '</span></li>'
        )
        .join('') +
      (template.questions.length > preview.length
        ? '<li class="text-xs text-muted">' + t('templates.more', { count: template.questions.length - preview.length }) + '</li>'
        : '') +
      '</ul><div class="mt-5 flex items-center justify-between gap-3">' +
      '<span class="text-xs text-muted">' + t('templates.questionCount', { count: template.questions.length }) + '</span>' +
      '<button type="button" ' + (opts.action || '') +
      ' class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 text-xs font-medium text-white transition hover:bg-brand-600">' +
      icon('plus', { size: 14 }) + esc(opts.actionLabel || '') + '</button></div></div></article>'
    );
  }

  /**
   * Marca visual de código para leitura, gerada a partir do endereço — sem
   * dependência externa. Serve de ilustração na aba Compartilhar.
   */
  const QR_MODULES = 25;
  function qrHash(str, salt) {
    let h = salt >>> 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0;
    return h;
  }
  function qrCode(value, size) {
    size = size || 160;
    const inBox = (x, y, bx, by) => x >= bx && x < bx + 7 && y >= by && y < by + 7;
    const isFinder = (x, y) => inBox(x, y, 0, 0) || inBox(x, y, QR_MODULES - 7, 0) || inBox(x, y, 0, QR_MODULES - 7);
    const local = (x, y, bx, by) => Math.max(Math.abs(x - bx - 3), Math.abs(y - by - 3)) !== 2;
    function finderFilled(x, y) {
      if (x < 7 && y < 7) return local(x, y, 0, 0);
      if (x >= QR_MODULES - 7 && y < 7) return local(x, y, QR_MODULES - 7, 0);
      if (x < 7 && y >= QR_MODULES - 7) return local(x, y, 0, QR_MODULES - 7);
      return false;
    }
    let cells = '';
    for (let y = 0; y < QR_MODULES; y++) {
      for (let x = 0; x < QR_MODULES; x++) {
        if (isFinder(x, y)) {
          if (finderFilled(x, y)) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="#101828"/>';
          continue;
        }
        if (qrHash(value, x * 131 + y * 17) % 100 < 46)
          cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="#101828"/>';
      }
    }
    return (
      '<svg viewBox="0 0 ' + QR_MODULES + ' ' + QR_MODULES + '" width="' + size + '" height="' + size +
      '" role="img" aria-label="' + esc(value) + '" class="rounded-xl bg-white p-2 shadow-theme-xs">' + cells + '</svg>'
    );
  }

  // ============================================================
  // Pergunta interativa — porta o React QuestionRenderer
  // ============================================================

  const CONTROL_BASE = 'focus-ring w-full rounded-xl border bg-transparent px-4 py-3 text-sm text-body placeholder:text-muted';

  function questionControl(question, value, o) {
    const borderClass = o.error ? 'border-error-500' : 'border-themed';
    const dis = o.preview ? 'disabled' : '';
    const color = o.color;
    const selectedList = Array.isArray(value) ? value : [];
    const matrixValue = value && typeof value === 'object' && !Array.isArray(value) ? value : {};

    const optionClass = (active) =>
      'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ' +
      (active
        ? 'border-brand-500 bg-brand-50 text-heading dark:bg-brand-500/15'
        : 'border-themed text-body hover:border-brand-300') +
      (o.preview ? ' cursor-default' : ' cursor-pointer');

    switch (question.type) {
      case 'texto-longo':
        return (
          '<textarea rows="5" ' + dis + ' data-q-input placeholder="' + esc(t('fill.placeholders.longText')) +
          '" class="' + CONTROL_BASE + ' ' + borderClass + ' resize-y">' + esc(typeof value === 'string' ? value : '') + '</textarea>'
        );

      case 'email':
        return (
          '<input type="email" inputmode="email" ' + dis + ' data-q-input value="' + esc(typeof value === 'string' ? value : '') +
          '" placeholder="voce@empresa.com" class="' + CONTROL_BASE + ' ' + borderClass + '"/>'
        );

      case 'numero':
        return (
          '<input type="number" inputmode="numeric" ' + dis + ' data-q-input data-q-number' +
          (question.min !== null ? ' min="' + question.min + '"' : '') +
          (question.max !== null ? ' max="' + question.max + '"' : '') +
          ' value="' + esc(value === undefined || value === null ? '' : String(value)) + '" placeholder="' +
          esc(
            question.min !== null && question.max !== null
              ? t('fill.placeholders.numberRange', { min: question.min, max: question.max })
              : t('fill.placeholders.number')
          ) +
          '" class="' + CONTROL_BASE + ' ' + borderClass + '"/>'
        );

      case 'data':
        return (
          '<input type="date" ' + dis + ' data-q-input value="' + esc(typeof value === 'string' ? value : '') +
          '" class="' + CONTROL_BASE + ' ' + borderClass + '"/>'
        );

      case 'escolha-unica':
        return (
          '<div class="flex flex-col gap-2">' +
          question.choices
            .map((choice) => {
              const active = value === choice.label;
              return (
                '<button type="button" ' + dis + ' data-q-choice="' + esc(choice.label) + '" class="' + optionClass(active) + '">' +
                '<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ' +
                (active ? 'border-brand-500' : 'border-gray-300 dark:border-gray-600') + '">' +
                (active ? '<span class="h-2.5 w-2.5 rounded-full" style="background-color:' + esc(color) + '"></span>' : '') +
                '</span><span class="min-w-0 flex-1 break-words">' + esc(choice.label) + '</span></button>'
              );
            })
            .join('') +
          '</div>'
        );

      case 'multipla-escolha':
        return (
          '<div class="flex flex-col gap-2">' +
          question.choices
            .map((choice) => {
              const active = selectedList.indexOf(choice.label) !== -1;
              return (
                '<button type="button" ' + dis + ' data-q-multi="' + esc(choice.label) + '" class="' + optionClass(active) + '">' +
                '<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ' +
                (active ? 'border-brand-500' : 'border-gray-300 dark:border-gray-600') + '"' +
                (active ? ' style="background-color:' + esc(color) + ';border-color:' + esc(color) + '"' : '') + '>' +
                (active ? icon('check', { size: 12, strokeWidth: 3, className: 'text-white' }) : '') +
                '</span><span class="min-w-0 flex-1 break-words">' + esc(choice.label) + '</span></button>'
              );
            })
            .join('') +
          '</div>'
        );

      case 'escala': {
        const min = question.min === null ? 1 : question.min;
        const max = question.max === null ? 5 : question.max;
        const steps = [];
        for (let s = min; s <= max; s++) steps.push(s);
        return (
          '<div><div class="flex flex-wrap gap-2">' +
          steps
            .map((step) => {
              const active = Number(value) === step;
              return (
                '<button type="button" ' + dis + ' data-q-number-choice="' + step +
                '" class="h-11 min-w-11 flex-1 rounded-xl border text-sm font-semibold transition sm:flex-none ' +
                (active ? 'text-white' : 'border-themed text-body hover:border-brand-300') + '"' +
                (active ? ' style="background-color:' + esc(color) + ';border-color:' + esc(color) + '"' : '') + '>' + step + '</button>'
              );
            })
            .join('') +
          '</div><div class="mt-2 flex justify-between text-xs text-muted">' +
          '<span>' + t('fill.scaleLow') + '</span><span>' + t('fill.scaleHigh') + '</span></div></div>'
        );
      }

      case 'nps': {
        const steps = [];
        for (let s = 0; s <= 10; s++) steps.push(s);
        return (
          '<div><div class="grid grid-cols-6 gap-1.5 sm:grid-cols-11">' +
          steps
            .map((step) => {
              const active = Number(value) === step;
              const tone = step <= 6 ? '#f04438' : step <= 8 ? '#f79009' : '#12b76a';
              return (
                '<button type="button" ' + dis + ' data-q-number-choice="' + step +
                '" class="h-11 rounded-lg border text-sm font-semibold transition ' +
                (active ? 'text-white' : 'border-themed text-body hover:border-brand-300') + '"' +
                (active ? ' style="background-color:' + tone + ';border-color:' + tone + '"' : '') + '>' + step + '</button>'
              );
            })
            .join('') +
          '</div><div class="mt-2 flex justify-between text-xs text-muted">' +
          '<span>' + t('fill.npsLow') + '</span><span>' + t('fill.npsHigh') + '</span></div></div>'
        );
      }

      case 'matriz':
        return (
          '<div class="-mx-1 overflow-x-auto px-1"><table class="w-full min-w-[32rem] border-collapse text-sm"><thead><tr>' +
          '<th class="w-1/3 px-2 pb-2 text-left text-xs font-medium text-muted"></th>' +
          question.columns.map((column) => '<th class="px-2 pb-2 text-center text-xs font-medium text-muted">' + esc(column) + '</th>').join('') +
          '</tr></thead><tbody>' +
          question.rows
            .map(
              (row) =>
                '<tr class="border-t border-themed"><th scope="row" class="py-3 pr-3 text-left text-sm font-medium text-body">' + esc(row) + '</th>' +
                question.columns
                  .map((column) => {
                    const active = matrixValue[row] === column;
                    return (
                      '<td class="px-2 py-3 text-center"><button type="button" ' + dis +
                      ' aria-label="' + esc(row + ' — ' + column) + '" data-q-matrix-row="' + esc(row) + '" data-q-matrix-col="' + esc(column) +
                      '" class="mx-auto flex h-6 w-6 items-center justify-center rounded-full border-2 transition ' +
                      (active ? 'border-brand-500' : 'border-gray-300 dark:border-gray-600') + '">' +
                      (active ? '<span class="h-3 w-3 rounded-full" style="background-color:' + esc(color) + '"></span>' : '') +
                      '</button></td>'
                    );
                  })
                  .join('') +
                '</tr>'
            )
            .join('') +
          '</tbody></table></div>'
        );

      default:
        return (
          '<input type="text" ' + dis + ' data-q-input value="' + esc(typeof value === 'string' ? value : '') +
          '" placeholder="' + esc(t('fill.placeholders.shortText')) + '" class="' + CONTROL_BASE + ' ' + borderClass + '"/>'
        );
    }
  }

  // questionRenderer(question, value, opts) — opts: { error, color, preview }
  function questionRenderer(question, value, opts) {
    opts = opts || {};
    const o = { error: opts.error || null, color: opts.color || '#465fff', preview: !!opts.preview };
    return (
      '<div class="min-w-0">' +
      '<h2 class="text-lg font-semibold break-words text-heading sm:text-xl">' +
      esc(question.title || t('builder.untitledQuestion')) +
      (question.required ? '<span class="ml-1 text-error-500">*</span>' : '') +
      '</h2>' +
      (question.help ? '<p class="mt-1.5 text-sm text-muted">' + esc(question.help) + '</p>' : '') +
      '<div class="mt-5">' + questionControl(question, value, o) + '</div>' +
      (o.error
        ? '<p class="mt-2 flex items-center gap-1.5 text-sm text-error-500">' +
          icon('alert-triangle', { size: 14 }) + t(o.error.key, o.error.params || {}) + '</p>'
        : '') +
      '</div>'
    );
  }

  /**
   * Monta a pergunta com os controles vivos. Devolve { setValue, setError,
   * getValue, render } para a página conduzir o fluxo.
   * opts: { question, value, onChange, error, color, preview }
   */
  function mountQuestion(container, opts) {
    let value = opts.value;
    let error = opts.error || null;

    function render() {
      container.innerHTML = questionRenderer(opts.question, value, {
        error: error,
        color: opts.color,
        preview: opts.preview,
      });
    }

    function change(next, rerender) {
      value = next;
      error = null;
      if (opts.onChange) opts.onChange(value);
      if (rerender) render();
    }

    if (!opts.preview) {
      container.addEventListener('click', (e) => {
        const choice = e.target.closest('[data-q-choice]');
        if (choice) return change(choice.getAttribute('data-q-choice'), true);

        const multi = e.target.closest('[data-q-multi]');
        if (multi) {
          const label = multi.getAttribute('data-q-multi');
          const list = Array.isArray(value) ? value.slice() : [];
          const at = list.indexOf(label);
          if (at === -1) list.push(label);
          else list.splice(at, 1);
          return change(list, true);
        }

        const num = e.target.closest('[data-q-number-choice]');
        if (num) return change(Number(num.getAttribute('data-q-number-choice')), true);

        const cell = e.target.closest('[data-q-matrix-row]');
        if (cell) {
          const current = value && typeof value === 'object' && !Array.isArray(value) ? Object.assign({}, value) : {};
          current[cell.getAttribute('data-q-matrix-row')] = cell.getAttribute('data-q-matrix-col');
          return change(current, true);
        }
      });

      // Campos de texto não re-renderizam: o cursor precisa continuar onde está.
      container.addEventListener('input', (e) => {
        const input = e.target.closest('[data-q-input]');
        if (!input) return;
        const raw = input.value;
        const next = input.hasAttribute('data-q-number') ? (raw === '' ? '' : Number(raw)) : raw;
        value = next;
        if (error) {
          error = null;
          input.classList.remove('border-error-500');
          input.classList.add('border-themed');
          const msg = container.querySelector('.text-error-500');
          if (msg && msg.tagName === 'P') msg.remove();
        }
        if (opts.onChange) opts.onChange(value);
      });
    }

    render();

    return {
      render: render,
      getValue: () => value,
      setValue: (v) => {
        value = v;
        render();
      },
      setError: (err) => {
        error = err;
        render();
      },
    };
  }

  // ============================================================
  // Construtor — lista arrastável, editor de pergunta e regras
  // ============================================================

  function questionListItem(question, index, total, active, conditional) {
    return (
      '<li draggable="true" data-index="' + index + '" data-id="' + esc(question.id) + '" class="group flex items-center gap-2 rounded-xl border px-3 py-2.5 transition ' +
      (active ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-themed surface-card') + '">' +
      '<span class="cursor-grab text-gray-400 active:cursor-grabbing" title="' + esc(t('builder.dragHint')) + '">' +
      icon('grip', { size: 16 }) + '</span>' +
      '<button type="button" data-select class="flex min-w-0 flex-1 items-center gap-2.5 text-left">' +
      '<span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-muted dark:bg-gray-800">' +
      icon(Data.QUESTION_ICON[question.type], { size: 14 }) + '</span>' +
      '<span class="min-w-0 flex-1"><span data-label class="block truncate text-sm font-medium text-heading">' +
      (index + 1) + '. ' + esc(question.title || t('builder.untitledQuestion')) + '</span>' +
      '<span class="flex items-center gap-1.5 text-[11px] text-muted">' + t('questionTypes.' + question.type) +
      (question.required ? '<span class="text-error-500">*</span>' : '') +
      (conditional
        ? '<span class="inline-flex items-center gap-1 text-brand-500">' + icon('git-branch', { size: 11 }) + t('builder.conditional') + '</span>'
        : '') +
      '</span></span></button>' +
      '<div class="flex shrink-0 items-center gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100">' +
      '<button type="button" data-move="-1" ' + (index === 0 ? 'disabled' : '') + ' title="' + esc(t('builder.moveUp')) +
      '" aria-label="' + esc(t('builder.moveUp')) + '" class="flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:text-heading disabled:opacity-30">' +
      icon('chevron-up', { size: 14 }) + '</button>' +
      '<button type="button" data-move="1" ' + (index === total - 1 ? 'disabled' : '') + ' title="' + esc(t('builder.moveDown')) +
      '" aria-label="' + esc(t('builder.moveDown')) + '" class="flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:text-heading disabled:opacity-30">' +
      icon('chevron-down', { size: 14 }) + '</button>' +
      '<button type="button" data-duplicate title="' + esc(t('builder.duplicateQuestion')) + '" aria-label="' + esc(t('builder.duplicateQuestion')) +
      '" class="flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:text-heading">' + icon('copy', { size: 14 }) + '</button>' +
      '<button type="button" data-remove title="' + esc(t('builder.removeQuestion')) + '" aria-label="' + esc(t('builder.removeQuestion')) +
      '" class="flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:text-error-500">' + icon('trash', { size: 14 }) + '</button>' +
      '</div></li>'
    );
  }

  /**
   * Lista arrastável de perguntas — com setas para quem não usa o mouse.
   * opts: { questions, selectedId, conditional (Set), onSelect, onMove, onRemove, onDuplicate }
   */
  function mountQuestionList(container, opts) {
    let dragIndex = null;

    function render() {
      container.innerHTML =
        '<ul class="flex flex-col gap-2">' +
        opts.questions
          .map((q, i) =>
            questionListItem(q, i, opts.questions.length, q.id === opts.selectedId, opts.conditional.has(q.id))
          )
          .join('') +
        '</ul>';
    }

    container.addEventListener('click', (e) => {
      const li = e.target.closest('li[data-index]');
      if (!li) return;
      const index = Number(li.getAttribute('data-index'));
      const id = li.getAttribute('data-id');
      if (e.target.closest('[data-select]')) return opts.onSelect && opts.onSelect(id);
      const move = e.target.closest('[data-move]');
      if (move) return opts.onMove && opts.onMove(index, index + Number(move.getAttribute('data-move')));
      if (e.target.closest('[data-duplicate]')) return opts.onDuplicate && opts.onDuplicate(id);
      if (e.target.closest('[data-remove]')) return opts.onRemove && opts.onRemove(id);
    });

    container.addEventListener('dragstart', (e) => {
      const li = e.target.closest('li[data-index]');
      if (!li) return;
      dragIndex = Number(li.getAttribute('data-index'));
      li.classList.add('opacity-50');
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    });
    container.addEventListener('dragend', () => {
      dragIndex = null;
      container.querySelectorAll('li').forEach((li) => li.classList.remove('opacity-50', 'ring-2', 'ring-brand-300'));
    });
    container.addEventListener('dragover', (e) => {
      const li = e.target.closest('li[data-index]');
      if (!li || dragIndex === null) return;
      e.preventDefault();
      container.querySelectorAll('li').forEach((el) => el.classList.remove('ring-2', 'ring-brand-300'));
      if (Number(li.getAttribute('data-index')) !== dragIndex) li.classList.add('ring-2', 'ring-brand-300');
    });
    container.addEventListener('drop', (e) => {
      const li = e.target.closest('li[data-index]');
      if (!li || dragIndex === null) return;
      e.preventDefault();
      const to = Number(li.getAttribute('data-index'));
      const from = dragIndex;
      dragIndex = null;
      if (from !== to && opts.onMove) opts.onMove(from, to);
    });

    render();
    return {
      render: render,
      update: (patch) => {
        Object.assign(opts, patch);
        render();
      },
    };
  }

  const EDITOR_LABEL = 'mb-1.5 block text-sm font-medium text-heading';
  const EDITOR_CONTROL =
    'focus-ring w-full rounded-lg border border-themed bg-transparent px-3 py-2.5 text-sm text-body placeholder:text-muted';

  function questionEditorHtml(question) {
    const listBlock = (key) =>
      '<div><p class="' + EDITOR_LABEL + '">' + t(key === 'rows' ? 'builder.fields.rows' : 'builder.fields.columns') + '</p>' +
      '<ul class="flex flex-col gap-2">' +
      question[key]
        .map(
          (item, index) =>
            '<li class="flex items-center gap-2"><input data-list="' + key + '" data-index="' + index + '" value="' + esc(item) +
            '" class="' + EDITOR_CONTROL + '"/>' +
            '<button type="button" data-list-remove="' + key + '" data-index="' + index + '" ' + (question[key].length <= 1 ? 'disabled' : '') +
            ' aria-label="' + esc(t('common.remove')) +
            '" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-themed text-muted transition hover:text-error-500 disabled:opacity-40">' +
            icon('trash', { size: 15 }) + '</button></li>'
        )
        .join('') +
      '</ul><button type="button" data-list-add="' + key + '" class="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">' +
      icon('plus', { size: 15 }) + t(key === 'rows' ? 'builder.addRow' : 'builder.addColumn') + '</button></div>';

    return (
      '<div class="flex flex-col gap-5">' +
      '<div><label class="' + EDITOR_LABEL + '" for="q-type">' + t('builder.fields.type') + '</label>' +
      '<div class="relative"><span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">' +
      icon(Data.QUESTION_ICON[question.type], { size: 16 }) + '</span>' +
      '<select id="q-type" data-field="type" class="' + EDITOR_CONTROL + ' pl-9">' +
      Data.QUESTION_TYPES.map(
        (type) => '<option value="' + type + '" ' + (type === question.type ? 'selected' : '') + '>' + t('questionTypes.' + type) + '</option>'
      ).join('') +
      '</select></div></div>' +

      '<div><label class="' + EDITOR_LABEL + '" for="q-title">' + t('builder.fields.title') + '</label>' +
      '<textarea id="q-title" rows="2" data-field="title" placeholder="' + esc(t('builder.fields.titlePlaceholder')) +
      '" class="' + EDITOR_CONTROL + ' resize-y">' + esc(question.title) + '</textarea></div>' +

      '<div><label class="' + EDITOR_LABEL + '" for="q-help">' + t('builder.fields.help') + '</label>' +
      '<input id="q-help" data-field="help" value="' + esc(question.help) + '" placeholder="' + esc(t('builder.fields.helpPlaceholder')) +
      '" class="' + EDITOR_CONTROL + '"/></div>' +

      '<div class="flex items-center justify-between rounded-xl border border-themed px-4 py-3"><div class="min-w-0 pr-3">' +
      '<p class="text-sm font-medium text-heading">' + t('builder.fields.required') + '</p>' +
      '<p class="text-xs text-muted">' + t('builder.fields.requiredHint') + '</p></div>' +
      switchToggle(question.required, 'data-field="required"') + '</div>' +

      (Data.hasChoices(question.type)
        ? '<div><p class="' + EDITOR_LABEL + '">' + t('builder.fields.options') + '</p><ul class="flex flex-col gap-2">' +
          question.choices
            .map(
              (choice) =>
                '<li class="flex items-center gap-2"><input data-choice="' + esc(choice.id) + '" value="' + esc(choice.label) +
                '" class="' + EDITOR_CONTROL + '"/>' +
                '<button type="button" data-choice-remove="' + esc(choice.id) + '" ' + (question.choices.length <= 1 ? 'disabled' : '') +
                ' aria-label="' + esc(t('common.remove')) +
                '" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-themed text-muted transition hover:text-error-500 disabled:opacity-40">' +
                icon('trash', { size: 15 }) + '</button></li>'
            )
            .join('') +
          '</ul><button type="button" data-choice-add class="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">' +
          icon('plus', { size: 15 }) + t('builder.addOption') + '</button></div>'
        : '') +

      (Data.hasRange(question.type)
        ? '<div class="grid grid-cols-2 gap-3">' +
          '<div><label class="' + EDITOR_LABEL + '" for="q-min">' + t('builder.fields.min') + '</label>' +
          '<input id="q-min" type="number" data-field="min" value="' + (question.min === null ? '' : question.min) + '" class="' + EDITOR_CONTROL + '"/></div>' +
          '<div><label class="' + EDITOR_LABEL + '" for="q-max">' + t('builder.fields.max') + '</label>' +
          '<input id="q-max" type="number" data-field="max" value="' + (question.max === null ? '' : question.max) + '" class="' + EDITOR_CONTROL + '"/></div></div>'
        : '') +

      (Data.isMatrix(question.type) ? listBlock('rows') + listBlock('columns') : '') +

      '<button type="button" data-remove-question class="inline-flex items-center justify-center gap-2 rounded-lg border border-error-200 px-4 py-2.5 text-sm font-medium text-error-600 transition hover:bg-error-50 dark:border-error-500/30 dark:hover:bg-error-500/10">' +
      icon('trash', { size: 16 }) + t('builder.removeQuestion') + '</button></div>'
    );
  }

  /**
   * Painel lateral que edita a pergunta selecionada no construtor.
   * opts: { question, onChange(patch, structural), onRemove }
   */
  function mountQuestionEditor(container, opts) {
    function render() {
      container.innerHTML = questionEditorHtml(opts.question);
    }

    const emit = (patch, structural) => opts.onChange && opts.onChange(patch, !!structural);

    container.addEventListener('click', (e) => {
      const q = opts.question;

      const toggle = e.target.closest('[data-field="required"]');
      if (toggle) {
        emit({ required: !q.required }, true);
        return;
      }
      if (e.target.closest('[data-choice-add]')) {
        const next = {
          id: q.id + '-o' + (q.choices.length + 1) + '-' + Math.random().toString(36).slice(2, 5),
          label: t('builder.newOption', { index: q.choices.length + 1 }),
        };
        emit({ choices: q.choices.concat([next]) }, true);
        return;
      }
      const rm = e.target.closest('[data-choice-remove]');
      if (rm) {
        const id = rm.getAttribute('data-choice-remove');
        emit({ choices: q.choices.filter((c) => c.id !== id) }, true);
        return;
      }
      const addList = e.target.closest('[data-list-add]');
      if (addList) {
        const key = addList.getAttribute('data-list-add');
        const patch = {};
        patch[key] = q[key].concat([t(key === 'rows' ? 'builder.newRow' : 'builder.newColumn')]);
        emit(patch, true);
        return;
      }
      const rmList = e.target.closest('[data-list-remove]');
      if (rmList) {
        const key = rmList.getAttribute('data-list-remove');
        const index = Number(rmList.getAttribute('data-index'));
        const patch = {};
        patch[key] = q[key].filter((_, i) => i !== index);
        emit(patch, true);
        return;
      }
      if (e.target.closest('[data-remove-question]')) {
        if (opts.onRemove) opts.onRemove();
      }
    });

    container.addEventListener('change', (e) => {
      const select = e.target.closest('[data-field="type"]');
      if (!select) return;
      const q = opts.question;
      const type = select.value;
      const patch = { type: type };
      if (Data.hasChoices(type) && q.choices.length === 0) {
        patch.choices = [1, 2, 3].map((n) => ({ id: q.id + '-o' + n, label: t('builder.newOption', { index: n }) }));
      }
      if (type === 'escala' && q.min === null) {
        patch.min = 1;
        patch.max = 5;
      }
      if (type === 'numero' && q.min === null) {
        patch.min = 0;
        patch.max = 100;
      }
      if (Data.isMatrix(type) && q.rows.length === 0) {
        patch.rows = [t('builder.newRow')];
        patch.columns = [t('builder.newColumn')];
      }
      emit(patch, true);
    });

    // Texto digitado não re-renderiza o painel — o cursor fica onde está.
    container.addEventListener('input', (e) => {
      const q = opts.question;
      const field = e.target.closest('[data-field]');
      if (field) {
        const name = field.getAttribute('data-field');
        if (name === 'title' || name === 'help') return emit({ [name]: field.value });
        if (name === 'min' || name === 'max') {
          const patch = {};
          patch[name] = field.value === '' ? null : Number(field.value);
          return emit(patch);
        }
        return;
      }
      const choice = e.target.closest('[data-choice]');
      if (choice) {
        const id = choice.getAttribute('data-choice');
        return emit({ choices: q.choices.map((c) => (c.id === id ? Object.assign({}, c, { label: choice.value }) : c)) });
      }
      const item = e.target.closest('[data-list]');
      if (item) {
        const key = item.getAttribute('data-list');
        const index = Number(item.getAttribute('data-index'));
        const patch = {};
        patch[key] = q[key].map((v, i) => (i === index ? item.value : v));
        return emit(patch);
      }
    });

    render();
    return {
      render: render,
      update: (question) => {
        opts.question = question;
        render();
      },
    };
  }

  const RULE_CONTROL = 'focus-ring w-full rounded-lg border border-themed bg-transparent px-3 py-2 text-sm text-body';
  const RULE_OPERATORS = ['igual', 'diferente', 'maior', 'menor', 'contem'];
  const RULE_ACTIONS = ['pular-para', 'mostrar', 'esconder'];

  /** Uma regra: "se a resposta de X for Y, então ação sobre Z". */
  function logicRuleRow(rule, questions) {
    const source = questions.find((q) => q.id === rule.questionId);
    const numeric = source ? ['escala', 'nps', 'numero'].indexOf(source.type) !== -1 : false;
    const questionOptions = (selected) =>
      questions
        .map(
          (q, i) =>
            '<option value="' + esc(q.id) + '" ' + (q.id === selected ? 'selected' : '') + '>' +
            (i + 1) + '. ' + esc(q.title || t('builder.untitledQuestion')) + '</option>'
        )
        .join('');

    const valueField =
      source && source.choices.length > 0 && (rule.operator === 'igual' || rule.operator === 'diferente')
        ? '<select data-rule-field="value" class="' + RULE_CONTROL + '"><option value="">' + t('logic.choose') + '</option>' +
          source.choices
            .map((c) => '<option value="' + esc(c.label) + '" ' + (c.label === rule.value ? 'selected' : '') + '>' + esc(c.label) + '</option>')
            .join('') +
          '</select>'
        : '<input type="' + (numeric ? 'number' : 'text') + '" data-rule-field="value" value="' + esc(rule.value) +
          '" placeholder="' + esc(t('logic.valuePlaceholder')) + '" class="' + RULE_CONTROL + '"/>';

    return (
      '<li class="surface-card rounded-xl border p-4" data-rule="' + esc(rule.id) + '"><div class="grid gap-3 lg:grid-cols-12">' +
      '<div class="lg:col-span-4"><label class="mb-1 block text-xs font-medium text-muted">' + t('logic.ifAnswer') + '</label>' +
      '<select data-rule-field="questionId" class="' + RULE_CONTROL + '">' + questionOptions(rule.questionId) + '</select></div>' +
      '<div class="lg:col-span-2"><label class="mb-1 block text-xs font-medium text-muted">' + t('logic.operator') + '</label>' +
      '<select data-rule-field="operator" class="' + RULE_CONTROL + '">' +
      RULE_OPERATORS.map(
        (op) => '<option value="' + op + '" ' + (op === rule.operator ? 'selected' : '') + '>' + t('logic.operators.' + op) + '</option>'
      ).join('') +
      '</select></div>' +
      '<div class="lg:col-span-2"><label class="mb-1 block text-xs font-medium text-muted">' + t('logic.value') + '</label>' + valueField + '</div>' +
      '<div class="lg:col-span-2"><label class="mb-1 block text-xs font-medium text-muted">' + t('logic.action') + '</label>' +
      '<select data-rule-field="action" class="' + RULE_CONTROL + '">' +
      RULE_ACTIONS.map(
        (action) => '<option value="' + action + '" ' + (action === rule.action ? 'selected' : '') + '>' + t('logic.actions.' + action) + '</option>'
      ).join('') +
      '</select></div>' +
      '<div class="flex items-end gap-2 lg:col-span-2"><div class="min-w-0 flex-1">' +
      '<label class="mb-1 block text-xs font-medium text-muted">' + t('logic.target') + '</label>' +
      '<select data-rule-field="targetId" class="' + RULE_CONTROL + '">' + questionOptions(rule.targetId) + '</select></div>' +
      '<button type="button" data-rule-remove aria-label="' + esc(t('logic.removeRule')) + '" title="' + esc(t('logic.removeRule')) +
      '" class="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-themed text-muted transition hover:text-error-500">' +
      icon('trash', { size: 15 }) + '</button></div></div>' +
      '<p class="mt-3 flex items-start gap-2 text-xs text-muted">' +
      icon('git-branch', { size: 14, className: 'mt-0.5 shrink-0' }) +
      '<span class="min-w-0">' +
      esc(
        t('logic.sentence', {
          question: (source && source.title) || t('builder.untitledQuestion'),
          operator: t('logic.operators.' + rule.operator).toLowerCase(),
          value: rule.value || '—',
          action: t('logic.actions.' + rule.action).toLowerCase(),
          target: (questions.find((q) => q.id === rule.targetId) || {}).title || t('builder.untitledQuestion'),
        })
      ) +
      '</span></p></li>'
    );
  }

  /** opts: { rules, questions, onChange(ruleId, patch), onRemove(ruleId) } */
  function mountLogicRules(container, opts) {
    function render() {
      container.innerHTML =
        '<ul class="flex flex-col gap-3">' + opts.rules.map((rule) => logicRuleRow(rule, opts.questions)).join('') + '</ul>';
    }

    container.addEventListener('change', (e) => {
      const field = e.target.closest('[data-rule-field]');
      if (!field) return;
      const li = field.closest('[data-rule]');
      const id = li.getAttribute('data-rule');
      const name = field.getAttribute('data-rule-field');
      const patch = {};
      patch[name] = field.value;
      // Trocar a pergunta observada zera o valor comparado, como no React.
      if (name === 'questionId') patch.value = '';
      if (opts.onChange) opts.onChange(id, patch);
    });

    container.addEventListener('click', (e) => {
      const remove = e.target.closest('[data-rule-remove]');
      if (!remove) return;
      const id = remove.closest('[data-rule]').getAttribute('data-rule');
      if (opts.onRemove) opts.onRemove(id);
    });

    render();
    return {
      render: render,
      update: (patch) => {
        Object.assign(opts, patch);
        render();
      },
    };
  }

  /** Link público, código de leitura e trecho para incorporar. */
  function shareBox(survey) {
    const link = publicLink(survey.slug);
    const embed = '<iframe src="' + link + '" width="100%" height="640" frameborder="0" title="' + survey.title + '"></iframe>';
    const box = 'surface-card rounded-2xl border p-5 md:p-6';
    return (
      '<div class="grid gap-5 lg:grid-cols-3" data-share>' +
      '<div class="' + box + ' min-w-0 lg:col-span-2">' +
      '<h3 class="text-base font-semibold text-heading">' + t('share.linkTitle') + '</h3>' +
      '<p class="mt-1 text-sm text-muted">' + t('share.linkDesc') + '</p>' +
      '<div class="mt-4 flex flex-col gap-2 sm:flex-row">' +
      '<input readonly value="' + esc(link) + '" data-share-link aria-label="' + esc(t('share.linkTitle')) +
      '" class="focus-ring min-w-0 flex-1 rounded-lg border border-themed bg-gray-50 px-3.5 py-2.5 text-sm text-body dark:bg-gray-900/40"/>' +
      '<button type="button" data-copy="link" class="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600">' +
      icon('copy', { size: 16 }) + '<span>' + t('common.copy') + '</span></button></div>' +
      '<h3 class="mt-8 text-base font-semibold text-heading">' + t('share.embedTitle') + '</h3>' +
      '<p class="mt-1 text-sm text-muted">' + t('share.embedDesc') + '</p>' +
      '<textarea readonly rows="3" data-share-embed aria-label="' + esc(t('share.embedTitle')) +
      '" class="focus-ring mt-4 w-full resize-none rounded-lg border border-themed bg-gray-50 px-3.5 py-2.5 font-mono text-xs text-body dark:bg-gray-900/40">' +
      esc(embed) + '</textarea>' +
      '<button type="button" data-copy="embed" class="mt-3 inline-flex h-10 items-center gap-2 rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800">' +
      icon('code', { size: 16 }) + '<span>' + t('share.copyEmbed') + '</span></button></div>' +
      '<div class="' + box + ' flex min-w-0 flex-col items-center text-center">' +
      '<h3 class="text-base font-semibold text-heading">' + t('share.qrTitle') + '</h3>' +
      '<p class="mt-1 text-sm text-muted">' + t('share.qrDesc') + '</p>' +
      '<div class="mt-5">' + qrCode(link) + '</div>' +
      '<a href="' + esc(link) + '" target="_blank" rel="noreferrer" class="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800">' +
      icon('external-link', { size: 16 }) + t('share.openForm') + '</a></div></div>'
    );
  }

  function bindShareBox(root) {
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-copy]');
      if (!btn) return;
      const which = btn.getAttribute('data-copy');
      const source = root.querySelector(which === 'link' ? '[data-share-link]' : '[data-share-embed]');
      if (!source) return;
      copyText(source.value).then(() => {
        const label = btn.querySelector('span');
        if (label) label.textContent = t('share.copiedShort');
        notify(t('share.copied'), 'success');
        setTimeout(() => {
          if (label) label.textContent = which === 'link' ? t('common.copy') : t('share.copyEmbed');
        }, 2000);
      });
    });
  }

  /** Copia para a área de transferência com recuo quando o navegador barra. */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    }
    return Promise.resolve(fallbackCopy(text));
  }
  function fallbackCopy(text) {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    } catch (_) {}
  }

  /** Resposta completa, pergunta a pergunta, com o que foi pulado marcado. */
  function responseDetail(survey, response, contacts) {
    const contact = Query.contactById(contacts, response.contactId);
    const map = Query.answersToMap(response.answers);
    return (
      '<div class="flex flex-col gap-5"><div class="flex flex-wrap items-center gap-2">' +
      sourceBadge(response.source) +
      badge(t(response.completed ? 'results.completed' : 'results.partial'), response.completed ? 'success' : 'warning', { dot: true }) +
      badge(Query.formatSeconds(response.durationSec), 'gray', { icon: 'clock' }) +
      '</div>' +
      (contact
        ? '<div class="flex items-center gap-3 rounded-xl border border-themed p-3">' +
          avatar({ src: contact.avatar, name: contact.name, size: 'sm' }) +
          '<div class="min-w-0"><p class="truncate text-sm font-medium text-heading">' + esc(contact.name) + '</p>' +
          '<p class="truncate text-xs text-muted">' + esc(contact.email) + '</p></div></div>'
        : '') +
      '<ol class="flex flex-col gap-4">' +
      Query.ordered(survey.questions)
        .map((question, index) => {
          const value = map[question.id];
          const hidden = Query.isHiddenQuestion(survey, question.id, map);
          let body;
          if (value !== undefined) {
            if (question.type === 'matriz' && typeof value === 'object' && !Array.isArray(value)) {
              body =
                '<ul class="mt-2 flex flex-col gap-1">' +
                Object.keys(value)
                  .map(
                    (row) =>
                      '<li class="flex flex-wrap items-center gap-2 text-sm"><span class="text-muted">' + esc(row) +
                      ':</span><span class="font-medium text-body">' + esc(value[row]) + '</span></li>'
                  )
                  .join('') +
                '</ul>';
            } else {
              body = '<p class="mt-2 text-sm break-words text-body">' + esc(Query.answerToText(value)) + '</p>';
            }
          } else {
            body =
              '<p class="mt-2 flex items-center gap-1.5 text-sm text-muted">' +
              icon(hidden ? 'git-branch' : 'minus', { size: 14 }) +
              t(hidden ? 'results.hiddenByLogic' : 'results.skipped') + '</p>';
          }
          return (
            '<li class="min-w-0 border-b border-themed pb-4 last:border-0 last:pb-0">' +
            '<p class="text-xs text-muted">' + t('results.questionNumber', { index: index + 1 }) + ' · ' + t('questionTypes.' + question.type) + '</p>' +
            '<p class="mt-0.5 text-sm font-medium break-words text-heading">' + esc(question.title) + '</p>' +
            body +
            '</li>'
          );
        })
        .join('') +
      '</ol></div>'
    );
  }

  // ============================================================
  // Chrome público: navbar + rodapé
  // ============================================================
  function renderPublicNavbar() {
    const dark = UIState.get().darkMode;
    const isAuth = Auth.isAuthenticated();
    const here = window.location.pathname.split('/').pop() || 'index.html';

    const LINKS = [
      { href: 'index.html', label: t('nav.home') },
      { href: 'modelos.html', label: t('nav.templates') },
      { href: 'contato.html', label: t('nav.contact') },
    ];

    const linkCls = (active) =>
      'rounded-lg px-3 py-2 text-sm font-medium transition ' +
      (active ? 'text-brand-600 dark:text-brand-400' : 'text-body hover:text-heading');

    const links = LINKS.map((l) => '<a href="' + l.href + '" class="' + linkCls(here === l.href) + '">' + l.label + '</a>').join('');
    const mobileLinks = LINKS.map(
      (l) =>
        '<a href="' + l.href + '" class="rounded-lg px-3 py-2.5 text-sm font-medium text-body hover:bg-gray-50 dark:hover:bg-gray-800">' +
        l.label + '</a>'
    ).join('');

    const account = isAuth
      ? '<a href="app.html" class="hidden h-10 items-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 sm:flex">' +
        t('nav.dashboard') + '</a>'
      : '<a href="login.html" class="hidden h-10 items-center rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800 sm:flex">' +
        t('nav.login') + '</a>' +
        '<a href="registro.html" class="hidden h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 sm:flex">' +
        icon('plus', { size: 16 }) + t('nav.createForm') + '</a>';

    return (
      '<div class="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">' +
      '<a href="index.html" class="flex min-w-0 items-center gap-2.5"><span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-theme-md">' +
      icon('clipboard-list', { size: 18 }) + '</span><span class="truncate text-lg font-bold text-heading">' + t('brand') + '</span></a>' +
      '<nav class="ml-6 hidden items-center gap-1 lg:flex">' + links + '</nav>' +
      '<div class="ml-auto flex items-center gap-1 sm:gap-2">' +
      '<button type="button" data-action="toggle-dark" aria-label="' + t('common.theme') +
      '" class="flex h-10 w-10 items-center justify-center rounded-full border border-themed text-body transition hover:bg-gray-50 dark:hover:bg-gray-800">' +
      icon(dark ? 'sun' : 'moon', { size: 18 }) + '</button>' +
      langDropdown('tx-lang') +
      account +
      '<button type="button" data-action="toggle-mobile-menu" class="flex h-10 w-10 items-center justify-center rounded-lg text-body lg:hidden" aria-label="Menu">' +
      icon('menu', { size: 22 }) + '</button>' +
      '</div></div>' +
      '<div id="tx-mobile-menu" class="surface-card border-t border-themed lg:hidden hidden"><nav class="flex flex-col gap-1 px-4 py-4 sm:px-6">' +
      mobileLinks +
      '<div class="mt-2 flex flex-col gap-2 border-t border-themed pt-3">' +
      (isAuth
        ? '<a href="app.html" class="flex h-11 items-center justify-center rounded-lg bg-brand-500 text-sm font-medium text-white">' + t('nav.dashboard') + '</a>'
        : '<a href="login.html" class="flex h-11 items-center justify-center rounded-lg border border-themed text-sm font-medium text-body">' + t('nav.login') + '</a>' +
          '<a href="registro.html" class="flex h-11 items-center justify-center rounded-lg bg-brand-500 text-sm font-medium text-white">' + t('nav.createForm') + '</a>') +
      '</div></nav></div>'
    );
  }

  function renderPublicFooter() {
    const year = new Date().getFullYear();
    const published = SV.get().surveys.filter((s) => s.status === 'publicado').slice(0, 3);

    const links =
      '<a href="index.html" class="text-muted transition hover:text-brand-600">' + t('nav.home') + '</a>' +
      '<a href="modelos.html" class="text-muted transition hover:text-brand-600">' + t('nav.templates') + '</a>' +
      published
        .map(
          (survey) =>
            '<a href="formulario.html?slug=' + encodeURIComponent(survey.slug) +
            '" class="max-w-[16rem] truncate text-muted transition hover:text-brand-600">' + esc(survey.title) + '</a>'
        )
        .join('') +
      '<a href="contato.html" class="text-muted transition hover:text-brand-600">' + t('nav.contact') + '</a>';

    const social = ['github', 'slack', 'globe']
      .map(
        (ic) =>
          '<a href="#" aria-label="' + ic + '" class="flex h-9 w-9 items-center justify-center rounded-full border border-themed text-muted transition hover:text-brand-500">' +
          icon(ic, { size: 16 }) + '</a>'
      )
      .join('');

    return (
      '<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">' +
      '<div class="flex flex-col items-start justify-between gap-8 lg:flex-row">' +
      '<div class="max-w-sm"><a href="index.html" class="flex items-center gap-2.5"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">' +
      icon('clipboard-list', { size: 18 }) + '</span><span class="text-lg font-bold text-heading">' + t('brand') + '</span></a>' +
      '<p class="mt-4 text-sm text-muted">' + t('landing.footer.tagline') + '</p></div>' +
      '<div class="flex min-w-0 flex-wrap gap-x-10 gap-y-2 text-sm">' + links + '</div></div>' +
      '<div class="mt-10 flex flex-col items-center justify-between gap-4 border-t border-themed pt-6 sm:flex-row">' +
      '<p class="text-xs text-muted">© ' + year + ' ' + t('brand') + '. ' + t('landing.footer.rights') + '</p>' +
      '<div class="flex items-center gap-3">' + social + '</div></div></div>'
    );
  }

  // ============================================================
  // Chrome da área logada: sidebar / topbar / rodapé
  // ============================================================
  const APP_SECTIONS = [
    {
      titleKey: 'appNav.researchSection',
      items: [
        { href: 'app.html', labelKey: 'appNav.dashboard', icon: 'dashboard' },
        { href: 'app-formularios.html', labelKey: 'appNav.forms', icon: 'clipboard-list' },
        { href: 'app-modelos.html', labelKey: 'appNav.templates', icon: 'layers' },
      ],
    },
    {
      titleKey: 'appNav.audienceSection',
      items: [{ href: 'app-contatos.html', labelKey: 'appNav.contacts', icon: 'users' }],
    },
    {
      titleKey: 'appNav.settingsSection',
      items: [{ href: 'app-configuracoes.html', labelKey: 'appNav.settings', icon: 'settings' }],
    },
  ];

  function renderSidebar() {
    const collapsed = UIState.get().sidebarCollapsed;
    let here = window.location.pathname.split('/').pop() || 'app.html';
    if (here === 'app-construtor.html' || here === 'app-respostas.html') here = 'app-formularios.html';

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const week = SV.get().responses.filter((r) => new Date(r.at) >= weekAgo).length;

    const navCls = (active) =>
      'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ' +
      (collapsed ? 'justify-center ' : '') +
      (active ? 'is-sidebar-active' : 'is-sidebar-inactive');

    const sections = APP_SECTIONS.map(
      (section) =>
        '<nav>' +
        (collapsed ? '' : '<h3 class="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider">' + t(section.titleKey) + '</h3>') +
        '<ul class="flex flex-col gap-1">' +
        section.items
          .map(
            (item) =>
              '<li><a href="' + item.href + '" class="' + navCls(item.href === here) + '" ' +
              (collapsed ? 'title="' + esc(t(item.labelKey)) + '"' : '') + '>' +
              icon(item.icon, { size: 20 }) +
              (collapsed ? '' : '<span class="min-w-0 flex-1 truncate">' + t(item.labelKey) + '</span>') +
              '</a></li>'
          )
          .join('') +
        '</ul></nav>'
    ).join('');

    return (
      '<div class="flex items-center pt-7 pb-6 ' + (collapsed ? 'justify-center' : 'justify-between') + '">' +
      '<a href="app.html" class="flex min-w-0 items-center gap-2.5"><span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white shadow-theme-sm">' +
      icon('clipboard-list', { size: 18 }) + '</span>' +
      (collapsed ? '' : '<span data-brand-text class="truncate text-lg font-semibold">' + t('brand') + '</span>') + '</a>' +
      (collapsed
        ? ''
        : '<button type="button" data-action="toggle-sidebar" class="is-sidebar-inactive hidden h-8 w-8 items-center justify-center rounded-lg border border-themed lg:flex" title="' +
          esc(t('appNav.collapse')) + '">' + icon('chevron-right', { size: 14, className: 'rotate-180' }) + '</button>') +
      '</div>' +
      '<div class="flex flex-col gap-5 overflow-y-auto no-scrollbar pb-4">' + sections + '</div>' +
      '<div class="mt-auto space-y-3 border-t border-themed py-4">' +
      (collapsed
        ? ''
        : '<div class="rounded-xl bg-brand-50 p-4 dark:bg-brand-500/10"><p class="text-xs font-medium text-muted">' + t('appNav.weekTitle') + '</p>' +
          '<p class="mt-0.5 text-sm font-semibold text-heading">' + t('appNav.weekDesc', { count: week }) + '</p>' +
          '<a href="app-formularios.html" class="mt-3 flex h-9 w-full items-center justify-center rounded-lg bg-brand-500 text-xs font-medium text-white transition hover:bg-brand-600">' +
          t('appNav.openForms') + '</a></div>') +
      '<button type="button" data-action="logout" class="' + navCls(false) + ' w-full" ' +
      (collapsed ? 'title="' + esc(t('appNav.logout')) + '"' : '') + '>' +
      icon('logout', { size: 20 }) + (collapsed ? '' : '<span>' + t('appNav.logout') + '</span>') + '</button>' +
      '</div>'
    );
  }

  function relativeTime(iso) {
    const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 60) return t('time.minutes', { count: Math.max(1, diff) });
    if (diff < 60 * 24) return t('time.hours', { count: Math.round(diff / 60) });
    return t('time.days', { count: Math.round(diff / (60 * 24)) });
  }

  function renderTopbar() {
    const dark = UIState.get().darkMode;
    const user = Auth.getUser();
    const st = SV.get();
    const notifications = Query.latestResponses(st.responses, 4).map((r) => {
      const survey = Query.surveyById(st.surveys, r.surveyId);
      return { id: r.id, title: survey ? survey.title : '', at: r.at, completed: r.completed };
    });

    const notifs = notifications
      .map(
        (n) =>
          '<li class="flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800">' +
          '<span class="mt-1 flex h-2 w-2 shrink-0 rounded-full ' + (n.completed ? 'bg-success-500' : 'bg-warning-500') + '"></span>' +
          '<div class="min-w-0 flex-1"><p class="truncate text-sm font-medium text-heading">' +
          esc(t(n.completed ? 'notifications.newResponse' : 'notifications.partial', { name: n.title })) + '</p>' +
          '<p class="text-xs text-muted">' + relativeTime(n.at) + '</p></div></li>'
      )
      .join('');

    return (
      '<div class="flex flex-grow items-center justify-between gap-4 px-4 py-3 md:px-6 2xl:px-10">' +
      '<div class="flex items-center gap-3">' +
      '<button type="button" data-action="toggle-sidebar-responsive" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-themed text-muted hover:bg-gray-50 dark:hover:bg-gray-800" aria-label="' +
      esc(t('appNav.collapse')) + '">' + icon('menu', { size: 20 }) + '</button>' +
      '<a href="app-formularios.html?novo=1" class="hidden h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 sm:flex">' +
      icon('plus', { size: 18 }) + t('forms.new') + '</a></div>' +
      '<div class="flex items-center gap-2">' +
      '<a href="app-modelos.html" class="hidden h-10 items-center gap-2 rounded-lg border border-themed px-4 text-sm text-muted transition hover:bg-gray-50 md:flex dark:hover:bg-gray-800">' +
      icon('layers', { size: 16 }) + t('appNav.templates') + '</a>' +
      langDropdown('tx-app-lang') +
      '<button type="button" data-action="toggle-dark" class="flex h-10 w-10 items-center justify-center rounded-full border border-themed text-muted hover:bg-gray-50 dark:hover:bg-gray-800" aria-label="' +
      t('common.theme') + '">' + icon(dark ? 'sun' : 'moon', { size: 18 }) + '</button>' +
      '<div class="relative" id="tx-notif"><button type="button" data-action="toggle-menu" data-menu="#tx-notif-menu" class="relative flex h-10 w-10 items-center justify-center rounded-full border border-themed text-muted hover:bg-gray-50 dark:hover:bg-gray-800" aria-label="' +
      t('appNav.notifications') + '">' + icon('bell', { size: 18 }) +
      (notifications.length > 0
        ? '<span class="absolute top-1.5 right-1.5 flex h-2 w-2"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-error-400 opacity-75"></span><span class="relative inline-flex h-2 w-2 rounded-full bg-error-500"></span></span>'
        : '') +
      '</button>' +
      '<div id="tx-notif-menu" class="surface-card absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-xl border shadow-theme-lg hidden z-50">' +
      '<div class="flex items-center justify-between border-b border-themed px-4 py-3"><p class="text-sm font-semibold text-heading">' +
      t('appNav.notifications') + '</p></div><ul class="max-h-72 divide-y divide-[color:var(--tx-border)] overflow-y-auto">' + notifs + '</ul></div></div>' +
      '<div class="relative" id="tx-profile"><button type="button" data-action="toggle-menu" data-menu="#tx-profile-menu" class="ml-1 flex items-center gap-3">' +
      '<span class="hidden text-right lg:block"><span class="block text-sm font-medium text-heading">' + esc((user && user.name) || t('common.guest')) + '</span>' +
      '<span class="block text-xs text-muted">' + esc((user && user.role) || '—') + '</span></span>' +
      avatar((user && user.name) || '?', 'md') + icon('chevron-down', { size: 16, className: 'text-muted' }) + '</button>' +
      '<div id="tx-profile-menu" class="surface-card absolute right-0 mt-3 w-56 rounded-xl border shadow-theme-lg hidden z-50">' +
      '<div class="border-b border-themed px-4 py-3"><p class="truncate text-sm font-medium text-heading">' + esc((user && user.name) || t('common.guest')) + '</p>' +
      '<p class="truncate text-xs text-muted">' + esc((user && user.email) || '') + '</p></div>' +
      '<ul class="py-1"><li><a href="app-configuracoes.html" class="flex items-center gap-2 px-4 py-2 text-sm text-body hover:bg-gray-50 dark:hover:bg-gray-800">' +
      icon('settings', { size: 16 }) + ' ' + t('appNav.settings') + '</a></li>' +
      '<li><a href="index.html" class="flex items-center gap-2 px-4 py-2 text-sm text-body hover:bg-gray-50 dark:hover:bg-gray-800">' +
      icon('globe', { size: 16 }) + ' ' + t('appNav.viewSite') + '</a></li></ul>' +
      '<div class="border-t border-themed py-1"><button type="button" data-action="logout" class="flex w-full items-center gap-2 px-4 py-2 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10">' +
      icon('logout', { size: 16 }) + ' ' + t('appNav.logout') + '</button></div></div></div>' +
      '</div></div>'
    );
  }

  function renderAppFooter() {
    const year = new Date().getFullYear();
    return (
      '<div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">' +
      '<p class="text-xs text-muted">© ' + year + ' ' + t('brand') + '. ' + t('landing.footer.rights') + '</p>' +
      '<div class="flex items-center gap-4 text-xs text-muted"><a href="#" class="hover:text-brand-500">' + t('landing.footer.docs') + '</a>' +
      '<a href="#" class="hover:text-brand-500">' + t('landing.footer.help') + '</a>' +
      '<a href="#" class="hover:text-brand-500">' + t('landing.footer.privacy') + '</a></div></div>'
    );
  }

  // ============================================================
  // Banner de cookies + toasts
  // ============================================================
  function renderCookieBanner() {
    const ui = UIState.get();
    if (!ui.showCookieBanner) return '';
    return (
      '<div class="fixed inset-x-0 bottom-0 z-[60] p-4"><div class="surface-card mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border p-5 shadow-theme-xl sm:flex-row sm:items-center">' +
      '<span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15">' +
      icon('cookie', { size: 22 }) + '</span>' +
      '<div class="flex-1"><p class="text-sm font-semibold text-heading">' + t('cookie.title') + '</p>' +
      '<p class="mt-0.5 text-xs text-muted">' + t('cookie.desc') +
      ' <a href="#" class="font-medium text-brand-500 hover:text-brand-600">' + t('cookie.policy') + '</a></p></div>' +
      '<div class="flex shrink-0 items-center gap-2">' +
      '<button type="button" data-action="decline-cookies" class="focus-ring rounded-lg border border-themed px-4 py-2 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800">' +
      t('cookie.decline') + '</button>' +
      '<button type="button" data-action="accept-cookies" class="focus-ring rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600">' +
      t('cookie.accept') + '</button>' +
      '</div></div></div>'
    );
  }
  function updateCookieBanner() {
    const el = document.getElementById('tx-cookie');
    if (el) el.innerHTML = renderCookieBanner();
  }

  const TOAST_STYLES = {
    success: { border: 'border-success-200 dark:border-success-500/30', icon: 'check', color: 'text-success-500' },
    error: { border: 'border-error-200 dark:border-error-500/30', icon: 'x', color: 'text-error-500' },
    warning: { border: 'border-warning-200 dark:border-warning-500/30', icon: 'bell', color: 'text-warning-500' },
    info: { border: 'border-blue-light-200 dark:border-blue-light-500/30', icon: 'bell', color: 'text-blue-light-500' },
  };
  function notify(message, type, duration) {
    type = type || 'info';
    duration = duration || 4000;
    const s = TOAST_STYLES[type] || TOAST_STYLES.info;
    const stack = document.getElementById('tx-toast-stack');
    if (!stack) {
      console.log('[notify]', message);
      return;
    }
    const el = document.createElement('div');
    el.className =
      'pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-lg border bg-white p-4 shadow-theme-md dark:bg-gray-dark ' +
      s.border;
    el.innerHTML =
      '<span class="' + s.color + '">' + icon(s.icon, { size: 20 }) + '</span>' +
      '<div class="min-w-0 flex-1"><p class="text-sm font-medium break-words text-heading">' + esc(message) + '</p></div>' +
      '<button type="button" class="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">' + icon('x', { size: 16 }) + '</button>';
    el.querySelector('button').addEventListener('click', () => el.remove());
    stack.appendChild(el);
    setTimeout(() => el.remove(), duration);
  }

  // ============================================================
  // Atualização do DOM
  // ============================================================
  function updateNavbar() {
    const el = document.getElementById('tx-navbar');
    if (el) el.innerHTML = renderPublicNavbar();
  }
  function updateFooter() {
    const el = document.getElementById('tx-footer');
    if (el) el.innerHTML = renderPublicFooter();
  }
  function updateSidebar() {
    const el = document.getElementById('tx-sidebar');
    if (!el) return;
    el.style.width = UIState.get().sidebarCollapsed ? '90px' : '280px';
    el.innerHTML = renderSidebar();
  }
  function updateTopbar() {
    const el = document.getElementById('tx-topbar');
    if (el) el.innerHTML = renderTopbar();
  }
  function updateAppFooter() {
    const el = document.getElementById('tx-app-footer');
    if (el) el.innerHTML = renderAppFooter();
  }
  function updateSidebarMobile() {
    const el = document.getElementById('tx-sidebar');
    const overlay = document.getElementById('tx-sidebar-overlay');
    if (!el) return;
    const open = UIState.get().sidebarMobileOpen;
    el.classList.toggle('translate-x-0', open);
    el.classList.toggle('-translate-x-full', !open);
    if (overlay) overlay.classList.toggle('hidden', !open);
  }

  // Navbar pública: fundo sólido só depois de rolar (espelha o React).
  function bindNavbarScroll() {
    const header = document.getElementById('tx-navbar');
    if (!header) return;
    const onScroll = () => {
      const scrolled = window.scrollY > 8;
      header.classList.toggle('surface-header', scrolled);
      header.classList.toggle('border-themed', scrolled);
      header.classList.toggle('backdrop-blur', scrolled);
      header.classList.toggle('border-transparent', !scrolled);
      header.classList.toggle('bg-transparent', !scrolled);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ============================================================
  // Delegação de eventos
  // ============================================================
  function closeAllMenus(except) {
    document.querySelectorAll('[id$="-menu"]').forEach((m) => {
      if (m !== except) m.classList.add('hidden');
    });
  }

  function handleClick(e) {
    const trigger = e.target.closest('[data-action], [data-tab], [data-page], [data-modal-close], [data-drawer-close]');

    if (
      !trigger ||
      ((trigger.getAttribute('data-action') || '').indexOf('toggle-menu') === -1 &&
        trigger.getAttribute('data-action') !== 'toggle-lang')
    ) {
      closeAllMenus();
    }
    if (!trigger) return;

    if (trigger.hasAttribute('data-tab')) {
      const wrap = trigger.closest('[data-tabs]');
      if (typeof global.onTabChange === 'function') global.onTabChange(Number(trigger.getAttribute('data-tab')), wrap);
      return;
    }
    if (trigger.hasAttribute('data-page')) {
      if (trigger.disabled) return;
      const page = Number(trigger.getAttribute('data-page'));
      if (typeof global.onPageChange === 'function') global.onPageChange(page);
      return;
    }
    if (trigger.hasAttribute('data-modal-close')) {
      closeModal(trigger.closest('[data-modal]'));
      return;
    }
    if (trigger.hasAttribute('data-drawer-close')) {
      closeDrawer(trigger.closest('[data-drawer]'));
      return;
    }

    const action = trigger.getAttribute('data-action');
    switch (action) {
      case 'toggle-dark':
        UIState.toggleDarkMode();
        if (SHELL === 'public') {
          updateNavbar();
          bindNavbarScroll();
        } else if (SHELL === 'app') updateTopbar();
        if (typeof global.onThemeChange === 'function') setTimeout(global.onThemeChange, 50);
        break;
      case 'toggle-lang':
      case 'toggle-menu': {
        e.stopPropagation();
        const sel = trigger.getAttribute('data-menu');
        const menu = sel && document.querySelector(sel);
        closeAllMenus(menu);
        if (menu) menu.classList.toggle('hidden');
        break;
      }
      case 'set-lang':
        e.stopPropagation();
        closeAllMenus();
        if (global.I18n) global.I18n.setLang(trigger.getAttribute('data-lang'));
        break;
      case 'toggle-mobile-menu': {
        const menu = document.getElementById('tx-mobile-menu');
        if (menu) menu.classList.toggle('hidden');
        break;
      }
      case 'toggle-sidebar':
        UIState.toggleSidebar();
        updateSidebar();
        break;
      case 'toggle-sidebar-responsive':
        if (window.innerWidth < 1024) UIState.toggleSidebarMobile();
        else {
          UIState.toggleSidebar();
          updateSidebar();
        }
        break;
      case 'close-sidebar-mobile':
        UIState.toggleSidebarMobile(false);
        break;
      case 'logout':
        Auth.logout();
        window.location.href = 'login.html';
        break;
      case 'accept-cookies':
        UIState.acceptCookies();
        updateCookieBanner();
        break;
      case 'decline-cookies':
        UIState.declineCookies();
        updateCookieBanner();
        break;
      case 'open-cookie-banner':
        UIState.openCookieBanner();
        updateCookieBanner();
        break;
    }
  }

  // ============================================================
  // Init
  // ============================================================
  function buildPublicShell(inner) {
    return (
      '<div class="flex min-h-screen flex-col overflow-x-hidden" style="background-color:var(--tx-body-bg)">' +
      '<header id="tx-navbar" class="sticky top-0 z-40 border-b transition-colors"></header>' +
      '<main id="tx-main" class="flex-1">' + inner + '</main>' +
      '<footer id="tx-footer" class="border-t border-themed surface-card"></footer>' +
      '<div id="tx-cookie"></div>' +
      '<div id="tx-toast-stack" class="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2"></div>' +
      '</div>'
    );
  }

  function buildAppShell(inner) {
    return (
      '<div class="flex h-screen overflow-hidden" style="background-color:var(--tx-body-bg)">' +
      '<aside id="tx-sidebar" class="surface-sidebar fixed left-0 top-0 z-50 flex h-screen flex-col overflow-y-hidden border-r px-4 transition-transform duration-300 -translate-x-full lg:static lg:translate-x-0" style="width:280px"></aside>' +
      '<div id="tx-sidebar-overlay" class="fixed inset-0 z-40 bg-gray-900/50 lg:hidden hidden" data-action="close-sidebar-mobile"></div>' +
      '<div class="relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto">' +
      '<header id="tx-topbar" class="surface-header sticky top-0 z-30 flex w-full border-b"></header>' +
      '<main class="flex-1"><div class="mx-auto w-full max-w-screen-2xl p-4 md:p-6 2xl:p-10">' + inner + '</div></main>' +
      '<footer id="tx-app-footer" class="surface-header border-t px-4 py-4 md:px-6 2xl:px-10"></footer>' +
      '</div>' +
      '<div id="tx-cookie"></div>' +
      '<div id="tx-toast-stack" class="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2"></div>' +
      '</div>'
    );
  }

  function buildBlankShell(inner) {
    return inner + '<div id="tx-toast-stack" class="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2"></div>';
  }

  function init() {
    const app = document.getElementById('app');
    if (!app) return;

    if (SHELL === 'app' || document.body.getAttribute('data-guard') === 'true') {
      if (!Auth.requireAuth()) return;
    }

    const inner = app.innerHTML;
    if (SHELL === 'app') app.outerHTML = buildAppShell(inner);
    else if (SHELL === 'blank') app.outerHTML = buildBlankShell(inner);
    else app.outerHTML = buildPublicShell(inner);

    global.UIToast = notify;
    global.notify = notify;

    const renderChrome = () => {
      if (SHELL === 'public') {
        updateNavbar();
        bindNavbarScroll();
        updateFooter();
        updateCookieBanner();
      } else if (SHELL === 'app') {
        updateSidebar();
        updateTopbar();
        updateAppFooter();
        updateSidebarMobile();
        updateCookieBanner();
      }
    };
    renderChrome();

    document.addEventListener('i18n:changed', () => {
      renderChrome();
      if (typeof global.renderPage === 'function') global.renderPage();
    });

    UIState.subscribe(() => {
      if (SHELL === 'app') updateSidebarMobile();
    });

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllMenus();
        document.querySelectorAll('[data-modal]:not(.hidden)').forEach((m) => m.classList.add('hidden'));
        document.querySelectorAll('[data-drawer]:not(.hidden)').forEach((m) => m.classList.add('hidden'));
        if (UIState.get().sidebarMobileOpen) UIState.toggleSidebarMobile(false);
      }
    });

    // O banner de cookies aparece na primeira visita (sem escolha registrada).
    if (SHELL !== 'blank' && !UIState.get().cookiesAccepted) {
      setTimeout(() => {
        UIState.openCookieBanner();
        updateCookieBanner();
      }, 800);
    }

    if (global.I18n) global.I18n.whenReady(() => typeof global.renderPage === 'function' && global.renderPage());
    else if (typeof global.renderPage === 'function') global.renderPage();
  }

  // Helpers expostos para as páginas.
  global.UI = {
    t,
    tArr,
    lang,
    esc,
    fmt,
    fmtCompact,
    fmtNumber,
    fmtDate,
    fmtDateTime,
    fmtTime,
    icon,
    notify,
    publicLink,
    param,
    copyText,
    avatar,
    initials,
    badge,
    surveyStatus,
    sourceBadge,
    typeBadge,
    kpiCard,
    emptyState,
    breadcrumb,
    pageHeader,
    switchToggle,
    filterBar,
    filterSelect,
    tabs,
    modal,
    openModal,
    closeModal,
    drawer,
    openDrawer,
    closeDrawer,
    pagination,
    authShell,
    progressBar,
    choiceChart,
    scaleDistribution,
    npsGauge,
    matrixHeat,
    termCloud,
    questionSummaryCard,
    surveyCard,
    templateCard,
    qrCode,
    questionRenderer,
    mountQuestion,
    mountQuestionList,
    mountQuestionEditor,
    mountLogicRules,
    shareBox,
    bindShareBox,
    responseDetail,
  };
  global.Layout = { init, updateNavbar, updateFooter, updateSidebar, updateTopbar, updateCookieBanner };

  if (document.getElementById('app')) init();
  else document.addEventListener('DOMContentLoaded', init);
})(window);
