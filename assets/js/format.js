/* ===== Format helpers — porta o React src/lib/format.ts =====
   Moeda, número, data e hora por idioma, mais duração legível. */
(function (global) {
  const LOCALE_MAP = {
    'pt-BR': { locale: 'pt-BR', currency: 'BRL' },
    en: { locale: 'en-US', currency: 'USD' },
    es: { locale: 'es-ES', currency: 'EUR' },
  };

  function cfgFor(lang) {
    return LOCALE_MAP[lang || 'pt-BR'] || LOCALE_MAP['pt-BR'];
  }

  /** Moeda respeitando o idioma ativo (BRL por padrão). */
  function formatCurrency(value, lang) {
    const cfg = cfgFor(lang);
    return new Intl.NumberFormat(cfg.locale, {
      style: 'currency',
      currency: cfg.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /** Número compacto, ex.: 2840 -> 2,8 mil */
  function formatCompact(value, lang) {
    return new Intl.NumberFormat(cfgFor(lang).locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  }

  /** Inteiro com separador de milhar. */
  function formatNumber(value, lang) {
    return new Intl.NumberFormat(cfgFor(lang).locale).format(value);
  }

  /** Data (medium) no idioma ativo. */
  function formatDate(iso, lang) {
    return new Intl.DateTimeFormat(cfgFor(lang).locale, { dateStyle: 'medium' }).format(new Date(iso));
  }

  /** Data + hora (short) no idioma ativo. */
  function formatDateTime(iso, lang) {
    return new Intl.DateTimeFormat(cfgFor(lang).locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  }

  /** Só HH:mm. */
  function formatTime(iso, lang) {
    return new Intl.DateTimeFormat(cfgFor(lang).locale, { timeStyle: 'short' }).format(new Date(iso));
  }

  /** Duração legível a partir de minutos, ex.: 90 -> "1h30", 45 -> "45min". */
  function formatDuration(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h${String(m).padStart(2, '0')}`;
  }

  global.Format = {
    formatCurrency,
    formatCompact,
    formatNumber,
    formatDate,
    formatDateTime,
    formatTime,
    formatDuration,
  };
})(window);
