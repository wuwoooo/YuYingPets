const { existsSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const backendRoot = path.resolve(__dirname, '..');
const xlsPath = path.resolve(backendRoot, '../doc/加扣分-教务模块（课堂、作业、学业）.xls');
const generatorPath = path.resolve(__dirname, 'generate_score_rule_sql_from_xls.py');
const sqlPath = path.resolve(__dirname, '../sql/score_rule_full_from_xls.sql');
const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');

function resolvePythonExecutable() {
  const candidates = [
    process.env.XLS_IMPORT_PYTHON,
    '/Users/wuwoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',
    'python3',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate.includes(path.sep)) {
      if (existsSync(candidate)) {
        return candidate;
      }
      continue;
    }
    return candidate;
  }

  throw new Error('未找到可用的 Python 解释器，请设置 XLS_IMPORT_PYTHON。');
}

function runOrThrow(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd: backendRoot,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });

  if (result.status !== 0) {
    throw new Error(`命令执行失败: ${command} ${args.join(' ')}`);
  }
}

function main() {
  const generateOnly = process.argv.includes('--generate-only');
  const python = resolvePythonExecutable();

  runOrThrow(
    python,
    [generatorPath, '--input', xlsPath, '--output', sqlPath],
    {
      PYTHONPATH:
        process.env.PYTHONPATH ||
        '/Users/wuwoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/python',
    },
  );

  if (generateOnly) {
    return;
  }

  runOrThrow('npx', ['prisma', 'db', 'execute', '--file', sqlPath, '--schema', schemaPath]);
}

main();
