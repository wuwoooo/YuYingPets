type SchoolYearAnchor = {
  name: string;
  startDate: Date;
};

/** 从学期名称或起始日期解析学年键，例如 2025-2026 */
export function resolveSchoolYearKey(input: SchoolYearAnchor): string | null {
  const matched = input.name.match(/(20\d{2})\s*[-—–~至]\s*(20\d{2})/);
  if (matched) {
    return `${matched[1]}-${matched[2]}`;
  }

  const year = input.startDate.getFullYear();
  const month = input.startDate.getMonth() + 1;
  if (month >= 9) {
    return `${year}-${year + 1}`;
  }
  if (month >= 2) {
    return `${year - 1}-${year}`;
  }
  return `${year - 1}-${year}`;
}

/** 筛选与锚点学期同属一个学年的学期列表 */
export function filterSemestersBySchoolYear<T extends SchoolYearAnchor>(
  semesters: T[],
  anchor: SchoolYearAnchor | null | undefined,
): T[] {
  if (!anchor) return semesters;
  const schoolYearKey = resolveSchoolYearKey(anchor);
  if (!schoolYearKey) return semesters;
  return semesters.filter((item) => resolveSchoolYearKey(item) === schoolYearKey);
}
