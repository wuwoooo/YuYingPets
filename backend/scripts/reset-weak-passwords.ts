import { PrismaClient } from '@prisma/client';
import { compare, hashSync } from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

const prisma = new PrismaClient();
const USER_SCAN_CONCURRENCY = 8;

type Options = {
  apply: boolean;
  includeDisabled: boolean;
  schoolCode?: string;
  output?: string;
  onlyPassword?: string;
  extraWeakPasswords: string[];
};

type ResetRow = {
  id: string;
  schoolCode: string;
  schoolName: string;
  username: string;
  name: string;
  phone: string;
  roleCode: string;
  roleName: string;
  matchedReasons: string[];
  temporaryPassword: string;
};

function printUsage() {
  console.log(`
用法:
  npm run security:reset-weak-passwords -- --dry-run
  npm run security:reset-weak-passwords -- --apply
  npm run security:reset-weak-passwords -- --apply --school-code=YYXX
  npm run security:reset-weak-passwords -- --apply --only-password=123456
  npm run security:reset-weak-passwords -- --apply --extra=654321,qwer1234

说明:
  1. 默认是 dry-run，只识别弱密码账号，不修改数据库。
  2. 加 --apply 后才会重置命中的账号密码，并导出一次性发放清单 CSV。
  3. 加 --only-password=123456 时，只认定该明文密码为弱密码。
  4. 默认命中的弱口令包括 123456、常见弱口令、用户名、姓名、手机号、手机号后 6 位等。
  5. 执行 --apply 后请同步轮换生产 JWT_SECRET 并重启服务，否则 7 天内旧 token 仍可能有效。
`);
}

function parseArgs(argv: string[]): Options {
  if (argv.includes('--help') || argv.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const getValue = (prefix: string) => {
    const item = argv.find((arg) => arg.startsWith(prefix));
    return item ? item.slice(prefix.length).trim() : undefined;
  };

  const extra = getValue('--extra=');
  return {
    apply: argv.includes('--apply'),
    includeDisabled: argv.includes('--include-disabled'),
    schoolCode: getValue('--school-code='),
    output: getValue('--output='),
    onlyPassword: getValue('--only-password='),
    extraWeakPasswords: extra
      ? extra
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
  };
}

function normalizePhone(value: string | null | undefined) {
  return String(value ?? '').replace(/\D/g, '');
}

function addCandidate(candidates: Map<string, string[]>, value: string | null | undefined, reason: string) {
  const normalized = String(value ?? '').trim();
  if (!normalized) return;
  const reasons = candidates.get(normalized) ?? [];
  reasons.push(reason);
  candidates.set(normalized, reasons);
}

function buildWeakPasswordCandidates(
  user: { username: string; name: string; phone: string | null },
  options: Pick<Options, 'extraWeakPasswords' | 'onlyPassword'>,
) {
  const candidates = new Map<string, string[]>();
  if (options.onlyPassword) {
    addCandidate(candidates, options.onlyPassword, `指定弱口令:${options.onlyPassword}`);
    return candidates;
  }
  const phone = normalizePhone(user.phone);
  const commonWeakPasswords = [
    '123456',
    '12345678',
    '123456789',
    '111111',
    '000000',
    '666666',
    '888888',
    'password',
    'qwerty',
    'abc123',
    'admin',
  ];

  commonWeakPasswords.forEach((item) => addCandidate(candidates, item, `常见弱口令:${item}`));
  options.extraWeakPasswords.forEach((item) => addCandidate(candidates, item, `追加弱口令:${item}`));
  addCandidate(candidates, user.username, '用户名同密码');
  addCandidate(candidates, user.name, '姓名同密码');

  if (phone) {
    addCandidate(candidates, phone, '手机号同密码');
    if (phone.length >= 6) addCandidate(candidates, phone.slice(-6), '手机号后6位');
    if (phone.length >= 8) addCandidate(candidates, phone.slice(-8), '手机号后8位');
  }

  return candidates;
}

async function findMatchedWeakReasons(
  passwordHash: string,
  candidates: Map<string, string[]>,
) {
  const results = await Promise.all(
    Array.from(candidates.entries()).map(async ([candidate, reasons]) => {
      const matched = await compare(candidate, passwordHash).catch(() => false);
      return matched ? reasons : [];
    }),
  );
  return results.flat();
}

function createTemporaryPassword() {
  return randomBytes(12).toString('base64url');
}

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function renderCsv(rows: ResetRow[]) {
  const headers = [
    'user_id',
    'school_code',
    'school_name',
    'username',
    'name',
    'phone',
    'role_code',
    'role_name',
    'matched_reasons',
    'temporary_password',
  ];
  const body = rows.map((row) =>
    [
      row.id,
      row.schoolCode,
      row.schoolName,
      row.username,
      row.name,
      row.phone,
      row.roleCode,
      row.roleName,
      row.matchedReasons.join(';'),
      row.temporaryPassword,
    ].map(csvEscape).join(','),
  );
  return `${headers.join(',')}\n${body.join('\n')}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const outputPath = path.resolve(
    options.output ??
      path.join(
        process.cwd(),
        'security-reports',
        `weak-password-reset-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`,
      ),
  );

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(options.includeDisabled ? {} : { status: 'enabled' }),
      ...(options.schoolCode ? { school: { code: options.schoolCode } } : {}),
    },
    include: {
      school: { select: { code: true, name: true } },
      role: { select: { code: true, name: true } },
    },
    orderBy: [{ schoolId: 'asc' }, { id: 'asc' }],
  });

  const resetRows: ResetRow[] = [];
  let scannedCount = 0;
  for (let index = 0; index < users.length; index += USER_SCAN_CONCURRENCY) {
    const batch = users.slice(index, index + USER_SCAN_CONCURRENCY);
    const batchRows = await Promise.all(
      batch.map(async (user) => {
        const candidates = buildWeakPasswordCandidates(user, options);
        const matchedReasons = await findMatchedWeakReasons(user.passwordHash, candidates);
        if (matchedReasons.length === 0) return null;

        const temporaryPassword = options.apply ? createTemporaryPassword() : '';
        if (options.apply) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              passwordHash: hashSync(temporaryPassword, 10),
              passwordChangeRequired: true,
            },
          });
        }

        return {
          id: String(user.id),
          schoolCode: user.school.code,
          schoolName: user.school.name,
          username: user.username,
          name: user.name,
          phone: user.phone ?? '',
          roleCode: user.role.code,
          roleName: user.role.name,
          matchedReasons,
          temporaryPassword,
        } satisfies ResetRow;
      }),
    );
    resetRows.push(...batchRows.filter((row): row is ResetRow => row !== null));
    scannedCount += batch.length;
    console.log(`扫描进度: ${scannedCount}/${users.length}，当前命中: ${resetRows.length}`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderCsv(resetRows), 'utf8');

  console.log(`扫描账号数: ${users.length}`);
  console.log(`命中弱密码账号数: ${resetRows.length}`);
  console.log(`模式: ${options.apply ? '已重置' : 'dry-run 未修改数据库'}`);
  console.log(`报告: ${outputPath}`);
  if (!options.apply) {
    console.log('如确认无误，执行: npm run security:reset-weak-passwords -- --apply');
  } else {
    console.log('已生成临时密码清单。请立即通过安全渠道发放，并轮换生产 JWT_SECRET 后重启服务，使旧 token 失效。');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
