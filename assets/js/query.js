/* ===== Consultas e agregações — porta o React src/data/query.ts =====
   Lógica condicional (pular / mostrar / esconder), validação, resumos por tipo
   de pergunta, NPS calculado e exportação em CSV. Sem dependência de store:
   tudo recebe as listas por parâmetro, igual ao React. */
(function (global) {
  // ---- Buscas -----------------------------------------------------------

  function surveyById(list, id) {
    return list.find((s) => s.id === id);
  }
  function surveyBySlug(list, slug) {
    return list.find((s) => s.slug === slug);
  }
  function contactById(list, id) {
    if (id === null || id === undefined) return undefined;
    return list.find((c) => c.id === id);
  }
  function templateBySlug(list, slug) {
    return list.find((m) => m.slug === slug);
  }
  function questionById(survey, id) {
    return survey.questions.find((q) => q.id === id);
  }

  /** Slug simples, usado ao criar formulário a partir de um modelo. */
  function slugify(value) {
    return String(value)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  const ordered = (questions) => questions.slice().sort((a, b) => a.order - b.order);

  // =======================================================================
  // Lógica condicional
  // =======================================================================

  function answersToMap(answers) {
    const map = {};
    for (const a of answers) map[a.questionId] = a.value;
    return map;
  }

  function mapToAnswers(map) {
    return Object.keys(map).map((questionId) => ({ questionId, value: map[questionId] }));
  }

  const norm = (v) =>
    String(v)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim()
      .toLowerCase();

  /** Texto legível de qualquer valor de resposta — usado em regras, tabelas e CSV. */
  function answerToText(value) {
    if (value === undefined || value === null) return '';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') {
      return Object.keys(value)
        .map((row) => row + ': ' + value[row])
        .join(' | ');
    }
    return value;
  }

  /** Uma regra é satisfeita pelo conjunto de respostas atual? */
  function ruleMatches(rule, answers) {
    const value = answers[rule.questionId];
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return false;

    const text = answerToText(value);
    const target = rule.value;

    switch (rule.operator) {
      case 'igual':
        return Array.isArray(value)
          ? value.some((v) => norm(v) === norm(target))
          : norm(text) === norm(target);
      case 'diferente':
        return Array.isArray(value)
          ? !value.some((v) => norm(v) === norm(target))
          : norm(text) !== norm(target);
      case 'maior': {
        const a = Number(value);
        const b = Number(target);
        if (Number.isNaN(a) || Number.isNaN(b)) return false;
        return a > b;
      }
      case 'menor': {
        const a = Number(value);
        const b = Number(target);
        if (Number.isNaN(a) || Number.isNaN(b)) return false;
        return a < b;
      }
      case 'contem':
        return norm(text).indexOf(norm(target)) !== -1;
      default:
        return false;
    }
  }

  /** Perguntas que só aparecem quando alguma regra `mostrar` as libera. */
  function conditionalIds(logic) {
    const set = new Set();
    logic.filter((r) => r.action === 'mostrar').forEach((r) => set.add(r.targetId));
    return set;
  }

  /**
   * Uma pergunta fica escondida quando:
   * - é alvo de uma regra `esconder` satisfeita, ou
   * - é condicional (alvo de `mostrar`) e nenhuma das regras que a liberam bate.
   */
  function isHiddenQuestion(survey, questionId, answers) {
    const rules = survey.logic.filter((r) => r.targetId === questionId);
    if (rules.some((r) => r.action === 'esconder' && ruleMatches(r, answers))) return true;
    const show = rules.filter((r) => r.action === 'mostrar');
    if (show.length > 0 && !show.some((r) => ruleMatches(r, answers))) return true;
    return false;
  }

  function skipHidden(survey, from, answers, qs) {
    let i = from;
    while (i < qs.length && isHiddenQuestion(survey, qs[i].id, answers)) i++;
    return i;
  }

  /**
   * Índice da próxima pergunta a partir de `index`, respeitando os saltos
   * (`pular-para`) que as respostas atuais disparam. Retorna `questions.length`
   * quando o formulário acabou.
   */
  function nextQuestionIndex(survey, index, answers) {
    const qs = ordered(survey.questions);
    const current = qs[index];
    if (current) {
      const jump = survey.logic.find(
        (r) => r.action === 'pular-para' && r.questionId === current.id && ruleMatches(r, answers)
      );
      if (jump) {
        const target = qs.findIndex((q) => q.id === jump.targetId);
        if (target > index) return skipHidden(survey, target, answers, qs);
      }
    }
    return skipHidden(survey, index + 1, answers, qs);
  }

  /** Índice da primeira pergunta visível. */
  function firstQuestionIndex(survey, answers) {
    return skipHidden(survey, 0, answers, ordered(survey.questions));
  }

  /**
   * Caminho que o respondente percorre com as respostas atuais — é o que a
   * barra de progresso conta. Perguntas puladas por uma regra não entram.
   */
  function reachableQuestions(survey, answers) {
    const qs = ordered(survey.questions);
    const path = [];
    let i = firstQuestionIndex(survey, answers);
    let guard = 0;
    while (i < qs.length && guard++ < 200) {
      path.push(qs[i]);
      i = nextQuestionIndex(survey, i, answers);
    }
    return path;
  }

  /** Índice anterior no caminho percorrido (usado pelo botão Voltar). */
  function previousQuestionIndex(survey, index, answers) {
    const qs = ordered(survey.questions);
    const path = reachableQuestions(survey, answers);
    const currentId = qs[index] ? qs[index].id : undefined;
    const at = path.findIndex((q) => q.id === currentId);
    if (at > 0) return qs.findIndex((q) => q.id === path[at - 1].id);
    return index;
  }

  // =======================================================================
  // Validação
  // =======================================================================

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function isEmptyAnswer(value) {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  /** Mensagem de erro da pergunta, ou null quando a resposta está válida. */
  function validateAnswer(question, value) {
    if (isEmptyAnswer(value)) {
      return question.required ? { key: 'validation.required' } : null;
    }

    if (question.type === 'email' && typeof value === 'string' && !EMAIL_RE.test(value.trim())) {
      return { key: 'validation.email' };
    }

    if (question.type === 'numero') {
      const n = Number(value);
      if (Number.isNaN(n)) return { key: 'validation.number' };
      if (question.min !== null && n < question.min) return { key: 'validation.min', params: { min: question.min } };
      if (question.max !== null && n > question.max) return { key: 'validation.max', params: { max: question.max } };
    }

    if (question.type === 'data' && typeof value === 'string') {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return { key: 'validation.date' };
    }

    if (question.type === 'matriz' && question.required && typeof value === 'object' && !Array.isArray(value)) {
      const answered = Object.keys(value).length;
      if (answered < question.rows.length) return { key: 'validation.matrix' };
    }

    return null;
  }

  // =======================================================================
  // Agregações
  // =======================================================================

  function responsesOf(responses, surveyId) {
    return responses.filter((r) => r.surveyId === surveyId);
  }

  function completionRate(responses) {
    if (responses.length === 0) return 0;
    return responses.filter((r) => r.completed).length / responses.length;
  }

  function averageSeconds(responses) {
    if (responses.length === 0) return 0;
    return Math.round(responses.reduce((sum, r) => sum + r.durationSec, 0) / responses.length);
  }

  /** "4min12" a partir de segundos. */
  function formatSeconds(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return s + 's';
    return m + 'min' + String(s).padStart(2, '0');
  }

  function valuesFor(responses, questionId) {
    const out = [];
    for (const r of responses) {
      const a = r.answers.find((x) => x.questionId === questionId);
      if (a && !isEmptyAnswer(a.value)) out.push(a.value);
    }
    return out;
  }

  const toSlices = (counts, total) =>
    Array.from(counts.entries())
      .map(([label, value]) => ({ label, value, percent: total ? Math.round((value / total) * 1000) / 10 : 0 }))
      .sort((a, b) => b.value - a.value);

  /** NPS calculado — nunca gravado. */
  function npsFrom(values) {
    const total = values.length;
    const promoters = values.filter((v) => v >= 9).length;
    const passives = values.filter((v) => v >= 7 && v <= 8).length;
    const detractors = values.filter((v) => v <= 6).length;
    const score = total ? Math.round(((promoters - detractors) / total) * 100) : 0;
    const average = total ? Math.round((values.reduce((a, b) => a + b, 0) / total) * 10) / 10 : 0;
    return { promoters, passives, detractors, total, score, average };
  }

  const PT_STOPWORDS = new Set([
    'a','ao','aos','as','às','até','com','como','da','das','de','dela','dele','do','dos','e','ela','ele','em','entre',
    'era','essa','esse','esta','este','eu','foi','for','isso','já','lhe','mais','mas','me','mesmo','meu','minha','muito',
    'na','nas','no','nos','nós','num','numa','o','os','ou','para','pela','pelo','por','porque','qual','quando','que',
    'quem','se','sem','ser','seu','sua','só','também','tem','ter','teu','tinha','tudo','um','uma','vez','você','vocês',
    'the','and','of','to','in','is','it','for','on','with','que','nao','não','sim','muita','muitos','pouco','fica',
  ]);

  /** Termos mais frequentes de um conjunto de textos livres. */
  function topTerms(texts, limit) {
    limit = limit === undefined ? 12 : limit;
    const counts = new Map();
    for (const text of texts) {
      const words = String(text)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length > 3 && !PT_STOPWORDS.has(w));
      for (const w of words) counts.set(w, (counts.get(w) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
      .slice(0, limit);
  }

  function scaleSummary(question, values) {
    const min = question.min === null || question.min === undefined ? 1 : question.min;
    const max = question.max === null || question.max === undefined ? 5 : question.max;
    const counts = new Map();
    for (let v = min; v <= max; v++) counts.set(String(v), 0);
    for (const v of values) counts.set(String(v), (counts.get(String(v)) || 0) + 1);
    const total = values.length;
    const distribution = Array.from(counts.entries()).map(([label, value]) => ({
      label,
      value,
      percent: total ? Math.round((value / total) * 1000) / 10 : 0,
    }));
    const average = total ? Math.round((values.reduce((a, b) => a + b, 0) / total) * 100) / 100 : 0;
    return { average, min, max, distribution, total };
  }

  function matrixSummary(question, values) {
    const cells = [];
    let max = 0;
    for (const row of question.rows) {
      const rowTotal = values.filter((v) => v[row]).length;
      for (const column of question.columns) {
        const count = values.filter((v) => v[row] === column).length;
        if (count > max) max = count;
        cells.push({
          row,
          column,
          count,
          percent: rowTotal ? Math.round((count / rowTotal) * 1000) / 10 : 0,
        });
      }
    }
    return { rows: question.rows, columns: question.columns, cells, max, total: values.length };
  }

  function summaryKind(type) {
    switch (type) {
      case 'escolha-unica':
        return 'escolha';
      case 'multipla-escolha':
        return 'multipla';
      case 'escala':
        return 'escala';
      case 'nps':
        return 'nps';
      case 'matriz':
        return 'matriz';
      case 'numero':
        return 'numero';
      case 'data':
        return 'data';
      default:
        return 'texto';
    }
  }

  /** Resumo de uma pergunta com o recorte certo para o gráfico do tipo dela. */
  function summarizeQuestion(survey, question, responses) {
    const values = valuesFor(responses, question.id);
    // Só conta como "pulou" quem passou por ela: perguntas escondidas ou
    // saltadas por uma regra não entram no caminho daquela resposta.
    const reachable = responses.filter((r) => {
      const map = answersToMap(r.answers);
      return reachableQuestions(survey, map).some((q) => q.id === question.id);
    }).length;

    const base = {
      question,
      kind: summaryKind(question.type),
      answered: values.length,
      skipped: Math.max(0, reachable - values.length),
      slices: [],
      nps: null,
      scale: null,
      terms: [],
      matrix: null,
      samples: [],
    };

    switch (question.type) {
      case 'escolha-unica': {
        const counts = new Map();
        for (const c of question.choices) counts.set(c.label, 0);
        for (const v of values) {
          const label = String(v);
          counts.set(label, (counts.get(label) || 0) + 1);
        }
        base.slices = toSlices(counts, values.length);
        break;
      }
      case 'multipla-escolha': {
        const counts = new Map();
        for (const c of question.choices) counts.set(c.label, 0);
        for (const v of values) {
          const list = Array.isArray(v) ? v : [String(v)];
          for (const label of list) counts.set(label, (counts.get(label) || 0) + 1);
        }
        base.slices = toSlices(counts, values.length);
        break;
      }
      case 'escala': {
        base.scale = scaleSummary(question, values.map(Number));
        base.slices = base.scale.distribution;
        break;
      }
      case 'numero': {
        const nums = values.map(Number).filter((n) => !Number.isNaN(n));
        const min = nums.length ? Math.min.apply(null, nums) : 0;
        const max = nums.length ? Math.max.apply(null, nums) : 0;
        const buckets = 6;
        const step = Math.max(1, Math.ceil((max - min + 1) / buckets));
        const counts = new Map();
        for (let start = min; start <= max; start += step) {
          const end = Math.min(max, start + step - 1);
          counts.set(start === end ? String(start) : start + '–' + end, 0);
        }
        for (const n of nums) {
          const index = Math.floor((n - min) / step);
          const start = min + index * step;
          const end = Math.min(max, start + step - 1);
          const label = start === end ? String(start) : start + '–' + end;
          counts.set(label, (counts.get(label) || 0) + 1);
        }
        base.slices = Array.from(counts.entries()).map(([label, value]) => ({
          label,
          value,
          percent: nums.length ? Math.round((value / nums.length) * 1000) / 10 : 0,
        }));
        base.scale = {
          average: nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100 : 0,
          min,
          max,
          distribution: base.slices,
          total: nums.length,
        };
        break;
      }
      case 'nps': {
        base.nps = npsFrom(values.map(Number));
        const counts = new Map();
        for (let v = 0; v <= 10; v++) counts.set(String(v), 0);
        for (const v of values) counts.set(String(v), (counts.get(String(v)) || 0) + 1);
        base.slices = Array.from(counts.entries()).map(([label, value]) => ({
          label,
          value,
          percent: values.length ? Math.round((value / values.length) * 1000) / 10 : 0,
        }));
        break;
      }
      case 'matriz': {
        base.matrix = matrixSummary(question, values);
        break;
      }
      case 'data': {
        const counts = new Map();
        for (const v of values) {
          const d = new Date(String(v));
          if (Number.isNaN(d.getTime())) continue;
          const label = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
          counts.set(label, (counts.get(label) || 0) + 1);
        }
        base.slices = Array.from(counts.entries())
          .map(([label, value]) => ({
            label,
            value,
            percent: values.length ? Math.round((value / values.length) * 1000) / 10 : 0,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        base.samples = values.slice(0, 6).map(String);
        break;
      }
      default: {
        const texts = values.map((v) => String(v));
        // Endereços de e-mail não rendem "termos frequentes" úteis — só amostras.
        if (question.type !== 'email') base.terms = topTerms(texts);
        base.samples = texts.slice(0, 8);
        break;
      }
    }

    return base;
  }

  function summarizeSurvey(survey, responses) {
    return ordered(survey.questions).map((q) => summarizeQuestion(survey, q, responses));
  }

  /** NPS do formulário: usa a primeira pergunta do tipo `nps`. */
  function surveyNps(survey, responses) {
    const question = ordered(survey.questions).find((q) => q.type === 'nps');
    if (!question) return null;
    const values = valuesFor(responses, question.id).map(Number);
    if (values.length === 0) return null;
    return npsFrom(values);
  }

  function surveyStats(surveys, responses) {
    return surveys.map((survey) => {
      const rows = responsesOf(responses, survey.id);
      const nps = surveyNps(survey, rows);
      const dates = rows.map((r) => r.at).sort();
      return {
        survey,
        responses: rows.length,
        completed: rows.filter((r) => r.completed).length,
        completionRate: completionRate(rows),
        averageSeconds: averageSeconds(rows),
        nps: nps ? nps.score : null,
        lastAt: dates.length ? dates[dates.length - 1] : null,
      };
    });
  }

  /** Série de respostas por dia dos últimos `days` dias. */
  function responsesPerDay(responses, days) {
    days = days === undefined ? 30 : days;
    const out = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const value = responses.filter((r) => r.at.slice(0, 10) === key).length;
      out.push({ label: key, value });
    }
    return out;
  }

  function responsesThisMonth(responses) {
    const now = new Date();
    return responses.filter((r) => {
      const d = new Date(r.at);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }

  function sourceBreakdown(responses) {
    const counts = new Map();
    for (const r of responses) counts.set(r.source, (counts.get(r.source) || 0) + 1);
    return toSlices(counts, responses.length);
  }

  function topSurveys(surveys, responses, limit) {
    limit = limit === undefined ? 5 : limit;
    return surveyStats(surveys, responses)
      .filter((s) => s.responses > 0)
      .sort((a, b) => b.responses - a.responses)
      .slice(0, limit);
  }

  function latestResponses(responses, limit) {
    limit = limit === undefined ? 6 : limit;
    return responses.slice().sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
  }

  function allTags(contacts) {
    const set = new Set();
    contacts.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  // =======================================================================
  // Exportar CSV
  // =======================================================================

  function csvCell(value) {
    const needsQuotes = /[";\n]/.test(value);
    const escaped = String(value).replace(/"/g, '""');
    return needsQuotes ? '"' + escaped + '"' : escaped;
  }

  /** Uma linha por resposta, uma coluna por pergunta. */
  function buildCsv(survey, responses, contacts, headers, yes, no) {
    const questions = ordered(survey.questions);
    const head = [
      headers.id,
      headers.at,
      headers.duration,
      headers.completed,
      headers.source,
      headers.contact,
    ].concat(questions.map((q) => q.title));
    const lines = [head.map(csvCell).join(';')];

    for (const r of responses) {
      const contact = contactById(contacts, r.contactId);
      const row = [
        String(r.id),
        new Date(r.at).toISOString(),
        String(r.durationSec),
        r.completed ? yes : no,
        r.source,
        contact ? contact.name + ' <' + contact.email + '>' : '',
      ].concat(
        questions.map((q) => {
          const a = r.answers.find((x) => x.questionId === q.id);
          return answerToText(a ? a.value : undefined);
        })
      );
      lines.push(row.map(csvCell).join(';'));
    }

    // BOM para o Excel abrir os acentos corretamente.
    return '﻿' + lines.join('\r\n');
  }

  /** Gera o arquivo no próprio navegador — sem servidor. */
  function downloadCsv(filename, content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  global.Query = {
    surveyById,
    surveyBySlug,
    contactById,
    templateBySlug,
    questionById,
    slugify,
    ordered,
    answersToMap,
    mapToAnswers,
    answerToText,
    ruleMatches,
    conditionalIds,
    isHiddenQuestion,
    nextQuestionIndex,
    firstQuestionIndex,
    reachableQuestions,
    previousQuestionIndex,
    isEmptyAnswer,
    validateAnswer,
    responsesOf,
    completionRate,
    averageSeconds,
    formatSeconds,
    npsFrom,
    topTerms,
    summaryKind,
    summarizeQuestion,
    summarizeSurvey,
    surveyNps,
    surveyStats,
    responsesPerDay,
    responsesThisMonth,
    sourceBreakdown,
    topSurveys,
    latestResponses,
    allTags,
    buildCsv,
    downloadCsv,
  };
})(window);
