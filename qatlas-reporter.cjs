'use strict';
//
/**
 * Reporter de Playwright para QAtlas — copia modificada del reporter oficial.
 *
 * Cambios respecto al oficial:
 *  1. Defectos sin duplicar (dedupeBugs): antes de abrir un defecto por un test
 *     fallido, busca si el caso ya tiene un defecto abierto (reportado a mano o
 *     por una corrida anterior). Si existe, solo vincula esta ejecución a ese
 *     defecto (queda como una ocurrencia más). Si no existe, lo crea.
 *  2. Evidencia visible: sube cada adjunto con step_order (el paso que falló o,
 *     si todos pasaron, el último), que es lo que QAtlas necesita para mostrarlo.
 *
 * Sin dependencias (fetch/FormData/Blob de Node >= 18). Nunca rompe la corrida:
 * si QAtlas no responde, avisa por consola y sigue (salvo failOnError: true).
 */

const fs = require('node:fs');
const path = require('node:path');

const ANSI = /\u001b\[[0-9;]*m/g;
const CASE_CODE = /^[A-Za-z0-9_]+(?:-[A-Za-z0-9_]+)*-TC-\d+$/;
const CASE_CODE_IN_TITLE = /@([A-Za-z0-9_]+(?:-[A-Za-z0-9_]+)*-TC-\d+)/;
const MAX_ERROR_CHARS = 4000;
// Mismos topes que el backend: 10 MB por archivo, 50 MB para video, 10 por caso.
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_ATTACHMENTS_PER_CASE = 10;
const ALLOWED_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf',
  'application/zip', 'application/json', 'text/plain', 'text/csv', 'application/xml', 'text/markdown',
  'video/webm', 'video/mp4',
]);
const EXTENSIONS = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp',
  'application/pdf': '.pdf', 'application/zip': '.zip', 'application/json': '.json',
  'text/plain': '.txt', 'text/csv': '.csv', 'text/markdown': '.md', 'application/xml': '.xml',
  'video/webm': '.webm', 'video/mp4': '.mp4',
};
// Estados de defecto que se consideran cerrados: si el defecto anterior está así,
// un fallo nuevo abre un defecto nuevo (es una regresión, no el mismo problema abierto).
const DEFAULT_CLOSED_STATUSES = /cerrad|closed|resuelt|resolved|rechazad|rejected|duplicad|duplicate|descartad|won.?t/i;

const truthy = (value) => ['1', 'true', 'yes', 'si'].includes(String(value ?? '').toLowerCase());

/** Título legible → id de automatización: "Bloque › título" (o solo el título). */
function defaultAutomationId(test) {
  const blocks = [];
  for (let suite = test.parent; suite; suite = suite.parent) {
    if (suite.type === 'describe' && suite.title) blocks.unshift(suite.title);
  }
  return [...blocks, test.title].join(' › ');
}

/** Cómo identificar el caso de QAtlas: anotación > tag/título > id de automatización. */
function identify(test, automationIdOf) {
  const annotation = (test.annotations || []).find((a) => a.type === 'qatlas' && a.description);
  if (annotation) {
    const value = String(annotation.description).trim();
    return CASE_CODE.test(value) ? { test_case_code: value } : { automation_id: value };
  }
  const tag = (test.tags || []).map((t) => String(t).replace(/^@/, '')).find((t) => CASE_CODE.test(t));
  if (tag) return { test_case_code: tag };
  const inTitle = CASE_CODE_IN_TITLE.exec(test.title);
  if (inTitle) return { test_case_code: inTitle[1] };
  return { automation_id: automationIdOf(test) };
}

function statusOf(test) {
  switch (test.outcome()) {
    case 'skipped': return 'skipped';
    case 'unexpected': return 'failed';
    default: return 'passed'; // expected / flaky (pasó tras reintentos)
  }
}

function errorMessageOf(result) {
  const error = result.error || (result.errors || [])[0];
  if (!error) return undefined;
  const text = String(error.message || error.value || error).replace(ANSI, '').trim();
  return text.length > MAX_ERROR_CHARS ? `${text.slice(0, MAX_ERROR_CHARS)}…` : text;
}

function stepsOf(result) {
  return (result.steps || [])
    .filter((step) => step.category === 'test.step')
    .map((step) => ({
      title: step.title,
      status: step.error ? 'failed' : 'passed',
      error_message: step.error ? String(step.error.message || '').replace(ANSI, '').trim() : undefined,
    }));
}

