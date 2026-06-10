import type { AcademicScoreImportPayload } from '../lib/api';
import { readXlsxWorkbookRows } from './workbookRows';

type CellValue = string | number | null;
type BiffCellMap = Map<number, Map<number, CellValue>>;

const subjectMetricKeys = ['score', 'jointRank', 'schoolRank', 'schoolRankDelta', 'classRank', 'classRankDelta'] as const;
const metricLabelMap: Record<string, (typeof subjectMetricKeys)[number]> = {
  得分: 'score',
  联考排名: 'jointRank',
  校次: 'schoolRank',
  校次进退步: 'schoolRankDelta',
  班次: 'classRank',
  班次进退步: 'classRankDelta',
};

function normalizeCellText(value: CellValue) {
  return String(value ?? '').trim();
}

function normalizeHeader(value: CellValue) {
  return normalizeCellText(value).replace(/\s+/g, '');
}

function toNumberOrNull(value: CellValue) {
  if (value === null || value === undefined || value === '' || value === '-') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function cleanExamName(value: string) {
  const normalized = value.trim();
  if (!normalized) return normalized;
  const match = normalized.match(/^(.*?(?:成绩汇总|考生成绩汇总))\s*[-—–:：]+\s*(.+)$/);
  const cleaned = (match?.[2]?.trim() || normalized).replace(/^（[^）]*年级）\s*/, '').trim();
  return cleaned;
}

const GRADE_NAMES = [
  '一年级',
  '二年级',
  '三年级',
  '四年级',
  '五年级',
  '六年级',
  '七年级',
  '八年级',
  '九年级',
  '高一',
  '高二',
  '高三',
];

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function formatDateInput(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function isValidDateParts(year: number, month: number, day: number) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return probe.getUTCFullYear() === year && probe.getUTCMonth() + 1 === month && probe.getUTCDate() === day;
}

type ParsedPeriod = {
  startYear: number;
  endYear: number;
  term: 'first' | 'second';
};

function detectTermByText(text: string) {
  if (/上学期|第一学期|秋季学期|秋学期|秋期/.test(text)) return 'first' as const;
  if (/下学期|第二学期|春季学期|春学期|春期/.test(text)) return 'second' as const;
  return null;
}

function normalizeTermLabel(termText: string) {
  return termText === '上学期' || termText === '第一学期' ? '上学期' : '下学期';
}

/** 将「第一/第二学期」等写法统一规范为「上/下学期」 */
export function normalizeAcademicPeriodLabel(label: string) {
  const trimmed = label.trim();
  if (!trimmed) return '';

  const text = trimmed.replace(/\s+/g, '');
  const matched = matchSchoolYearWithExplicitTerm(text);
  if (matched) return matched.label;

  return text.replace(/第一学期/g, '上学期').replace(/第二学期/g, '下学期');
}

function matchSchoolYearWithExplicitTerm(text: string) {
  const matched = text.match(/(20\d{2})\s*[-—–~至]\s*(20\d{2})(?:学年)?.*?(上学期|下学期|第一学期|第二学期)/);
  if (!matched) return null;
  const termLabel = normalizeTermLabel(matched[3]);
  return {
    startYear: Number(matched[1]),
    endYear: Number(matched[2]),
    term: termLabel === '上学期' ? ('first' as const) : ('second' as const),
    label: `${matched[1]}-${matched[2]}学年${termLabel}`,
  };
}

export function parseAcademicPeriodLabel(label: string): ParsedPeriod | null {
  const text = label.replace(/\s+/g, '');
  const matched = matchSchoolYearWithExplicitTerm(text);
  if (!matched) return null;
  return {
    startYear: matched.startYear,
    endYear: matched.endYear,
    term: matched.term,
  };
}

export function inferAcademicPeriodLabel(sourceText: string, examDate?: string, fallback?: string | null) {
  const text = sourceText.replace(/\s+/g, '');
  let result = '';

  const explicitSchoolYear = matchSchoolYearWithExplicitTerm(text);
  if (explicitSchoolYear) {
    result = explicitSchoolYear.label;
  } else {
    const schoolYear = text.match(/(20\d{2})\s*[-—–~至]\s*(20\d{2})(?:学年)?/);
    const termByText = detectTermByText(text);
    if (schoolYear && termByText) {
      result = `${schoolYear[1]}-${schoolYear[2]}学年${termByText === 'first' ? '上学期' : '下学期'}`;
    } else if (termByText) {
      const yearInText = text.match(/(20\d{2})年/);
      if (yearInText) {
        const year = Number(yearInText[1]);
        result = termByText === 'first'
          ? `${year}-${year + 1}学年上学期`
          : `${year - 1}-${year}学年下学期`;
      }
    }

    if (!result && examDate) {
      const date = new Date(`${examDate}T00:00:00.000Z`);
      if (!Number.isNaN(date.getTime())) {
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth() + 1;
        if (month >= 9 && month <= 12) result = `${year}-${year + 1}学年上学期`;
        else if (month === 1) result = `${year - 1}-${year}学年上学期`;
        else if (month >= 2 && month <= 7) result = `${year - 1}-${year}学年下学期`;
      }
    }

    if (!result) {
      result = fallback ?? '';
    }
  }

  return normalizeAcademicPeriodLabel(result);
}

export function inferAcademicGradeName(sourceText: string, fallback?: string) {
  const text = sourceText.replace(/\s+/g, '');
  for (const grade of GRADE_NAMES) {
    if (text.includes(grade)) return grade;
  }
  return fallback?.match(/^(.*?年级)/)?.[1] ?? fallback ?? '';
}

function hasAcademicPeriodInfo(text: string) {
  const normalized = text.replace(/\s+/g, '');
  if (matchSchoolYearWithExplicitTerm(normalized)) return true;
  const hasYear = /(20\d{2})\s*[-—–~至]\s*(20\d{2})(?:学年)?/.test(normalized);
  const hasTerm = /上学期|下学期|第一学期|第二学期/.test(normalized);
  return hasYear && hasTerm;
}

/** 标题缺少学年/学期信息时，默认补上识别到的学期标签 */
export function enrichExamNameWithPeriod(examName: string, periodLabel: string) {
  const name = examName.trim();
  const period = periodLabel.trim();
  if (!name || !period) return name;
  if (hasAcademicPeriodInfo(name)) return name;
  if (name.startsWith(period)) return name;
  return `${period} · ${name}`;
}

function inferDefaultDay(text: string, year: number, month: number) {
  if (/期末/.test(text)) return lastDayOfMonth(year, month);
  if (/开学|期初/.test(text)) return 5;
  if (/阶段|测评|月考/.test(text)) return 20;
  return 15;
}

function resolveYearForMonth(month: number, period: ParsedPeriod | null) {
  if (!period) return null;
  if (period.term === 'first') {
    if (month >= 9) return period.startYear;
    if (month <= 1) return period.endYear;
    return period.startYear;
  }
  if (month >= 2 && month <= 8) return period.endYear;
  if (month === 1) return period.endYear;
  if (month >= 9) return period.startYear;
  return period.endYear;
}

function inferDateFromMonthLabel(sourceText: string, period: ParsedPeriod | null) {
  const text = sourceText.replace(/\s+/g, '');
  const monthPatterns = [
    /(?:^|[^\d年])((?:1[0-2])|[1-9])月(?:份)?(?:阶段|测评|考试|模考|质检|联考|月考|统考|测试|测验|考核)/,
    /(?:^|[^\d年])((?:1[0-2])|[1-9])月(?:份)?(?=(?:上|中|下)?(?:旬|周)|$)/,
    /(?:^|[^\d年])((?:1[0-2])|[1-9])月考/,
  ];

  for (const pattern of monthPatterns) {
    const matched = text.match(pattern);
    if (!matched) continue;
    const month = Number(matched[1]);
    if (month < 1 || month > 12) continue;
    const year = resolveYearForMonth(month, period);
    if (!year) continue;
    return formatDateInput(year, month, inferDefaultDay(text, year, month));
  }

  return null;
}

function inferDateFromExamType(sourceText: string, period: ParsedPeriod | null) {
  if (!period) return null;
  const text = sourceText.replace(/\s+/g, '');
  const isMidterm = /期中/.test(text);
  const isFinal = /期末/.test(text);
  const isMock = /模拟|模考|质检|联考|学业水平/.test(text);

  if (period.term === 'first') {
    if (isFinal) return formatDateInput(period.endYear, 1, 15);
    if (isMidterm) return formatDateInput(period.startYear, 11, 15);
    if (isMock) return formatDateInput(period.startYear, 11, 1);
    if (/阶段|测评|月考/.test(text)) return null;
    return formatDateInput(period.startYear, 10, 15);
  }

  if (isFinal) return formatDateInput(period.endYear, 6, 25);
  if (isMidterm) return formatDateInput(period.endYear, 4, 15);
  if (isMock) return formatDateInput(period.endYear, 4, 1);
  if (/阶段|测评|月考/.test(text)) return null;
  return formatDateInput(period.endYear, 3, 15);
}

function inferDateFromSemesterRange(
  sourceText: string,
  semesterStartDate?: string,
  semesterEndDate?: string,
) {
  if (!semesterStartDate || !semesterEndDate) return null;
  const start = new Date(`${semesterStartDate}T00:00:00.000Z`);
  const end = new Date(`${semesterEndDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const text = sourceText.replace(/\s+/g, '');
  const ratio = /期末/.test(text) ? 0.92 : /期中/.test(text) ? 0.45 : /模拟|模考|质检|联考|学业水平/.test(text) ? 0.55 : 0.5;
  const spanMs = end.getTime() - start.getTime();
  const inferred = new Date(start.getTime() + spanMs * ratio);
  return formatDateInput(
    inferred.getUTCFullYear(),
    inferred.getUTCMonth() + 1,
    inferred.getUTCDate(),
  );
}

export function inferAcademicExamDate(
  sourceText: string,
  options?: {
    periodLabel?: string;
    semesterStartDate?: string;
    semesterEndDate?: string;
    fallback?: string;
  },
) {
  const text = sourceText.replace(/\s+/g, '');

  const fullDate = text.match(/(20\d{2})年(\d{1,2})月(\d{1,2})日?/);
  if (fullDate) {
    const year = Number(fullDate[1]);
    const month = Number(fullDate[2]);
    const day = Number(fullDate[3]);
    if (isValidDateParts(year, month, day)) {
      return formatDateInput(year, month, day);
    }
  }

  const isoDate = text.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoDate) {
    const year = Number(isoDate[1]);
    const month = Number(isoDate[2]);
    const day = Number(isoDate[3]);
    if (isValidDateParts(year, month, day)) {
      return formatDateInput(year, month, day);
    }
  }

  const yearMonth = text.match(/(20\d{2})年(\d{1,2})月(?!(\d{1,2})日)/);
  if (yearMonth) {
    const year = Number(yearMonth[1]);
    const month = Number(yearMonth[2]);
    if (month >= 1 && month <= 12) {
      return formatDateInput(year, month, inferDefaultDay(text, year, month));
    }
  }

  const periodLabel = options?.periodLabel ?? inferAcademicPeriodLabel(sourceText, undefined, null);
  const parsedPeriod = parseAcademicPeriodLabel(periodLabel);
  const monthLabelDate = inferDateFromMonthLabel(text, parsedPeriod);
  if (monthLabelDate) return monthLabelDate;

  const typedDate = inferDateFromExamType(text, parsedPeriod);
  if (typedDate) return typedDate;

  const rangedDate = inferDateFromSemesterRange(text, options?.semesterStartDate, options?.semesterEndDate);
  if (rangedDate) return rangedDate;

  if (options?.fallback) return options.fallback;
  return new Date().toISOString().slice(0, 10);
}

export function resolveAcademicImportDraft(
  parsed: AcademicScoreImportPayload,
  fileName: string,
  options?: {
    currentSemesterName?: string | null;
    currentSemesterStartDate?: string | null;
    currentSemesterEndDate?: string | null;
    fallbackExamDate?: string;
  },
) {
  const sourceText = `${parsed.examName} ${parsed.sourceFile ?? fileName}`;
  const periodLabelFromText = inferAcademicPeriodLabel(sourceText, undefined, options?.currentSemesterName);
  const examDate = inferAcademicExamDate(sourceText, {
    periodLabel: periodLabelFromText,
    semesterStartDate: options?.currentSemesterStartDate ?? undefined,
    semesterEndDate: options?.currentSemesterEndDate ?? undefined,
    fallback: options?.fallbackExamDate,
  });
  const periodLabel = inferAcademicPeriodLabel(sourceText, examDate, options?.currentSemesterName);
  const gradeName = inferAcademicGradeName(sourceText, parsed.gradeName);
  const examName = enrichExamNameWithPeriod(parsed.examName, periodLabel);

  return {
    examName,
    gradeName,
    examDate,
    periodLabel,
    sourceText,
  };
}

function rowToArray(cells: BiffCellMap, rowIndex: number) {
  const row = cells.get(rowIndex);
  if (!row) return [];
  const maxCol = Math.max(...row.keys());
  return Array.from({ length: maxCol + 1 }, (_, index) => row.get(index) ?? '');
}

export function parseAcademicScoreRows(rows: CellValue[][], sourceFile?: string): AcademicScoreImportPayload {
  const titleRow = rows.find((row) => row.some((cell) => normalizeCellText(cell)));
  const title = normalizeCellText(titleRow?.find((cell) => normalizeCellText(cell)) ?? '');
  const headerRowIndex = rows.findIndex((row) =>
    row.some((cell) => normalizeHeader(cell) === '准考证号') &&
    row.some((cell) => normalizeHeader(cell) === '姓名') &&
    row.some((cell) => normalizeHeader(cell) === '班级'),
  );
  if (headerRowIndex < 0) {
    throw new Error('成绩表缺少“准考证号、班级、姓名”表头');
  }

  const groupHeader = rows[headerRowIndex] ?? [];
  const metricHeader = rows[headerRowIndex + 1] ?? [];
  const studentNoCol = groupHeader.findIndex((cell) => normalizeHeader(cell) === '准考证号');
  const classCol = groupHeader.findIndex((cell) => normalizeHeader(cell) === '班级');
  const nameCol = groupHeader.findIndex((cell) => normalizeHeader(cell) === '姓名');
  if (studentNoCol < 0 || classCol < 0 || nameCol < 0) {
    throw new Error('成绩表基础列不完整');
  }

  const subjectColumns: Array<{
    subjectName: string;
    metrics: Partial<Record<(typeof subjectMetricKeys)[number], number>>;
  }> = [];
  let currentSubject: { subjectName: string; metrics: Partial<Record<(typeof subjectMetricKeys)[number], number>> } | null = null;
  const maxColumnCount = Math.max(groupHeader.length, metricHeader.length);

  for (let col = 0; col < maxColumnCount; col += 1) {
    const groupLabel = normalizeHeader(groupHeader[col]);
    if (groupLabel && !['准考证号', '自定义考号', '班级', '姓名', '学生属性'].includes(groupLabel)) {
      currentSubject = { subjectName: groupLabel, metrics: {} };
      subjectColumns.push(currentSubject);
    }

    const metricKey = metricLabelMap[normalizeHeader(metricHeader[col])];
    if (currentSubject && metricKey) {
      currentSubject.metrics[metricKey] = col;
    }
  }

  if (!subjectColumns.length) {
    throw new Error('成绩表未识别到科目列');
  }

  const students = rows.slice(headerRowIndex + 2).flatMap((row) => {
    const studentNo = normalizeCellText(row[studentNoCol]);
    const className = normalizeCellText(row[classCol]);
    const name = normalizeCellText(row[nameCol]);
    if (!studentNo || !className || !name) return [];

    const subjects = subjectColumns.flatMap((subject) => {
      const scoreCol = subject.metrics.score;
      const hasAnyMetric = subjectMetricKeys.some((key) => {
        const col = subject.metrics[key];
        return col !== undefined && normalizeCellText(row[col]) !== '';
      });
      if (!hasAnyMetric && scoreCol === undefined) return [];
      return [{
        subjectName: subject.subjectName,
        score: scoreCol === undefined ? null : toNumberOrNull(row[scoreCol]),
        jointRank: subject.metrics.jointRank === undefined ? null : toNumberOrNull(row[subject.metrics.jointRank]),
        schoolRank: subject.metrics.schoolRank === undefined ? null : toNumberOrNull(row[subject.metrics.schoolRank]),
        schoolRankDelta: subject.metrics.schoolRankDelta === undefined ? null : toNumberOrNull(row[subject.metrics.schoolRankDelta]),
        classRank: subject.metrics.classRank === undefined ? null : toNumberOrNull(row[subject.metrics.classRank]),
        classRankDelta: subject.metrics.classRankDelta === undefined ? null : toNumberOrNull(row[subject.metrics.classRankDelta]),
      }];
    });

    return subjects.length ? [{ studentNo, className, name, subjects }] : [];
  });

  const gradeName = inferAcademicGradeName(`${title} ${sourceFile ?? ''}`, students[0]?.className.match(/^(.*?年级)/)?.[1]) || undefined;

  return {
    examName: cleanExamName(title || sourceFile || '成绩汇总'),
    gradeName,
    sourceFile,
    students,
  };
}

export async function parseAcademicScoreWorkbook(file: File): Promise<AcademicScoreImportPayload> {
  const lowerName = file.name.toLowerCase();
  let rows: CellValue[][] | undefined;

  if (lowerName.endsWith('.xlsx')) {
    [rows] = await readXlsxWorkbookRows(file);
  } else if (lowerName.endsWith('.xls')) {
    rows = await parseLegacyXlsRows(await file.arrayBuffer());
  } else {
    throw new Error('历史成绩导入仅支持 .xlsx 和 .xls 文件');
  }

  if (!rows || !rows.length) {
    throw new Error('Excel 文件中没有可读取的工作表');
  }
  return parseAcademicScoreRows(rows, file.name);
}

export async function parseLegacyXlsRows(buffer: ArrayBuffer): Promise<CellValue[][]> {
  let bytes = new Uint8Array(buffer);
  
  if (readU32(bytes, 0) === 0xE011CFD0) {
    const sectorShift = readU16(bytes, 30);
    const sectorSize = 1 << sectorShift;
    const dirSectorStart = readU32(bytes, 48);
    const miniCutoff = readU32(bytes, 56);
    
    const fat: number[] = [];
    for (let i = 0; i < 109; i++) {
      const sec = readU32(bytes, 76 + i * 4);
      if (sec !== 0xFFFFFFFF) {
        const offset = (sec + 1) * sectorSize;
        for (let j = 0; j < sectorSize / 4; j++) {
          fat.push(readU32(bytes, offset + j * 4));
        }
      }
    }
    
    let workbookStart = -1;
    let workbookSize = 0;
    
    let dirSec = dirSectorStart;
    while (dirSec !== 0xFFFFFFFE && dirSec !== 0xFFFFFFFF && dirSec !== 0) {
      const dirOffset = (dirSec + 1) * sectorSize;
      for (let i = 0; i < sectorSize / 128; i++) {
        const entryOffset = dirOffset + i * 128;
        const nameLen = readU16(bytes, entryOffset + 64);
        if (nameLen > 0) {
          let name = '';
          for (let c = 0; c < nameLen - 2; c += 2) {
            name += String.fromCharCode(readU16(bytes, entryOffset + c));
          }
          if (name === 'Workbook' || name === 'Book') {
            workbookStart = readU32(bytes, entryOffset + 116);
            workbookSize = readU32(bytes, entryOffset + 120);
          }
        }
      }
      dirSec = fat[dirSec];
    }
    
    if (workbookStart === -1) {
      throw new Error('未在 .xls 中找到 Workbook 数据流');
    }
    
    if (workbookSize < miniCutoff) {
      throw new Error('不支持读取 MiniFAT 存储的微型 .xls 文件，请转换为 .xlsx');
    }
    
    const out = new Uint8Array(workbookSize);
    let outOffset = 0;
    let currentSec = workbookStart;
    while (currentSec !== 0xFFFFFFFE && currentSec !== 0xFFFFFFFF && outOffset < workbookSize) {
      const secOffset = (currentSec + 1) * sectorSize;
      const toCopy = Math.min(sectorSize, workbookSize - outOffset);
      out.set(bytes.subarray(secOffset, secOffset + toCopy), outOffset);
      outOffset += toCopy;
      currentSec = fat[currentSec];
    }
    
    bytes = out;
  }

  const { sheetOffset, sharedStrings } = parseWorkbookGlobals(bytes);
  if (sheetOffset === null) {
    throw new Error('无法在旧版 .xls 文件中找到有效的工作表');
  }
  const cells = parseSheetCells(bytes, sheetOffset, sharedStrings);
  const rows: CellValue[][] = [];
  if (cells.size > 0) {
    const maxRow = Math.max(...cells.keys());
    for (let i = 0; i <= maxRow; i++) {
      rows.push(rowToArray(cells, i));
    }
  }
  return rows;
}

function parseWorkbookGlobals(workbook: Uint8Array) {
  let offset = 0;
  let sheetOffset: number | null = null;
  let sharedStrings: string[] = [];
  while (offset + 4 <= workbook.length) {
    const opcode = readU16(workbook, offset);
    const length = readU16(workbook, offset + 2);
    const payloadOffset = offset + 4;

    if (opcode === 0x0085 && sheetOffset === null) {
      sheetOffset = readU32(workbook, payloadOffset);
    }

    if (opcode === 0x00fc) {
      const segments = [workbook.slice(payloadOffset, payloadOffset + length)];
      let nextOffset = payloadOffset + length;
      while (nextOffset + 4 <= workbook.length && readU16(workbook, nextOffset) === 0x003c) {
        const nextLength = readU16(workbook, nextOffset + 2);
        segments.push(workbook.slice(nextOffset + 4, nextOffset + 4 + nextLength));
        nextOffset += 4 + nextLength;
      }
      sharedStrings = parseSharedStrings(segments);
    }

    offset = payloadOffset + length;
  }
  return { sheetOffset, sharedStrings };
}

function parseSheetCells(workbook: Uint8Array, sheetOffset: number, sharedStrings: string[]) {
  const cells: BiffCellMap = new Map();
  let offset = sheetOffset;
  while (offset + 4 <= workbook.length) {
    const opcode = readU16(workbook, offset);
    const length = readU16(workbook, offset + 2);
    const payloadOffset = offset + 4;
    if (opcode === 0x000a) break;

    if (opcode === 0x00fd) {
      setCell(cells, readU16(workbook, payloadOffset), readU16(workbook, payloadOffset + 2), sharedStrings[readU32(workbook, payloadOffset + 6)] ?? '');
    } else if (opcode === 0x0204) {
      const row = readU16(workbook, payloadOffset);
      const col = readU16(workbook, payloadOffset + 2);
      const charCount = readU16(workbook, payloadOffset + 6);
      const flags = workbook[payloadOffset + 8] ?? 0;
      setCell(cells, row, col, decodeText(workbook.slice(payloadOffset + 9, payloadOffset + 9 + charCount * ((flags & 1) ? 2 : 1)), Boolean(flags & 1)));
    } else if (opcode === 0x0203) {
      setCell(cells, readU16(workbook, payloadOffset), readU16(workbook, payloadOffset + 2), readF64(workbook, payloadOffset + 6));
    } else if (opcode === 0x027e) {
      setCell(cells, readU16(workbook, payloadOffset), readU16(workbook, payloadOffset + 2), decodeRk(readI32(workbook, payloadOffset + 6)));
    } else if (opcode === 0x00bd) {
      const row = readU16(workbook, payloadOffset);
      const firstCol = readU16(workbook, payloadOffset + 2);
      const lastCol = readU16(workbook, payloadOffset + length - 2);
      let cursor = payloadOffset + 4;
      for (let col = firstCol; col <= lastCol; col += 1) {
        cursor += 2;
        setCell(cells, row, col, decodeRk(readI32(workbook, cursor)));
        cursor += 4;
      }
    }

    offset = payloadOffset + length;
  }
  return cells;
}

function setCell(cells: BiffCellMap, row: number, col: number, value: CellValue) {
  const rowMap = cells.get(row) ?? new Map<number, CellValue>();
  rowMap.set(col, value);
  cells.set(row, rowMap);
}

class SegmentReader {
  private segmentIndex = 0;
  private offset = 0;

  constructor(private readonly segments: Uint8Array[]) {}

  readU8() {
    this.ensureSegment();
    if (this.segmentIndex >= this.segments.length) return 0;
    return this.segments[this.segmentIndex][this.offset++] ?? 0;
  }

  readU16() {
    const low = this.readU8();
    const high = this.readU8();
    return low | (high << 8);
  }

  readU32() {
    return (this.readU8() | (this.readU8() << 8) | (this.readU8() << 16) | (this.readU8() << 24)) >>> 0;
  }

  readStringChars(charCount: number, unicode: boolean) {
    let remaining = charCount;
    let isUnicode = unicode;
    let result = '';
    while (remaining > 0) {
      this.ensureSegment();
      if (this.segmentIndex >= this.segments.length) break;
      const current = this.segments[this.segmentIndex];
      const width = isUnicode ? 2 : 1;
      const availableChars = Math.floor((current.length - this.offset) / width);
      const take = Math.min(remaining, availableChars);
      if (take > 0) {
        const bytes = current.slice(this.offset, this.offset + take * width);
        result += decodeText(bytes, isUnicode);
        this.offset += take * width;
        remaining -= take;
      }
      if (remaining > 0) {
        this.segmentIndex += 1;
        this.offset = 0;
        isUnicode = Boolean(this.readU8() & 1);
      }
    }
    return result;
  }

  skip(length: number) {
    for (let index = 0; index < length; index += 1) this.readU8();
  }

  private ensureSegment() {
    while (this.segmentIndex < this.segments.length && this.offset >= this.segments[this.segmentIndex].length) {
      this.segmentIndex += 1;
      this.offset = 0;
    }
  }
}

function parseSharedStrings(segments: Uint8Array[]) {
  const reader = new SegmentReader(segments);
  reader.readU32();
  const uniqueCount = reader.readU32();
  const values: string[] = [];
  for (let index = 0; index < uniqueCount; index += 1) {
    const charCount = reader.readU16();
    const flags = reader.readU8();
    const hasRichText = Boolean(flags & 0x08);
    const hasExt = Boolean(flags & 0x04);
    const richRuns = hasRichText ? reader.readU16() : 0;
    const extSize = hasExt ? reader.readU32() : 0;
    values.push(reader.readStringChars(charCount, Boolean(flags & 1)));
    if (richRuns) reader.skip(richRuns * 4);
    if (extSize) reader.skip(extSize);
  }
  return values;
}

function decodeText(bytes: Uint8Array, unicode: boolean) {
  return new TextDecoder(unicode ? 'utf-16le' : 'latin1').decode(bytes);
}

function decodeRk(rk: number) {
  let value: number;
  if (rk & 0x02) {
    value = rk >> 2;
  } else {
    const bytes = new Uint8Array(8);
    new DataView(bytes.buffer).setUint32(4, rk & 0xfffffffc, true);
    value = new DataView(bytes.buffer).getFloat64(0, true);
  }
  return rk & 0x01 ? value / 100 : value;
}

function readU16(bytes: Uint8Array, offset: number) {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 2).getUint16(0, true);
}

function readU32(bytes: Uint8Array, offset: number) {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, true);
}

function readI32(bytes: Uint8Array, offset: number) {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getInt32(0, true);
}

function readF64(bytes: Uint8Array, offset: number) {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 8).getFloat64(0, true);
}
