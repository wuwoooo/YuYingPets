import type { AcademicScoreImportPayload } from '../lib/api';

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

  const gradeName = students[0]?.className.match(/^(.*?年级)/)?.[1] ?? undefined;

  return {
    examName: cleanExamName(title || sourceFile || '成绩汇总'),
    gradeName,
    sourceFile,
    students,
  };
}

export async function parseAcademicScoreWorkbook(file: File): Promise<AcademicScoreImportPayload> {
  const buffer = await file.arrayBuffer();
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.xls') && !lowerName.endsWith('.xlsx')) {
    return parseAcademicScoreRows(await parseLegacyXlsRows(buffer), file.name);
  }

  const { read, utils } = await import('xlsx');
  const workbook = read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Excel 文件中没有可读取的工作表');
  }
  const rows = utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: false, defval: '' }) as CellValue[][];
  return parseAcademicScoreRows(rows, file.name);
}

async function parseLegacyXlsRows(buffer: ArrayBuffer) {
  const cfbModule = await import('cfb');
  const cfbReader = cfbModule.read ?? cfbModule.default.read;
  const cfb = cfbReader(new Uint8Array(buffer), { type: 'array' });
  const workbookEntry = cfb.FileIndex.find((entry: { name: string }) => entry.name === 'Workbook' || entry.name === 'Book');
  const workbookContent = workbookEntry?.content as Uint8Array | number[] | undefined;
  if (!workbookContent) {
    throw new Error('未找到 Excel 工作簿数据');
  }
  const workbook = workbookContent instanceof Uint8Array ? workbookContent : new Uint8Array(workbookContent);

  const { sheetOffset, sharedStrings } = parseWorkbookGlobals(workbook);
  if (sheetOffset === null) {
    throw new Error('成绩表缺少工作表信息');
  }

  const cells = parseSheetCells(workbook, sheetOffset, sharedStrings);
  const maxRow = Math.max(...cells.keys());
  return Array.from({ length: maxRow + 1 }, (_, index) => rowToArray(cells, index));
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