function ciRunId(env) {
  if (env.GITHUB_RUN_ID) return `gh-${env.GITHUB_RUN_ID}-${env.GITHUB_RUN_ATTEMPT || 1}`;
  if (env.CI_PIPELINE_ID) return `gl-${env.CI_PIPELINE_ID}`;
  if (env.BUILD_TAG || env.BUILD_ID) return `jenkins-${env.BUILD_TAG || env.BUILD_ID}`;
  return undefined;
}

function defaultRunName(env) {
  const when = new Date().toISOString().slice(0, 16).replace('T', ' ');
  if (env.GITHUB_RUN_NUMBER) return `Playwright #${env.GITHUB_RUN_NUMBER}`;
  return `Playwright ${when}`;
}

/** Contexto de la corrida en CI, tomado de las variables de entorno de cada proveedor. */
function ciContext(env) {
  const branch = env.GITHUB_REF_NAME || env.CI_COMMIT_REF_NAME || env.GIT_BRANCH || env.BRANCH_NAME;
  const commit = env.GITHUB_SHA || env.CI_COMMIT_SHA || env.GIT_COMMIT;
  const build = env.GITHUB_RUN_NUMBER || env.CI_PIPELINE_IID || env.BUILD_NUMBER;
  let ciUrl = env.CI_PIPELINE_URL || env.BUILD_URL;
  if (!ciUrl && env.GITHUB_RUN_ID && env.GITHUB_REPOSITORY) {
    ciUrl = `${env.GITHUB_SERVER_URL || 'https://github.com'}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`;
  }
  return { branch, commit_sha: commit, build, ci_url: ciUrl };
}

/** Paso donde se muestra la evidencia: el primero que falló o, si ninguno falló, el último. */
function evidenceStepOrder(runCase) {
  const steps = [...(runCase?.step_results || [])].sort((a, b) => a.order - b.order);
  if (steps.length === 0) return undefined;
  const failed = steps.find((s) => String(s.status).toLowerCase().startsWith('fail') || /fallid/i.test(s.status));
  return (failed || steps[steps.length - 1]).order;
}

class QAtlasReporter {
  constructor(options = {}) {
    const env = process.env;
    this.url = String(options.url ?? env.QATLAS_URL ?? '').replace(/\/+$/, '');
    this.token = options.token ?? env.QATLAS_TOKEN;
    this.project = options.project ?? env.QATLAS_PROJECT;
    this.runName = options.runName ?? env.QATLAS_RUN_NAME ?? defaultRunName(env);
    this.externalId = options.externalId ?? env.QATLAS_RUN_ID ?? ciRunId(env);
    this.createMissingCases = options.createMissingCases ?? truthy(env.QATLAS_CREATE_MISSING_CASES);
    this.createBugOnFailure = options.createBugOnFailure ?? truthy(env.QATLAS_CREATE_BUG_ON_FAILURE);
    // NUEVO: no duplicar defectos (activo por defecto cuando se crean defectos).
    this.dedupeBugs = options.dedupeBugs ?? (env.QATLAS_DEDUPE_BUGS === undefined ? true : truthy(env.QATLAS_DEDUPE_BUGS));
    this.bugSeverity = options.bugSeverity ?? env.QATLAS_BUG_SEVERITY ?? 'media';
    this.bugPriority = options.bugPriority ?? env.QATLAS_BUG_PRIORITY ?? 'media';
    this.closedStatuses = options.closedStatuses ?? DEFAULT_CLOSED_STATUSES;
    this.attachments = options.attachments ?? env.QATLAS_ATTACHMENTS ?? 'failed'; // failed | all | none
    this.onlyProject = options.onlyProject ?? env.QATLAS_ONLY_PROJECT;
    this.failOnError = options.failOnError ?? truthy(env.QATLAS_FAIL_ON_ERROR);
    this.automationId = options.automationId ?? defaultAutomationId;
    const ci = ciContext(env);
    this.context = {
      environment: options.environment ?? env.QATLAS_ENVIRONMENT,
      browser: options.browser ?? env.QATLAS_BROWSER,
      build: options.build ?? env.QATLAS_BUILD ?? ci.build,
      branch: options.branch ?? env.QATLAS_BRANCH ?? ci.branch,
      commit_sha: options.commitSha ?? env.QATLAS_COMMIT ?? ci.commit_sha,
      ci_url: options.ciUrl ?? env.QATLAS_CI_URL ?? ci.ci_url,
    };
    const gate = options.minPassRate ?? env.QATLAS_MIN_PASS_RATE;
    this.minPassRate = gate === undefined || gate === '' ? undefined : Number(gate);
    this.tests = new Map();
  }

  printsToStdio() {
    return false;
  }

