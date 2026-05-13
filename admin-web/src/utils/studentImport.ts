import { studentImportColumnAliases, type StudentImportColumnKey, type StudentImportStudents } from '../types/admin';

function normalizeSheetCell(value: unknown) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function normalizeStudentImportHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function mapStudentImportHeader(headers: string[]) {
  const normalizedHeaders = headers.map(normalizeStudentImportHeader);
  const entries = Object.entries(studentImportColumnAliases) as Array<[StudentImportColumnKey, readonly string[]]>;
  const columnMap = {} as Partial<Record<StudentImportColumnKey, number>>;

  for (const [key, aliases] of entries) {
    const aliasSet = new Set(aliases.map(normalizeStudentImportHeader));
    const columnIndex = normalizedHeaders.findIndex((item) => aliasSet.has(item));
    if (columnIndex >= 0) {
      columnMap[key] = columnIndex;
    }
  }

  return columnMap;
}

export function parseStudentImportRows(rows: unknown[][]): StudentImportStudents {
  const sanitizedRows = rows
    .map((row) => (Array.isArray(row) ? row.map(normalizeSheetCell) : []))
    .filter((row) => row.some(Boolean));

  if (!sanitizedRows.length) {
    return [];
  }

  const headerMap = mapStudentImportHeader(sanitizedRows[0]);
  const hasHeader = headerMap.studentNo !== undefined && headerMap.name !== undefined;
  const dataRows = hasHeader ? sanitizedRows.slice(1) : sanitizedRows;

  return dataRows.map((row, index) => {
    const studentNo = hasHeader ? row[headerMap.studentNo ?? -1] ?? '' : row[0] ?? '';
    const name = hasHeader ? row[headerMap.name ?? -1] ?? '' : row[1] ?? '';
    const className = hasHeader && headerMap.className !== undefined ? row[headerMap.className] ?? '' : '';
    const gradeName = hasHeader && headerMap.gradeName !== undefined ? row[headerMap.gradeName] ?? '' : '';
    const gender = hasHeader && headerMap.gender !== undefined ? row[headerMap.gender] ?? '' : row[2] ?? '';
    const avatarUrl = hasHeader && headerMap.avatarUrl !== undefined ? row[headerMap.avatarUrl] ?? '' : row[3] ?? '';

    if (!studentNo || !name) {
      throw new Error(`第 ${index + 1} 行缺少准考证号或姓名`);
    }

    return {
      studentNo,
      name,
      ...(className ? { className } : {}),
      ...(gradeName ? { gradeName } : {}),
      ...(gender ? { gender } : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
    };
  });
}

export function parseStudentImportText(input: string): StudentImportStudents {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [studentNo, name, gender] = line.split(/[,\s，]+/).filter(Boolean);
      if (!studentNo || !name) {
        throw new Error('每行至少需要“准考证号 姓名”，可选第三列性别');
      }
      return {
        studentNo,
        name,
        ...(gender ? { gender } : {}),
      };
    });
}
