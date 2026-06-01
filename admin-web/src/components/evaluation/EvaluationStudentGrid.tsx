import type { AdminStudent } from '../../lib/api';
import type { ClassGroupSummary, EvaluationMode, StudentSortKey } from './evaluationUtils';
import { buildStudentGroupMap, filterAndSortStudents } from './evaluationUtils';
import { EvaluationStudentCard } from './EvaluationStudentCard';

type EvaluationStudentGridProps = {
  students: AdminStudent[];
  groups: ClassGroupSummary[];
  mode: EvaluationMode;
  keyword: string;
  groupFilter: number | 'all';
  sort: StudentSortKey;
  selectedStudentIds: number[];
  onStudentClick: (studentId: number) => void;
  onToggleSelect: (studentId: number) => void;
  loading?: boolean;
};

export function EvaluationStudentGrid({
  students,
  groups,
  mode,
  keyword,
  groupFilter,
  sort,
  selectedStudentIds,
  onStudentClick,
  onToggleSelect,
  loading = false,
}: EvaluationStudentGridProps) {
  const groupMap = buildStudentGroupMap(groups);
  const visibleStudents = filterAndSortStudents(students, { keyword, groupFilter, sort, groups });

  if (loading) {
    return <div className="evaluation-student-grid-empty">学生数据加载中...</div>;
  }

  if (students.length === 0) {
    return <div className="evaluation-student-grid-empty">当前班级暂无学生</div>;
  }

  if (visibleStudents.length === 0) {
    return <div className="evaluation-student-grid-empty">没有符合筛选条件的学生</div>;
  }

  return (
    <div className="evaluation-student-grid--compact">
      {visibleStudents.map((student) => (
        <EvaluationStudentCard
          key={student.id}
          student={student}
          mode={mode}
          selected={selectedStudentIds.includes(student.id)}
          groupNo={groupMap.get(student.id)?.groupNo}
          onClick={() => onStudentClick(student.id)}
          onToggleSelect={() => onToggleSelect(student.id)}
        />
      ))}
    </div>
  );
}
