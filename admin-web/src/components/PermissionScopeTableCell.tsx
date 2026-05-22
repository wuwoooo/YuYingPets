import type { AdminClass, PermissionUser } from '../lib/api';
import { buildPermissionScopeDetail, formatPermissionScopeForTable } from '../utils/permissionScopeDisplay';

type PermissionScopeTableCellProps = {
  row: PermissionUser;
  classes: AdminClass[];
};

/** 账号/教师列表中的负责范围单元格：摘要展示，悬停显示全部 */
export function PermissionScopeTableCell({ row, classes }: PermissionScopeTableCellProps) {
  const summary = formatPermissionScopeForTable(row, classes);
  const detail = buildPermissionScopeDetail(row, classes);

  if (detail === '未分配负责范围') {
    return <td className="security-scope-cell">{summary}</td>;
  }

  return (
    <td className="security-scope-cell">
      <span className="security-scope-hover">
        <span className="security-scope-summary">{summary}</span>
        <span className="security-scope-tooltip" role="tooltip">
          {detail}
        </span>
      </span>
    </td>
  );
}
