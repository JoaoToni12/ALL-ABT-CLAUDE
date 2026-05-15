// PreToolUse hook: escalates destructive MCP calls to user confirmation.
// Strategy: for any matched destructive tool, emit permissionDecision: "ask".
// This doesn't block — it just forces the permission dialog so the user sees
// what target/ID is about to be deleted/overwritten.
//
// Profile gating: runs in "standard" and "paranoid". In "minimal" it's off.
const { shouldRun } = require(require('path').join(__dirname, 'hook-profile-check'));

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);

    if (!shouldRun('mcp-destructive', 'standard').shouldRun) {
      process.stdout.write(JSON.stringify({ continue: true }));
      return;
    }

    const toolName = input.tool_name || '';

    // Catalogue of destructive MCP operations across the servers in use.
    const destructive = [
      // n8n
      /^mcp__n8n-mcp__n8n_delete_workflow$/,
      /^mcp__n8n-mcp__n8n_delete_/,
      /^mcp__n8n-mcp__n8n_update_full_workflow$/, // full replace = destructive
      // Linear
      /^mcp__linear__delete_/,
      // Notion
      /^mcp__notion__notion-update-data-source$/,
      /^mcp__notion__notion-move-pages$/,
      // GitLab
      /^mcp__gitlab__.*delete/,
      /^mcp__gitlab__.*merge_merge_request/,
      // Generic "delete|remove" across any MCP server
      /^mcp__[^_]+__.*(delete|remove)/,
    ];

    const matched = destructive.some(re => re.test(toolName));
    if (!matched) {
      process.stdout.write(JSON.stringify({ continue: true }));
      return;
    }

    // Build a target-aware description so the dialog is useful.
    const input_ = input.tool_input || {};
    const targetHints = [];
    if (input_.workflowId) targetHints.push(`workflowId=${input_.workflowId}`);
    if (input_.id) targetHints.push(`id=${input_.id}`);
    if (input_.issueId) targetHints.push(`issueId=${input_.issueId}`);
    if (input_.teamId) targetHints.push(`teamId=${input_.teamId}`);
    if (input_.pageId || input_.page_id) targetHints.push(`pageId=${input_.pageId || input_.page_id}`);
    if (input_.dataSourceId || input_.data_source_id) targetHints.push(`dataSourceId=${input_.dataSourceId || input_.data_source_id}`);
    const target = targetHints.length ? ` (${targetHints.join(', ')})` : '';

    const reason = `[MCP GUARD] Operação destrutiva: ${toolName}${target}. ` +
      `Confirme o alvo antes de aplicar — esta ação não tem rollback automático.`;

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
