export type WorkbookCellValue = string | number | null;

export function normalizeWorkbookCell(value: unknown): WorkbookCellValue {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value.trim();
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    const record = value as {
      text?: unknown;
      result?: unknown;
      richText?: Array<{ text?: unknown }>;
    };
    if (record.result !== undefined) return normalizeWorkbookCell(record.result);
    if (record.text !== undefined) return normalizeWorkbookCell(record.text);
    if (Array.isArray(record.richText)) {
      return record.richText.map((item) => String(item.text ?? '')).join('').trim();
    }
  }
  return String(value).trim();
}

export async function readXlsxWorkbookRows(file: File): Promise<WorkbookCellValue[][][]> {
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    throw new Error('仅支持 .xlsx 文件，请先将旧版 .xls 转换为 .xlsx 后再导入');
  }

  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  return workbook.worksheets.map((sheet) => {
    const rows: WorkbookCellValue[][] = [];
    const columnCount = Math.max(sheet.columnCount, 1);
    for (let rowIndex = 1; rowIndex <= sheet.rowCount; rowIndex += 1) {
      const row = sheet.getRow(rowIndex);
      const cells: WorkbookCellValue[] = [];
      for (let columnIndex = 1; columnIndex <= columnCount; columnIndex += 1) {
        cells.push(normalizeWorkbookCell(row.getCell(columnIndex).value));
      }
      rows.push(cells);
    }
    return rows;
  });
}

export function parseCsvRows(text: string): WorkbookCellValue[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }
  return rows;
}

export function rowsToObjects(rows: WorkbookCellValue[][]): Record<string, WorkbookCellValue>[] {
  const [headerRow, ...bodyRows] = rows;
  if (!headerRow) return [];
  const headers = headerRow.map((item) => String(item ?? '').trim());
  return bodyRows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])),
  );
}
