// PreToolUse hook: Warns when MCP write tools (Linear, Notion, Slack) carry PII in their input.
// Strategy: scan tool_input for CPF/CNPJ/phone/email; if found, return permissionDecision: "ask"
// so the user explicitly confirms before publishing PII into a ticket/page/channel.
//
// Profile gating: only runs in "paranoid" profile to avoid blocking every legit MCP write.
const { shouldRun } = require(require('path').join(__dirname, 'hook-profile-check'));

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);

    if (!shouldRun('pii-mcp-write', 'paranoid').shouldRun) {
      process.stdout.write(JSON.stringify({ continue: true }));
      return;
    }

    const toolName = input.tool_name || '';
    // Only inspect MCP write tools — read tools (search, fetch, get_*) are safe.
    const isMcpWrite =
      /^mcp__linear__save_/.test(toolName) ||
      /^mcp__notion__notion-(create|update|move|duplicate)/.test(toolName) ||
      /^mcp__slack__/.test(toolName);

    if (!isMcpWrite) {
      process.stdout.write(JSON.stringify({ continue: true }));
      return;
    }

    const blob = JSON.stringify(input.tool_input || {});

    const detectors = [
      { name: 'CPF formatted', re: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/ },
      { name: 'CPF (raw 11 digits)', re: /\b\d{11}\b/, validate: isValidCPF },
      { name: 'CNPJ formatted', re: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/ },
      { name: 'CNPJ (raw 14 digits)', re: /\b\d{14}\b/, validate: isValidCNPJ },
      { name: 'BR phone', re: /\b(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/ },
      { name: 'Email', re: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/ },
    ];

    const found = [];
    for (const d of detectors) {
      const m = blob.match(d.re);
      if (!m) continue;
      if (d.validate && !d.validate(m[0])) continue;
      found.push(d.name);
    }

    if (found.length === 0) {
      process.stdout.write(JSON.stringify({ continue: true }));
      return;
    }

    const reason = `[PII WARN] MCP write (${toolName}) parece carregar PII: ${[...new Set(found)].join(', ')}. ` +
      `Confirme se isso vai mesmo para ${toolName.startsWith('mcp__linear') ? 'Linear' : toolName.startsWith('mcp__notion') ? 'Notion' : 'Slack'} ` +
      `(em vez de referenciar por transaction ID ou hash).`;

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: reason,
      },
    }));
  } catch (e) {
    process.stdout.write(JSON.stringify({ continue: true }));
  }
});

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
