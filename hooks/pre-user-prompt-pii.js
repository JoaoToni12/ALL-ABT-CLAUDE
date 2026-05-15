// UserPromptSubmit hook: Blocks prompts containing raw Brazilian PII.
// Detects: CPF (formatted + checksum-validated unformatted), CNPJ, BR phone, email.
// Behavior: emits permissionDecision: "deny" with a redaction hint so the user re-submits scrubbed input.
//
// Limitation (confirmed in Claude Code docs / issue #53330):
// UserPromptSubmit hooks cannot rewrite the prompt — only block or append context.
// So the policy is "block with explanation", not "silently redact".
//
// Profile gating: only runs if hook-profile-check says "paranoid". In other profiles it's a no-op
// so casual sessions aren't friction-blocked by every email/phone in a paste.
const { shouldRun } = require(require('path').join(__dirname, 'hook-profile-check'));

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);

    if (!shouldRun('pii-prompt', 'paranoid').shouldRun) {
      process.stdout.write(JSON.stringify({ continue: true }));
      return;
    }

    const prompt = input.prompt || '';

    // Build detection list. Each entry: name, regex, optional validator.
    const detectors = [
      { name: 'CPF formatted', re: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g },
      { name: 'CPF (raw 11 digits)', re: /\b\d{11}\b/g, validate: isValidCPF },
      { name: 'CNPJ formatted', re: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g },
      { name: 'CNPJ (raw 14 digits)', re: /\b\d{14}\b/g, validate: isValidCNPJ },
      { name: 'BR phone', re: /\b(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/g },
      { name: 'Email', re: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g },
    ];

    const findings = [];
    for (const d of detectors) {
      const matches = [...prompt.matchAll(d.re)];
      for (const m of matches) {
        const val = m[0];
        if (d.validate && !d.validate(val)) continue;
        findings.push({ type: d.name, value: maskPreview(val), index: m.index });
      }
    }

    if (findings.length === 0) {
      process.stdout.write(JSON.stringify({ continue: true }));
      return;
    }

    // Deduplicate by type for the user-facing message.
    const byType = {};
    for (const f of findings) {
      byType[f.type] = (byType[f.type] || 0) + 1;
    }
    const summary = Object.entries(byType)
      .map(([t, c]) => `${c}× ${t}`)
      .join(', ');

    const reason = `[PII GUARD] Detectado PII no prompt: ${summary}. ` +
      `Redacte (substitua por transaction ID ou hash) e re-submeta. ` +
      `Para casos legítimos (ex.: você está pedindo análise de um caso específico em ambiente seguro), ` +
      `desligue o hook-profile com /hook-profile e re-submeta.`;

    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason,
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }));
  } catch (e) {
    // On any failure, never block — let the prompt through.
    process.stdout.write(JSON.stringify({ continue: true }));
  }
});

function maskPreview(s) {
  if (s.length <= 4) return '***';
  return s.slice(0, 2) + '***' + s.slice(-2);
}

function isValidCPF(raw) {
  const cpf = raw.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(cpf[i], 10) * (10 - i);
  let d1 = 11 - (s % 11);
  if (d1 >= 10) d1 = 0;
  if (d1 !== parseInt(cpf[9], 10)) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(cpf[i], 10) * (11 - i);
  let d2 = 11 - (s % 11);
  if (d2 >= 10) d2 = 0;
  return d2 === parseInt(cpf[10], 10);
}

function isValidCNPJ(raw) {
  const cnpj = raw.replace(/\D/g, '');
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let s = 0;
  for (let i = 0; i < 12; i++) s += parseInt(cnpj[i], 10) * w1[i];
  let d1 = s % 11 < 2 ? 0 : 11 - (s % 11);
  if (d1 !== parseInt(cnpj[12], 10)) return false;
  s = 0;
  for (let i = 0; i < 13; i++) s += parseInt(cnpj[i], 10) * w2[i];
  let d2 = s % 11 < 2 ? 0 : 11 - (s % 11);
  return d2 === parseInt(cnpj[13], 10);
}
