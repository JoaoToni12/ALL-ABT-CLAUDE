// PostToolUse hook: Auto-formats files after Write/Edit using prettier
// Triggered on: Write, Edit tool completions
// Lazy: only runs prettier when the project actually uses prettier.
const { shouldRun } = require(require('path').join(__dirname, 'hook-profile-check'));
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);

    // Skip in minimal profile — formatting is nice-to-have, not critical
    if (!shouldRun('auto-format', 'standard').shouldRun) {
      process.stdout.write(data);
      return;
    }

    const filePath = input.tool_input && (input.tool_input.file_path || '');
    if (!filePath) {
      process.stdout.write(data);
      return;
    }

    // Only format file types prettier supports well
    const ext = path.extname(filePath).toLowerCase();
    const FORMATTABLE = new Set([
      '.js', '.jsx', '.ts', '.tsx', '.json',
      '.css', '.scss', '.less', '.html',
      '.md', '.yaml', '.yml', '.graphql', '.gql',
    ]);

    if (!FORMATTABLE.has(ext)) {
      process.stdout.write(data);
      return;
    }

    // Walk up from the file's directory to find a prettier config or a package.json that mentions prettier.
    // Bail out cheaply if none is found — avoids 3-8s `npx prettier` cold-start in projects that don't use it.
    const findProjectPrettier = (startDir) => {
      const PRETTIER_CONFIGS = [
        '.prettierrc', '.prettierrc.json', '.prettierrc.js', '.prettierrc.cjs',
        '.prettierrc.yaml', '.prettierrc.yml', '.prettierrc.toml',
        'prettier.config.js', 'prettier.config.cjs', 'prettier.config.mjs',
      ];
      let dir = startDir;
      const root = path.parse(dir).root;
      while (dir && dir !== root) {
        for (const cfg of PRETTIER_CONFIGS) {
          if (fs.existsSync(path.join(dir, cfg))) return dir;
        }
        const pkgPath = path.join(dir, 'package.json');
        if (fs.existsSync(pkgPath)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            if (pkg.prettier) return dir;
            const deps = { ...(pkg.devDependencies || {}), ...(pkg.dependencies || {}) };
            if (deps.prettier) return dir;
          } catch {
            // ignore malformed package.json
          }
          // package.json without prettier — stop walking; this is the project root
          return null;
        }
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
      }
      return null;
    };

    const projectDir = findProjectPrettier(path.dirname(filePath));
    if (!projectDir) {
      process.stdout.write(data);
      return;
    }

    // Run prettier — fail silently if not installed or config issues
    try {
      execFileSync('npx', ['prettier', '--write', filePath], {
        cwd: projectDir,
        encoding: 'utf8',
        timeout: 15000,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      });
      process.stderr.write(`[FORMAT] prettier applied to ${path.basename(filePath)}\n`);
    } catch {
      // prettier not available or failed — skip silently
    }

    process.stdout.write(data);
  } catch (e) {
    process.stdout.write(data);
  }
});