  onTestEnd(test, result) {
    // Los reintentos llegan en orden: el último resultado de cada test es el final.
    this.tests.set(test.id, { test, result });
  }

  log(message) {
    console.log(`[QAtlas] ${message}`);
  }

  warn(message) {
    console.warn(`[QAtlas] ⚠ ${message}`);
  }

  fail(message) {
    if (this.failOnError) throw new Error(`[QAtlas] ${message}`);
    this.warn(message);
  }

  headers(extra = {}) {
    return { Authorization: `Bearer ${this.token}`, ...extra };
  }

  async api(method, route, body) {
    const response = await fetch(`${this.url}${route}`, {
      method,
      headers: this.headers(body ? { 'Content-Type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      const error = new Error(`${method} ${route} → ${response.status} ${detail.slice(0, 300)}`);
      error.status = response.status;
      throw error;
    }
    return response.status === 204 ? null : response.json();
  }

  async onEnd() {
    const missing = ['url', 'token', 'project'].filter((key) => !this[key]);
    if (missing.length > 0) {
      this.warn(
        `configuración incompleta (${missing.join(', ')}): no se envían resultados. ` +
          'Define QATLAS_URL, QATLAS_TOKEN y QATLAS_PROJECT (o las opciones del reporter).'
      );
      return;
    }

    const entries = [...this.tests.values()].filter(({ test }) => {
      if (!this.onlyProject) return true;
      const project = typeof test.parent?.project === 'function' ? test.parent.project() : undefined;
      return project?.name === this.onlyProject;
    });
    if (entries.length === 0) return;

    const payloadResults = entries.map(({ test, result }) => ({
      ...identify(test, this.automationId),
      title: test.title,
      status: statusOf(test),
      error_message: statusOf(test) === 'failed' ? errorMessageOf(result) : undefined,
      steps: stepsOf(result),
      duration_ms: Math.max(0, Math.round(result.duration ?? 0)) || undefined,
      attempts: (result.retry ?? 0) + 1,
      flaky: test.outcome() === 'flaky' || undefined,
    }));

    const context = { ...this.context };
    if (!context.browser) {
      const first = entries[0].test;
      const project = typeof first.parent?.project === 'function' ? first.parent.project() : undefined;
      if (project?.name) context.browser = project.name;
    }
    for (const key of Object.keys(context)) if (!context[key]) delete context[key];

    // Con dedupeBugs, QAtlas NO abre los defectos en el ingest: los maneja este reporter.
    const serverCreatesBugs = this.createBugOnFailure && !this.dedupeBugs;

    let data;
    try {
      data = await this.api('POST', '/test-runs/ingest', {
        project: this.project,
        run: { name: this.runName, external_id: this.externalId, ...context },
        results: payloadResults,
        create_missing_cases: this.createMissingCases,
        create_bug_on_failure: serverCreatesBugs,
      });
    } catch (error) {
      this.fail(error.status ? `QAtlas respondió ${error.message}` : `no se pudo contactar a QAtlas (${error.message})`);
      return;
    }

    const { summary, test_run: run, rows } = data;
    const webBase = this.url.replace(/\/api$/, '');
    this.log(
      `ejecución ${run.code} ${data.created_run ? 'creada' : 'actualizada'}: ` +
        `${summary.passed} aprobados, ${summary.failed} fallidos, ${summary.skipped} omitidos` +
        (summary.unmatched ? `, ${summary.unmatched} sin caso (ver ID de automatización)` : '') +
        (summary.created_cases ? `, ${summary.created_cases} casos creados` : '') +
        (summary.created_bugs ? `, ${summary.created_bugs} defectos abiertos` : '') +
        ` → ${webBase}/test-runs/${run.code}`
    );
    for (const row of rows.filter((r) => !r.matched)) {
      this.warn(`sin caso para "${row.key}": ${row.message ?? ''}`);
    }

    const runCaseById = new Map((run.cases || []).map((c) => [c.id, c]));

    if (this.attachments !== 'none') await this.uploadEvidence(entries, payloadResults, rows, runCaseById);
    if (this.createBugOnFailure && this.dedupeBugs) await this.handleBugs(run, rows, payloadResults, runCaseById, entries);{    try {
      await this.api('POST', `/test-runs/${run.id}/complete`);
      this.log(`ejecución ${run.code} completada.`);
    } catch (error) {
      this.warn(`no se pudo completar la ejecución ${run.code} (${error.message}).`);
    }}
    return this.qualityGate(run);
  }

  // ---------------------------------------------------------------- defectos

  /** Defectos abiertos del proyecto, agrupados por código de caso. */
  async openBugsByCase(projectId) {
    const byCase = new Map();
    const size = 100;
    for (let page = 1; page <= 50; page += 1) {
      const res = await this.api('GET', `/bugs?project_id=${projectId}&page[number]=${page}&page[size]=${size}`);
      for (const bug of res.data || []) {
        if (!bug.source_test_case_code) continue;
        if (this.closedStatuses.test(String(bug.status || ''))) continue;
        const list = byCase.get(bug.source_test_case_code) || [];
        list.push(bug);
        byCase.set(bug.source_test_case_code, list);
      }
      const total = res.meta?.total ?? 0;
      if (page * size >= total || (res.data || []).length < size) break;
    }
    return byCase;
  }

  async handleBugs(run, rows, payloadResults, runCaseById, entries) {
        const sentByKey = new Map(payloadResults.map((p) => [p.test_case_code || p.automation_id, p]));
    const isFailed = (r) =>
      sentByKey.get(r.key)?.status === 'failed' || /fail|fallid/i.test(String(r.status ?? ''));
    const failedRows = rows.filter((r) => r.matched && r.test_run_case_id && isFailed(r));
    if (failedRows.length === 0) {
      if (payloadResults.some((p) => p.status === 'failed')) {
        this.warn('hubo tests fallidos, pero ninguno quedó ligado a un caso de QAtlas: no se abren defectos.');
      }
      return;
    }

    let openByCase;
    try {
      openByCase = await this.openBugsByCase(run.project_id);
    } catch (error) {
      this.fail(`no se pudieron consultar los defectos existentes (${error.message}); no se abre ninguno.`);
      return;
    }

    const resultByKey = new Map(payloadResults.map((p) => [p.test_case_code || p.automation_id, p]));
    let created = 0;
    let reused = 0;

    for (const row of failedRows) {
      const runCase = runCaseById.get(row.test_run_case_id);
      const caseCode = row.test_case_code || runCase?.test_case_code;
      const sent = resultByKey.get(row.key) || {};
      const alreadyLinked = new Set((runCase?.bugs || []).map((b) => b.id));

      try {
        const existing = (openByCase.get(caseCode) || [])[0];
        if (existing) {
          if (!alreadyLinked.has(existing.id)) {
            await this.linkBug(run.id, row.test_run_case_id, existing.id);
          }
          reused += 1;
          this.log(`${caseCode}: falló otra vez → vinculado al defecto existente ${existing.code} (no se duplica).`);
          await this.attachToBug(existing, run, row, payloadResults, entries);
          continue;
        }

        const steps = [...(runCase?.step_results || [])].sort((a, b) => a.order - b.order);
        const failedStep = steps.find((s) => /fail|fallid/i.test(String(s.status))) || steps[steps.length - 1];
        const bug = await this.api('POST', '/bugs', {
          project_id: run.project_id,
          title: `${caseCode} — ${runCase?.test_case_title || sent.title || 'Fallo en prueba automatizada'}`.slice(0, 255),
          description:
            `Defecto detectado por la prueba automatizada (Playwright) en la ejecución ${run.code}.\n\n` +
            `Error reportado:\n${sent.error_message || '(sin mensaje)'}`,
          severity: this.bugSeverity,
          priority: this.bugPriority,
          source_test_run_case_id: row.test_run_case_id,
          tags: ['automatizado', 'playwright'],
          steps: steps.map((s) => ({
            order: s.order,
            action: s.action,
            expected_result: s.expected_result,
            test_data: s.test_data ?? null,
          })),
          expected_result: failedStep?.expected_result ?? null,
          actual_result: (sent.error_message || '').slice(0, MAX_ERROR_CHARS) || null,
        });
        await this.linkBug(run.id, row.test_run_case_id, bug.id);
        openByCase.set(caseCode, [bug]); // si el mismo caso aparece dos veces en la corrida, se reutiliza
        created += 1;
        this.log(`${caseCode}: defecto nuevo ${bug.code}.`);
        await this.attachToBug(bug, run, row, payloadResults, entries);
      } catch (error) {
        this.warn(`${caseCode}: no se pudo registrar el defecto (${error.message}).`);
      }
    }

    this.log(`defectos: ${created} nuevos, ${reused} reutilizados (sin duplicar).`);
  }

  async attachToBug(bug, run, row, payloadResults, entries) {
    const index = payloadResults.findIndex((p) => (p.test_case_code || p.automation_id) === row.key);
    const result = entries?.[index]?.result;
    if (!result) return;
    const files = (result.attachments || []).filter((a) => (a.path || a.body) && /^image\//.test(a.contentType || ''));
    let uploaded = 0;
    for (const attachment of files.slice(0, MAX_ATTACHMENTS_PER_CASE)) {
      const ok = await this.uploadFile({ entityType: 'bug', entityId: bug.id }, attachment, undefined, `${run.code}-`);
      if (ok) uploaded += 1;
    }
    if (uploaded) this.log(`${bug.code}: +${uploaded} evidencias de ${run.code}.`);
  }
  async linkBug(runId, runCaseId, bugId) {
    try {
      await this.api('POST', `/test-runs/${runId}/cases/${runCaseId}/bugs`, { bug_id: bugId });
    } catch (error) {
      // 409/400: ya estaba vinculado (por ejemplo, al crearlo con source_test_run_case_id).
      if (error.status !== 409 && error.status !== 400) throw error;
    }
  }

  // ------------------------------------------------------- compuerta de calidad

  async qualityGate(run) {
    if (this.minPassRate === undefined || Number.isNaN(this.minPassRate)) return undefined;
    try {
      const summary = await this.api('GET', `/test-runs/${run.id}/summary`);
      if (summary.pass_rate === null || summary.pass_rate >= this.minPassRate) {
        this.log(`compuerta de calidad superada (${summary.pass_rate ?? 'sin datos'} % ≥ ${this.minPassRate} %).`);
        return undefined;
      }
      this.warn(`compuerta de calidad NO superada: ${summary.pass_rate} % aprobado, se exige ${this.minPassRate} %.`);
      return { status: 'failed' };
    } catch (error) {
      this.fail(`no se pudo evaluar la compuerta de calidad (${error.message}).`);
      return undefined;
    }
  }

  // ----------------------------------------------------------------- evidencia

  async uploadEvidence(entries, payloadResults, rows, runCaseById) {
    const rowByKey = new Map(rows.map((row) => [row.key, row]));
    for (let index = 0; index < entries.length; index += 1) {
      const { result } = entries[index];
      const sent = payloadResults[index];
      const row = rowByKey.get(sent.test_case_code || sent.automation_id);
      if (!row?.matched || !row.test_run_case_id) continue;
      if (this.attachments === 'failed' && sent.status !== 'failed') continue;
      const stepOrder = evidenceStepOrder(runCaseById.get(row.test_run_case_id));
      const files = (result.attachments || []).filter((a) => a.path || a.body);
      for (const attachment of files.slice(0, MAX_ATTACHMENTS_PER_CASE)) {
        await this.uploadOne(row, attachment, stepOrder);
      }
      if (files.length > MAX_ATTACHMENTS_PER_CASE) {
        this.warn(`"${row.key}" tiene ${files.length} adjuntos; solo se suben ${MAX_ATTACHMENTS_PER_CASE}.`);
      }
    }
  }

  async uploadOne(row, attachment, stepOrder) {
    return this.uploadFile({ entityType: 'test_run_case', entityId: row.test_run_case_id }, attachment, stepOrder);
  }

  async uploadFile({ entityType, entityId }, attachment, stepOrder, prefix = '') {
    const type = String(attachment.contentType || '').split(';')[0];
    let name = attachment.path ? path.basename(attachment.path) : attachment.name;
    if (!path.extname(name) && EXTENSIONS[type]) name += EXTENSIONS[type];
    name = prefix + name;
    try {
      const body = attachment.body ?? fs.readFileSync(attachment.path);
      const limit = type.startsWith('video/') ? MAX_VIDEO_BYTES : MAX_FILE_BYTES;
      if (!ALLOWED_TYPES.has(type)) return this.warn(`adjunto "${name}" omitido: tipo ${type} no admitido.`);
      if (body.length > limit) {
        return this.warn(`adjunto "${name}" omitido: ${(body.length / 1048576).toFixed(1)} MB supera el límite.`);
      }
      const form = new FormData();
      form.append('entity_type', entityType);
      form.append('entity_id', String(entityId));
      if (stepOrder !== undefined) form.append('step_order', String(stepOrder)); // NUEVO: para que se vea
      form.append('file', new Blob([body], { type }), name);
      const response = await fetch(`${this.url}/attachments`, {
        method: 'POST',
        headers: this.headers(),
        body: form,
      });
    if (!response.ok) { this.warn(`no se pudo subir "${name}" (${response.status}).`); return false; }
      return true;
    } catch (error) {
      this.warn(`no se pudo subir "${name}" (${error.message}).`);
    }
  }
}

module.exports = QAtlasReporter;
module.exports.default = QAtlasReporter;