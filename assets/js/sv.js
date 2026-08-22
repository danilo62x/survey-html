/* ===== Stores do Sondagem — porta o useSurveyStore e o useFillingStore =====
   SV        -> formulários, respostas, contatos e modelos. Chave "sv-data".
                CRUD completo, publicar/encerrar/reabrir, duplicar, reordenar
                pergunta, regras de lógica e registro de resposta.
   SVFilling -> preenchimento em andamento do formulário público. Chave "sv-filling".
   Os dois expõem subscribe(cb) para as páginas re-renderizarem a cada mutação. */
(function (global) {
  const STORAGE_KEY = 'sv-data';
  const FILLING_KEY = 'sv-filling';

  const Q = global.Query;
  const Data = global.Data;

  const nextId = (rows) => (rows.length ? Math.max.apply(null, rows.map((r) => r.id)) + 1 : 1);

  const uid = (prefix) => prefix + Math.random().toString(36).slice(2, 8);

  /** Reescreve os ids das perguntas/opções ao copiar um formulário ou modelo. */
  function cloneQuestions(questions, logic) {
    const idMap = new Map();
    const cloned = Q.ordered(questions).map((q, index) => {
      const id = uid('q');
      idMap.set(q.id, id);
      return Object.assign({}, q, {
        id,
        order: index,
        choices: q.choices.map((c, i) => ({ id: id + '-o' + (i + 1), label: c.label })),
        rows: q.rows.slice(),
        columns: q.columns.slice(),
      });
    });
    const rules = logic
      .filter((r) => idMap.has(r.questionId) && idMap.has(r.targetId))
      .map((r) =>
        Object.assign({}, r, {
          id: uid('r'),
          questionId: idMap.get(r.questionId),
          targetId: idMap.get(r.targetId),
        })
      );
    return { questions: cloned, logic: rules };
  }

  function uniqueSlug(surveys, base) {
    let slug = base || 'formulario';
    let n = 2;
    while (surveys.some((s) => s.slug === slug)) slug = base + '-' + n++;
    return slug;
  }

  function seed() {
    return {
      surveys: Data.SURVEYS.map((s) =>
        Object.assign({}, s, {
          questions: s.questions.map((q) =>
            Object.assign({}, q, { choices: q.choices.map((c) => Object.assign({}, c)) })
          ),
          logic: s.logic.map((r) => Object.assign({}, r)),
        })
      ),
      responses: Data.RESPONSES.map((r) =>
        Object.assign({}, r, { answers: r.answers.map((a) => Object.assign({}, a)) })
      ),
      contacts: Data.CONTACTS.map((c) => Object.assign({}, c, { tags: c.tags.slice() })),
      templates: Data.TEMPLATES.map((t) => Object.assign({}, t)),
    };
  }

  let state = seed();
  const listeners = new Set();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        state = {
          surveys: p.surveys || state.surveys,
          responses: p.responses || state.responses,
          contacts: p.contacts || state.contacts,
          templates: p.templates || state.templates,
        };
      }
    } catch (_) {}
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function emit() {
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

  // ---- Formulários --------------------------------------------------------

  function addSurvey(title, description) {
    description = description === undefined ? '' : description;
    const now = new Date().toISOString();
    const survey = {
      id: nextId(state.surveys),
      slug: uniqueSlug(state.surveys, Q.slugify(title)),
      title,
      description,
      status: 'rascunho',
      coverSeed: Q.slugify(title) || 'novo',
      color: '#465fff',
      questions: [Data.blankQuestion('texto-curto', uid('q'), 0)],
      logic: [],
      thankYou: 'Obrigado por responder!',
      createdAt: now,
      publishedAt: '',
      closesAt: null,
      views: 0,
    };
    state.surveys = state.surveys.concat([survey]);
    emit();
    return survey;
  }

  function createFromTemplate(templateId, title) {
    const template = state.templates.find((t) => t.id === templateId);
    if (!template) return undefined;
    const now = new Date().toISOString();
    const name = (title && title.trim()) || template.name;
    const cloned = cloneQuestions(template.questions, []);
    const survey = {
      id: nextId(state.surveys),
      slug: uniqueSlug(state.surveys, Q.slugify(name)),
      title: name,
      description: template.objective,
      status: 'rascunho',
      coverSeed: template.slug,
      color: template.color,
      questions: cloned.questions,
      logic: cloned.logic,
      thankYou: 'Obrigado por responder!',
      createdAt: now,
      publishedAt: '',
      closesAt: null,
      views: 0,
    };
    state.surveys = state.surveys.concat([survey]);
    emit();
    return survey;
  }

  function updateSurvey(id, patch) {
    state.surveys = state.surveys.map((s) => (s.id === id ? Object.assign({}, s, patch) : s));
    emit();
  }

  function removeSurvey(id) {
    state.surveys = state.surveys.filter((s) => s.id !== id);
    state.responses = state.responses.filter((r) => r.surveyId !== id);
    emit();
  }

  function duplicateSurvey(id) {
    const source = state.surveys.find((s) => s.id === id);
    if (!source) return undefined;
    const cloned = cloneQuestions(source.questions, source.logic);
    const copy = Object.assign({}, source, {
      id: nextId(state.surveys),
      slug: uniqueSlug(state.surveys, source.slug + '-copia'),
      title: source.title + ' (cópia)',
      status: 'rascunho',
      questions: cloned.questions,
      logic: cloned.logic,
      createdAt: new Date().toISOString(),
      publishedAt: '',
      closesAt: null,
      views: 0,
    });
    state.surveys = state.surveys.concat([copy]);
    emit();
    return copy;
  }

  function publishSurvey(id) {
    state.surveys = state.surveys.map((s) =>
      s.id === id
        ? Object.assign({}, s, {
            status: 'publicado',
            publishedAt: s.publishedAt || new Date().toISOString(),
            closesAt: null,
          })
        : s
    );
    emit();
  }

  function closeSurvey(id) {
    state.surveys = state.surveys.map((s) =>
      s.id === id ? Object.assign({}, s, { status: 'encerrado', closesAt: new Date().toISOString() }) : s
    );
    emit();
  }

  function reopenSurvey(id) {
    state.surveys = state.surveys.map((s) =>
      s.id === id ? Object.assign({}, s, { status: 'publicado', closesAt: null }) : s
    );
    emit();
  }

  function registerView(id) {
    state.surveys = state.surveys.map((s) => (s.id === id ? Object.assign({}, s, { views: s.views + 1 }) : s));
    emit();
  }

  // ---- Perguntas ----------------------------------------------------------

  function addQuestion(surveyId, type) {
    const survey = state.surveys.find((s) => s.id === surveyId);
    if (!survey) return undefined;
    const question = Data.blankQuestion(type, uid('q'), survey.questions.length);
    state.surveys = state.surveys.map((s) =>
      s.id === surveyId ? Object.assign({}, s, { questions: s.questions.concat([question]) }) : s
    );
    emit();
    return question;
  }

  function updateQuestion(surveyId, questionId, patch) {
    state.surveys = state.surveys.map((s) =>
      s.id === surveyId
        ? Object.assign({}, s, {
            questions: s.questions.map((q) => (q.id === questionId ? Object.assign({}, q, patch) : q)),
          })
        : s
    );
    emit();
  }

  function removeQuestion(surveyId, questionId) {
    state.surveys = state.surveys.map((s) => {
      if (s.id !== surveyId) return s;
      const questions = Q.ordered(s.questions)
        .filter((q) => q.id !== questionId)
        .map((q, i) => Object.assign({}, q, { order: i }));
      return Object.assign({}, s, {
        questions,
        // Regras que citam a pergunta removida deixam de existir.
        logic: s.logic.filter((r) => r.questionId !== questionId && r.targetId !== questionId),
      });
    });
    emit();
  }

  function moveQuestion(surveyId, from, to) {
    state.surveys = state.surveys.map((s) => {
      if (s.id !== surveyId) return s;
      const list = Q.ordered(s.questions);
      if (from < 0 || from >= list.length) return s;
      const target = Math.max(0, Math.min(to, list.length - 1));
      const moved = list.splice(from, 1)[0];
      list.splice(target, 0, moved);
      return Object.assign({}, s, { questions: list.map((q, i) => Object.assign({}, q, { order: i })) });
    });
    emit();
  }

  function duplicateQuestion(surveyId, questionId) {
    state.surveys = state.surveys.map((s) => {
      if (s.id !== surveyId) return s;
      const list = Q.ordered(s.questions);
      const index = list.findIndex((q) => q.id === questionId);
      if (index === -1) return s;
      const id = uid('q');
      const copy = Object.assign({}, list[index], {
        id,
        title: list[index].title + ' (cópia)',
        choices: list[index].choices.map((c, i) => ({ id: id + '-o' + (i + 1), label: c.label })),
        rows: list[index].rows.slice(),
        columns: list[index].columns.slice(),
      });
      list.splice(index + 1, 0, copy);
      return Object.assign({}, s, { questions: list.map((q, i) => Object.assign({}, q, { order: i })) });
    });
    emit();
  }

  // ---- Lógica -------------------------------------------------------------

  function addRule(surveyId) {
    const survey = state.surveys.find((s) => s.id === surveyId);
    if (!survey || survey.questions.length < 2) return;
    const list = Q.ordered(survey.questions);
    const rule = {
      id: uid('r'),
      questionId: list[0].id,
      operator: 'igual',
      value: list[0].choices[0] ? list[0].choices[0].label : '',
      action: 'pular-para',
      targetId: list[list.length - 1].id,
    };
    state.surveys = state.surveys.map((s) =>
      s.id === surveyId ? Object.assign({}, s, { logic: s.logic.concat([rule]) }) : s
    );
    emit();
  }

  function updateRule(surveyId, ruleId, patch) {
    state.surveys = state.surveys.map((s) =>
      s.id === surveyId
        ? Object.assign({}, s, { logic: s.logic.map((r) => (r.id === ruleId ? Object.assign({}, r, patch) : r)) })
        : s
    );
    emit();
  }

  function removeRule(surveyId, ruleId) {
    state.surveys = state.surveys.map((s) =>
      s.id === surveyId ? Object.assign({}, s, { logic: s.logic.filter((r) => r.id !== ruleId) }) : s
    );
    emit();
  }

  // ---- Respostas e contatos ----------------------------------------------

  function registerResponse(input) {
    const survey = state.surveys.find((s) => s.id === input.surveyId);
    const now = new Date().toISOString();

    // Se a pessoa deixou um e-mail, ela vira (ou reencontra) um contato.
    let contacts = state.contacts;
    let contactId = null;
    const emailQuestion = survey ? survey.questions.find((q) => q.type === 'email') : undefined;
    const emailAnswer = emailQuestion ? input.answers.find((a) => a.questionId === emailQuestion.id) : undefined;
    const email = emailAnswer && typeof emailAnswer.value === 'string' ? emailAnswer.value.trim().toLowerCase() : '';

    if (email) {
      const found = contacts.find((c) => c.email.toLowerCase() === email);
      if (found) {
        contactId = found.id;
        contacts = contacts.map((c) =>
          c.id === found.id ? Object.assign({}, c, { responseCount: c.responseCount + 1, lastAt: now }) : c
        );
      } else {
        const created = {
          id: nextId(contacts),
          name: email.split('@')[0].replace(/[._-]/g, ' '),
          email,
          avatar: '',
          tags: ['novo'],
          responseCount: 1,
          lastAt: now,
        };
        contactId = created.id;
        contacts = contacts.concat([created]);
      }
    }

    const response = {
      id: nextId(state.responses),
      surveyId: input.surveyId,
      at: now,
      durationSec: input.durationSec,
      completed: input.completed,
      source: input.source,
      contactId,
      answers: input.answers.map((a) => Object.assign({}, a)),
    };

    state.responses = state.responses.concat([response]);
    state.contacts = contacts;
    emit();
    return response;
  }

  function removeResponse(id) {
    state.responses = state.responses.filter((r) => r.id !== id);
    emit();
  }

  function updateContact(id, patch) {
    state.contacts = state.contacts.map((c) => (c.id === id ? Object.assign({}, c, patch) : c));
    emit();
  }

  function removeContact(id) {
    state.contacts = state.contacts.filter((c) => c.id !== id);
    state.responses = state.responses.map((r) => (r.contactId === id ? Object.assign({}, r, { contactId: null }) : r));
    emit();
  }

  function reset() {
    state = seed();
    emit();
  }

  load();

  global.SV = {
    get,
    subscribe,
    addSurvey,
    createFromTemplate,
    updateSurvey,
    removeSurvey,
    duplicateSurvey,
    publishSurvey,
    closeSurvey,
    reopenSurvey,
    registerView,
    addQuestion,
    updateQuestion,
    removeQuestion,
    moveQuestion,
    duplicateQuestion,
    addRule,
    updateRule,
    removeRule,
    registerResponse,
    removeResponse,
    updateContact,
    removeContact,
    reset,
  };

  // =========================================================================
  // Preenchimento do formulário público — porta o useFillingStore.
  // =========================================================================

  const EMPTY_FILLING = {
    slug: null,
    index: 0,
    answers: {},
    startedAt: null,
    submitted: false,
    submittedAnswers: {},
  };

  let filling = Object.assign({}, EMPTY_FILLING, { answers: {}, submittedAnswers: {} });

  function fillingLoad() {
    try {
      const raw = localStorage.getItem(FILLING_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        filling = Object.assign({}, EMPTY_FILLING, p, {
          answers: p.answers || {},
          submittedAnswers: p.submittedAnswers || {},
        });
      }
    } catch (_) {}
  }

  function fillingPersist() {
    try {
      localStorage.setItem(FILLING_KEY, JSON.stringify(filling));
    } catch (_) {}
  }

  function fillingSet(patch) {
    filling = Object.assign({}, filling, patch);
    fillingPersist();
  }

  function fillingGet() {
    return filling;
  }

  function start(survey) {
    if (filling.slug === survey.slug && !filling.submitted) {
      // Retoma o rascunho persistido do mesmo formulário.
      if (filling.startedAt === null) fillingSet({ startedAt: new Date().toISOString() });
      return;
    }
    fillingSet({
      slug: survey.slug,
      index: Q.firstQuestionIndex(survey, {}),
      answers: {},
      startedAt: new Date().toISOString(),
      submitted: false,
      submittedAnswers: {},
    });
  }

  function setAnswer(questionId, value) {
    const answers = Object.assign({}, filling.answers);
    answers[questionId] = value;
    fillingSet({ answers });
  }

  function goNext(survey) {
    const next = Q.nextQuestionIndex(survey, filling.index, filling.answers);
    fillingSet({ index: Math.min(next, Q.ordered(survey.questions).length) });
  }

  function goBack(survey) {
    fillingSet({ index: Q.previousQuestionIndex(survey, filling.index, filling.answers) });
  }

  function submit(survey) {
    const started = filling.startedAt ? new Date(filling.startedAt).getTime() : Date.now();
    const durationSec = Math.max(20, Math.round((Date.now() - started) / 1000));
    const answers = Q.mapToAnswers(filling.answers);
    fillingSet({
      submitted: true,
      submittedAnswers: Object.assign({}, filling.answers),
      index: Q.ordered(survey.questions).length,
    });
    return { answers, durationSec };
  }

  function restart() {
    fillingSet({ slug: null, index: 0, answers: {}, startedAt: null, submitted: false, submittedAnswers: {} });
  }

  function isLast(survey) {
    const next = Q.nextQuestionIndex(survey, filling.index, filling.answers);
    return next >= Q.ordered(survey.questions).length;
  }

  /** Só as perguntas alcançáveis contam na barra de progresso. */
  function progress(survey) {
    const path = Q.reachableQuestions(survey, filling.answers);
    const qs = Q.ordered(survey.questions);
    const currentId = qs[filling.index] ? qs[filling.index].id : undefined;
    const at = path.findIndex((q) => q.id === currentId);
    const total = Math.max(1, path.length);
    const current = at === -1 ? total : at + 1;
    return { current, total, percent: Math.round(((current - 1) / total) * 100) };
  }

  fillingLoad();

  global.SVFilling = {
    get: fillingGet,
    start,
    setAnswer,
    goNext,
    goBack,
    submit,
    restart,
    isLast,
    progress,
  };
})(window);
