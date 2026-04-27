import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { Shell } from '../components/Shell';
import { ruleSceneOptions } from '../constants/admin';
import type {
  AdminClass,
  AdminStudent,
  ClassGroupSummary,
  ScoreRecord,
  ScoreRule,
  SessionScope,
  SessionUser,
} from '../lib/api';
import { adminApi } from '../lib/api';

type EvaluationPageProps = {
  token: string;
  user: SessionUser | null;
  scopes: SessionScope[];
  classes: AdminClass[];
  students: AdminStudent[];
  rules: ScoreRule[];
  loading: boolean;
  error: string | null;
  onSaved: () => Promise<void>;
};

type EvaluationMode = 'single' | 'batch' | 'group';

const modeOptions: Array<{ value: EvaluationMode; label: string; desc: string }> = [
  { value: 'single', label: '单人评价', desc: '适合课堂即时点名加减分。' },
  { value: 'batch', label: '批量评价', desc: '对多名学生一次应用同一条规则。' },
  { value: 'group', label: '小组评价', desc: '按小组统一加减分，适合合作任务。' },
];

const roleTitleMap: Record<string, { title: string; subtitle: string }> = {
  homeroom_teacher: {
    title: '班级评价',
    subtitle: '面向本班学生进行课堂、作业、纪律等规则化评价。',
  },
  subject_teacher: {
    title: '学科评价',
    subtitle: '只展示你有权限的授课班级与学科规则，适合任课教师快速记录。',
  },
};

const sceneLabelMap: Record<string, string> = {
  classroom: '课堂表现',
  homework: '作业完成',
  discipline: '纪律习惯',
  cleaning: '值日卫生',
  reading: '阅读成长',
  sports: '体育活动',
  exam: '考试测评',
  activity: '活动',
};

const subjectLabelMap: Record<string, string> = {
  chinese: '语文',
  math: '数学',
  mathematics: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
  biology: '生物',
  geography: '地理',
  history: '历史',
  politics: '政治',
  pe: '体育',
  sport: '体育',
  music: '音乐',
  art: '美术',
  it: '信息',
  general: '通用',
};

function formatSubjectLabel(value?: string | null) {
  if (!value) return '通用规则';
  return subjectLabelMap[value.toLowerCase()] ?? value;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export function EvaluationPage({
  token,
  user,
  scopes,
  classes,
  students,
  rules,
  loading,
  error,
  onSaved,
}: EvaluationPageProps) {
  const [searchParams] = useSearchParams();
  const rolePresentation = roleTitleMap[user?.roleCode ?? ''] ?? {
    title: '班级评价',
    subtitle: '统一查看评价规则、提交评价并回看最近记录。',
  };

  const classIdsInScope = useMemo(() => {
    const rawIds = scopes.map((item) => item.classId).filter((item): item is number => typeof item === 'number');
    return Array.from(new Set(rawIds));
  }, [scopes]);

  const subjectCodesByClass = useMemo(() => {
    const map = new Map<number, string[]>();
    scopes.forEach((item) => {
      if (typeof item.classId !== 'number' || !item.subjectCode) return;
      const current = map.get(item.classId) ?? [];
      if (!current.includes(item.subjectCode)) current.push(item.subjectCode);
      map.set(item.classId, current);
    });
    return map;
  }, [scopes]);

  const availableClasses = useMemo(() => {
    if (['super_admin', 'school_admin', 'moral_admin', 'grade_admin'].includes(user?.roleCode ?? '')) {
      return classes;
    }
    return classes.filter((item) => classIdsInScope.includes(item.id));
  }, [classIdsInScope, classes, user?.roleCode]);

  const [selectedClassId, setSelectedClassId] = useState<number | null>(availableClasses[0]?.id ?? null);
  const [mode, setMode] = useState<EvaluationMode>('single');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [scoreTypeFilter, setScoreTypeFilter] = useState<'all' | 'add' | 'deduct'>('all');
  const [sceneFilter, setSceneFilter] = useState<string>('all');
  const [ruleKeyword, setRuleKeyword] = useState('');
  const [recentRuleIds, setRecentRuleIds] = useState<number[]>([]);
  const [showMoreRules, setShowMoreRules] = useState(false);
  const [showAllQuickAdd, setShowAllQuickAdd] = useState(false);
  const [showAllQuickDeduct, setShowAllQuickDeduct] = useState(false);
  const [confirmRule, setConfirmRule] = useState<ScoreRule | null>(null);
  const [confirmRemark, setConfirmRemark] = useState('');
  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [groups, setGroups] = useState<ClassGroupSummary[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const selectedClass = availableClasses.find((item) => item.id === selectedClassId) ?? null;
  const classStudents = useMemo(
    () => students.filter((item) => item.classId === selectedClassId),
    [selectedClassId, students],
  );

  const availableSubjectFilters = useMemo(() => {
    const currentSubjectCodes = selectedClassId ? subjectCodesByClass.get(selectedClassId) ?? [] : [];
    return ['all', ...currentSubjectCodes];
  }, [selectedClassId, subjectCodesByClass]);

  const availableRules = useMemo(() => {
    const currentSubjectCodes = selectedClassId ? subjectCodesByClass.get(selectedClassId) ?? [] : [];
    return rules.filter((item) => {
      if (!item.adminEnabled) return false;
      if (scoreTypeFilter !== 'all' && item.scoreType !== scoreTypeFilter) return false;
      if (sceneFilter !== 'all' && item.sceneCode !== sceneFilter) return false;
      if (subjectFilter !== 'all' && item.moduleType === 'subject' && item.subjectCode !== subjectFilter) return false;
      if (ruleKeyword.trim()) {
        const keyword = ruleKeyword.trim().toLowerCase();
        const haystack = [item.name, item.subjectCode, item.tag, item.dimension, item.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      if (item.moduleType === 'general') return true;
      if (['super_admin', 'school_admin', 'moral_admin', 'grade_admin'].includes(user?.roleCode ?? '')) return true;
      if (user?.roleCode === 'homeroom_teacher' && currentSubjectCodes.length === 0) return false;
      return item.subjectCode ? currentSubjectCodes.includes(item.subjectCode) : false;
    });
  }, [ruleKeyword, rules, sceneFilter, scoreTypeFilter, selectedClassId, subjectCodesByClass, subjectFilter, user?.roleCode]);

  const highFrequencyRules = useMemo(
    () => availableRules.filter((item) => item.isHighFrequency).sort((a, b) => Number(b.adminEnabled) - Number(a.adminEnabled)),
    [availableRules],
  );

  const recentRules = useMemo(
    () =>
      recentRuleIds
        .map((id) => availableRules.find((item) => item.id === id))
        .filter((item): item is ScoreRule => Boolean(item))
        .slice(0, 6),
    [availableRules, recentRuleIds],
  );

  const sceneOptions = useMemo(() => {
    const sceneSet = new Set(
      rules
        .filter((item) => item.adminEnabled)
        .map((item) => item.sceneCode)
        .filter(Boolean),
    );
    return ruleSceneOptions.filter((item) => sceneSet.has(item.value));
  }, [rules]);

  const selectedRule = availableRules.find((item) => item.id === selectedRuleId) ?? null;
  const positiveCount = records.filter((item) => item.scoreDelta > 0).length;
  const negativeCount = records.filter((item) => item.scoreDelta < 0).length;
  const averageScore = classStudents.length
    ? Math.round(classStudents.reduce((sum, item) => sum + item.currentScore, 0) / classStudents.length)
    : 0;

  useEffect(() => {
    if (!selectedClassId && availableClasses[0]?.id) {
      setSelectedClassId(availableClasses[0].id);
    }
  }, [availableClasses, selectedClassId]);

  useEffect(() => {
    const queryClassId = searchParams.get('classId');
    const queryMode = searchParams.get('mode');
    const querySubjectCode = searchParams.get('subjectCode');

    if (queryClassId) {
      const parsedClassId = Number(queryClassId);
      if (availableClasses.some((item) => item.id === parsedClassId)) {
        setSelectedClassId(parsedClassId);
      }
    }

    if (queryMode === 'single' || queryMode === 'batch' || queryMode === 'group') {
      setMode(queryMode);
    }

    if (querySubjectCode && availableSubjectFilters.includes(querySubjectCode)) {
      setSubjectFilter(querySubjectCode);
    } else if (!querySubjectCode && subjectFilter !== 'all' && !availableSubjectFilters.includes(subjectFilter)) {
      setSubjectFilter('all');
    }
  }, [availableClasses, availableSubjectFilters, searchParams, subjectFilter]);

  useEffect(() => {
    if (!selectedClassId) return;
    const queryStudentId = searchParams.get('studentId');
    const parsedStudentId = queryStudentId ? Number(queryStudentId) : null;

    if (parsedStudentId && classStudents.some((item) => item.id === parsedStudentId)) {
      setSelectedStudentId(parsedStudentId);
      if (mode === 'batch') {
        setSelectedStudentIds([parsedStudentId]);
      }
    } else {
      setSelectedStudentId((prev) => (classStudents.some((item) => item.id === prev) ? prev : classStudents[0]?.id ?? null));
      setSelectedStudentIds((prev) => prev.filter((item) => classStudents.some((student) => student.id === item)));
    }
  }, [classStudents, mode, searchParams, selectedClassId]);

  useEffect(() => {
    if (!selectedClassId) return;
    const queryRuleId = searchParams.get('ruleId');
    const parsedRuleId = queryRuleId ? Number(queryRuleId) : null;

    if (parsedRuleId && availableRules.some((item) => item.id === parsedRuleId)) {
      setSelectedRuleId(parsedRuleId);
      return;
    }

    if (!availableRules.some((item) => item.id === selectedRuleId)) {
      setSelectedRuleId(highFrequencyRules[0]?.id ?? availableRules[0]?.id ?? null);
    }
  }, [availableRules, highFrequencyRules, searchParams, selectedRuleId, selectedClassId]);

  useEffect(() => {
    if (!selectedClassId) return;
    let active = true;
    setPageLoading(true);
    setSubmitError(null);

    Promise.all([adminApi.scoreRecords(token, { classId: selectedClassId }), adminApi.classGroups(token, selectedClassId)])
      .then(([recordResponse, groupResponse]) => {
        if (!active) return;
        setRecords(recordResponse.data);
        setGroups(groupResponse.data);
        if (!groupResponse.data.some((item) => item.id === selectedGroupId)) {
          setSelectedGroupId(groupResponse.data[0]?.id ?? null);
        }
      })
      .catch((err) => {
        if (!active) return;
        setSubmitError(err instanceof Error ? err.message : '评价数据加载失败');
      })
      .finally(() => {
        if (active) setPageLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedClassId, selectedGroupId, token]);

  function toggleBatchStudent(studentId: number) {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((item) => item !== studentId) : [...prev, studentId],
    );
  }

  function handleRuleSelect(ruleId: number) {
    setSelectedRuleId(ruleId);
    setRecentRuleIds((prev) => [ruleId, ...prev.filter((item) => item !== ruleId)].slice(0, 8));
  }

  function getSelectionError() {
    if (!selectedClassId) return '请先选择班级';
    if (mode === 'single' && !selectedStudentId) return '请先选择学生';
    if (mode === 'batch' && selectedStudentIds.length === 0) return '请至少选择一名学生';
    if (mode === 'group' && !selectedGroupId) return '当前班级暂无可评价小组';
    return null;
  }

  function openRuleConfirm(rule: ScoreRule) {
    handleRuleSelect(rule.id);
    const selectionError = getSelectionError();
    if (selectionError) {
      setSubmitError(selectionError);
      setSubmitSuccess(null);
      return;
    }
    setSubmitError(null);
    setSubmitSuccess(null);
    setConfirmRule(rule);
    setConfirmRemark('');
  }

  async function reloadCurrentClassData() {
    if (!selectedClassId) return;
    const [recordResponse, groupResponse] = await Promise.all([
      adminApi.scoreRecords(token, { classId: selectedClassId }),
      adminApi.classGroups(token, selectedClassId),
    ]);
    setRecords(recordResponse.data);
    setGroups(groupResponse.data);
  }

  async function submitEvaluation(rule: ScoreRule, remark: string) {
    if (!selectedClassId || submitLoading) return;
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      if (mode === 'single') {
        if (!selectedStudentId) throw new Error('请先选择学生');
        await adminApi.createScoreRecord(token, {
          classId: selectedClassId,
          studentId: selectedStudentId,
          ruleId: rule.id,
          remark: remark.trim() || undefined,
          sourceTerminal: 'admin',
        });
      }

      if (mode === 'batch') {
        if (selectedStudentIds.length === 0) throw new Error('请至少选择一名学生');
        await adminApi.createScoreRecordBatch(token, {
          classId: selectedClassId,
          studentIds: selectedStudentIds,
          ruleId: rule.id,
          remark: remark.trim() || undefined,
          sourceTerminal: 'admin',
        });
      }

      if (mode === 'group') {
        if (!selectedGroupId) throw new Error('当前班级暂无可评价小组');
        await adminApi.createScoreRecordGroup(token, {
          classId: selectedClassId,
          classGroupId: selectedGroupId,
          ruleId: rule.id,
          remark: remark.trim() || undefined,
          sourceTerminal: 'admin',
        });
      }

      await Promise.all([onSaved(), reloadCurrentClassData()]);
      if (mode === 'batch') setSelectedStudentIds([]);
      setConfirmRule(null);
      setConfirmRemark('');
      setSubmitSuccess(
        mode === 'single'
          ? `${rule.scoreType === 'deduct' ? '扣分' : '加分'}已提交`
          : mode === 'batch'
            ? '批量评价已提交'
            : '小组评价已提交',
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '提交评价失败');
    } finally {
      setSubmitLoading(false);
    }
  }

  const recentRuleOrder = useMemo(() => {
    const order = new Map<number, number>();
    recentRuleIds.forEach((id, index) => {
      order.set(id, index);
    });
    return order;
  }, [recentRuleIds]);

  const sortedQuickRules = useMemo(() => {
    const quickRules = highFrequencyRules.slice().sort((left, right) => {
      const leftRecent = recentRuleOrder.get(left.id);
      const rightRecent = recentRuleOrder.get(right.id);
      if (leftRecent !== undefined || rightRecent !== undefined) {
        if (leftRecent === undefined) return 1;
        if (rightRecent === undefined) return -1;
        return leftRecent - rightRecent;
      }
      return right.scoreValue - left.scoreValue;
    });

    return {
      add: quickRules.filter((item) => item.scoreType === 'add'),
      deduct: quickRules.filter((item) => item.scoreType === 'deduct'),
    };
  }, [highFrequencyRules, recentRuleOrder]);

  const quickAddRules = useMemo(
    () => (showAllQuickAdd ? sortedQuickRules.add : sortedQuickRules.add.slice(0, 4)),
    [showAllQuickAdd, sortedQuickRules.add],
  );

  const quickDeductRules = useMemo(
    () => (showAllQuickDeduct ? sortedQuickRules.deduct : sortedQuickRules.deduct.slice(0, 4)),
    [showAllQuickDeduct, sortedQuickRules.deduct],
  );

  const moreRules = useMemo(() => availableRules.slice(0, 36), [availableRules]);

  const selectionSummary = useMemo(() => {
    if (mode === 'single') {
      const student = classStudents.find((item) => item.id === selectedStudentId);
      return {
        title: student ? `单人评价 · ${student.name}` : '单人评价',
        subtitle: student ? `当前积分 ${student.currentScore} 分` : '请先选择学生',
      };
    }
    if (mode === 'batch') {
      return {
        title: `批量评价 · ${selectedStudentIds.length} 名学生`,
        subtitle:
          selectedStudentIds.length > 0
            ? classStudents
                .filter((item) => selectedStudentIds.includes(item.id))
                .slice(0, 4)
                .map((item) => item.name)
                .join('、')
            : '请先勾选需要统一评价的学生',
      };
    }
    const group = groups.find((item) => item.id === selectedGroupId);
    return {
      title: group ? `小组评价 · 第${group.groupNo}组 ${group.name}` : '小组评价',
      subtitle: group ? `${group.studentCount} 人 · 当前 ${group.currentScoreTotal} 分` : '请先选择评价小组',
    };
  }, [classStudents, groups, mode, selectedGroupId, selectedStudentId, selectedStudentIds]);

  return (
    <Shell title={rolePresentation.title} subtitle={rolePresentation.subtitle} user={user}>
      {(loading || pageLoading) && <div className="status-card">评价数据加载中...</div>}
      {error && <div className="status-card error">{error}</div>}
      {submitError && <div className="status-card error">{submitError}</div>}
      {submitSuccess && <div className="status-card success">{submitSuccess}</div>}

      <div className="page-header">
        <div>
          <h2>{rolePresentation.title}</h2>
          <p className="page-desc">{rolePresentation.subtitle}</p>
        </div>
        <div className="page-actions">
          <select
            className="filter-select"
            value={selectedClassId ?? ''}
            onChange={(event) => setSelectedClassId(Number(event.target.value))}
          >
            {availableClasses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.gradeName} {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="metric-strip">
        <div className="metric-card">
          <span>当前班级</span>
          <strong>{selectedClass ? `${selectedClass.gradeName} ${selectedClass.name}` : '暂无可用班级'}</strong>
          <p>{selectedClass?.slogan ?? '班级口号待补充，可由班主任在“我的班级”中维护。'}</p>
        </div>
        <div className="metric-card">
          <span>本班学生</span>
          <strong>{classStudents.length} 人</strong>
          <p>当前平均积分 {averageScore} 分，便于老师快速掌握班级状态。</p>
        </div>
        <div className="metric-card">
          <span>最近评价</span>
          <strong>{records.length} 条</strong>
          <p>正向 {positiveCount} 条，负向 {negativeCount} 条，已包含兑换扣分记录。</p>
        </div>
      </div>

      <div className="evaluation-layout">
        <div className="panel evaluation-form-panel">
          <div className="panel-title">发起评价</div>

          <div className="evaluation-mode-grid">
            {modeOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`evaluation-mode-card${mode === item.value ? ' active' : ''}`}
                onClick={() => setMode(item.value)}
              >
                <strong>{item.label}</strong>
                <span>{item.desc}</span>
              </button>
            ))}
          </div>

          <div className="detail-grid">
            <div className="detail-card">
              <h4>评价对象</h4>
              {mode === 'single' ? (
                <select value={selectedStudentId ?? ''} onChange={(event) => setSelectedStudentId(Number(event.target.value))}>
                  {classStudents.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {item.currentScore} 分
                    </option>
                  ))}
                </select>
              ) : null}
              {mode === 'batch' ? (
                <div className="evaluation-student-grid">
                  {classStudents.map((item) => (
                    <label key={item.id} className={`evaluation-student-card${selectedStudentIds.includes(item.id) ? ' active' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(item.id)}
                        onChange={() => toggleBatchStudent(item.id)}
                      />
                      <span>{item.name}</span>
                      <b>{item.currentScore} 分</b>
                    </label>
                  ))}
                </div>
              ) : null}
              {mode === 'group' ? (
                <select value={selectedGroupId ?? ''} onChange={(event) => setSelectedGroupId(Number(event.target.value))}>
                  {groups.map((item) => (
                    <option key={item.id} value={item.id}>
                      第{item.groupNo}组 · {item.name} · {item.studentCount}人
                    </option>
                  ))}
                </select>
              ) : null}
            </div>

            <div className="detail-card">
              <h4>规则选择</h4>
              <div className="evaluation-action-board">
                <div className="evaluation-action-header">
                  <div>
                    <strong>{selectionSummary.title}</strong>
                    <p>{selectionSummary.subtitle}</p>
                  </div>
                </div>
                <div className="evaluation-rules-head">
                  <div className="evaluation-rules-head-copy">
                    <strong>{showMoreRules ? '全部规则' : '快捷规则'}</strong>
                    <span>{showMoreRules ? '按加扣分、场景和关键词筛选后直接点选。' : '优先展示高频和最近常用规则。'}</span>
                  </div>
                  <button
                    type="button"
                    className={`ghost-button evaluation-more-toggle${showMoreRules ? ' active' : ''}`}
                    onClick={() => setShowMoreRules((prev) => !prev)}
                  >
                    {showMoreRules ? '返回快捷规则' : '更多规则'}
                  </button>
                </div>
                {!showMoreRules ? (
                  <div className="evaluation-quick-columns">
                    <div className="evaluation-quick-section add">
                      <div className="evaluation-quick-head">
                        <strong>快捷加分</strong>
                        <div className="evaluation-quick-head-actions">
                          <span>点击后直接确认</span>
                          {sortedQuickRules.add.length > 4 ? (
                            <button
                              type="button"
                              className="evaluation-quick-toggle"
                              onClick={() => setShowAllQuickAdd((prev) => !prev)}
                            >
                              {showAllQuickAdd ? '收起' : `更多 ${sortedQuickRules.add.length - 4} 条`}
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="evaluation-quick-grid">
                        {quickAddRules.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`evaluation-rule-card evaluation-quick-rule add${selectedRuleId === item.id ? ' active' : ''}`}
                            onClick={() => openRuleConfirm(item)}
                          >
                            <strong>
                              {item.name} +{item.scoreValue} 分
                            </strong>
                          </button>
                        ))}
                        {quickAddRules.length === 0 ? <div className="table-empty">当前没有可用的快捷加分规则。</div> : null}
                      </div>
                    </div>
                    <div className="evaluation-quick-section deduct">
                      <div className="evaluation-quick-head">
                        <strong>快捷扣分</strong>
                        <div className="evaluation-quick-head-actions">
                          <span>适合课堂即时处理</span>
                          {sortedQuickRules.deduct.length > 4 ? (
                            <button
                              type="button"
                              className="evaluation-quick-toggle"
                              onClick={() => setShowAllQuickDeduct((prev) => !prev)}
                            >
                              {showAllQuickDeduct ? '收起' : `更多 ${sortedQuickRules.deduct.length - 4} 条`}
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="evaluation-quick-grid">
                        {quickDeductRules.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`evaluation-rule-card evaluation-quick-rule deduct${selectedRuleId === item.id ? ' active' : ''}`}
                            onClick={() => openRuleConfirm(item)}
                          >
                            <strong>
                              {item.name} -{item.scoreValue} 分
                            </strong>
                          </button>
                        ))}
                        {quickDeductRules.length === 0 ? <div className="table-empty">当前没有可用的快捷扣分规则。</div> : null}
                      </div>
                    </div>
                  </div>
                ) : null}
                {showMoreRules ? (
                  <div className="evaluation-more-panel">
                    <div className="evaluation-rule-toolbar">
                      <div className="tabs">
                        <button
                          type="button"
                          className={`tab${scoreTypeFilter === 'add' ? ' active' : ''}`}
                          onClick={() => setScoreTypeFilter('add')}
                        >
                          全部加分
                        </button>
                        <button
                          type="button"
                          className={`tab${scoreTypeFilter === 'deduct' ? ' active' : ''}`}
                          onClick={() => setScoreTypeFilter('deduct')}
                        >
                          全部扣分
                        </button>
                        <button
                          type="button"
                          className={`tab${scoreTypeFilter === 'all' ? ' active' : ''}`}
                          onClick={() => setScoreTypeFilter('all')}
                        >
                          全部规则
                        </button>
                      </div>
                      <input
                        className="evaluation-rule-search"
                        value={ruleKeyword}
                        onChange={(event) => setRuleKeyword(event.target.value)}
                        placeholder="搜索规则名称"
                      />
                      <div className="evaluation-rule-filters">
                        <button
                          type="button"
                          className={`evaluation-filter-chip${sceneFilter === 'all' ? ' active' : ''}`}
                          onClick={() => setSceneFilter('all')}
                        >
                          全部场景
                        </button>
                        {sceneOptions.map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            className={`evaluation-filter-chip${sceneFilter === item.value ? ' active' : ''}`}
                            onClick={() => setSceneFilter(item.value)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      {recentRules.length > 0 ? (
                        <div className="evaluation-rule-section">
                          <div className="evaluation-rule-section-title">最近使用</div>
                          <div className="evaluation-rule-chip-row">
                            {recentRules.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                className={`evaluation-rule-mini${selectedRuleId === item.id ? ' active' : ''}`}
                                onClick={() => openRuleConfirm(item)}
                              >
                                {item.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="evaluation-rule-list">
                      {moreRules.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`evaluation-rule-card${selectedRuleId === item.id ? ' active' : ''}`}
                          onClick={() => openRuleConfirm(item)}
                        >
                          <strong>
                            {item.name} {item.scoreType === 'deduct' ? '-' : '+'}
                            {item.scoreValue} 分
                          </strong>
                        </button>
                      ))}
                      {moreRules.length === 0 ? <div className="table-empty">当前筛选条件下没有可用规则。</div> : null}
                    </div>
                  </div>
                ) : null}
                {selectedRule ? (
                  <div className="evaluation-rule-preview compact">
                    <span className={`settings-tag${selectedRule.scoreType === 'deduct' ? ' danger' : ' success'}`}>
                      最近选中
                    </span>
                    <strong>
                      {selectedRule.name} · {selectedRule.scoreType === 'deduct' ? '-' : '+'}
                      {selectedRule.scoreValue} 分
                    </strong>
                    <p>{selectedRule.description || selectedRule.aiSummaryText || '该规则暂无补充说明。'}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="evaluation-side-column">
          <div className="panel">
            <div className="panel-title">小组概览</div>
            <div className="mini-list">
              {groups.length > 0 ? (
                groups.map((item) => (
                  <div className="mini-list-item" key={item.id}>
                    <div>
                      <strong>第{item.groupNo}组 · {item.name}</strong>
                      <span>{item.studentCount} 人 · 当前 {item.currentScoreTotal} 分</span>
                    </div>
                    <b>{item.students.map((student) => student.name).join('、') || '暂无成员'}</b>
                  </div>
                ))
              ) : (
                <div className="table-empty">当前班级还没有配置小组。</div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">最近记录</div>
            <div className="mini-list">
              {records.slice(0, 12).map((item) => {
                const student = students.find((studentRow) => studentRow.id === item.studentId);
                return (
                  <div className="mini-list-item" key={`${item.id}-${item.createdAt}`}>
                    <div>
                      <strong>
                        {student?.name ?? `学生#${item.studentId}`} · {item.scoreDelta > 0 ? '+' : ''}
                        {item.scoreDelta} 分
                      </strong>
                      <span>
                        {item.ruleName || item.tag || item.dimension || item.sceneCode || '评价记录'} · {formatDateTime(item.createdAt)}
                      </span>
                    </div>
                    <b>{item.operatorName || item.sourceRole}</b>
                  </div>
                );
              })}
              {records.length === 0 ? <div className="table-empty">当前班级还没有评价记录。</div> : null}
            </div>
          </div>
        </div>
      </div>
      {confirmRule ? (
        <Modal
          title={confirmRule.scoreType === 'deduct' ? '确认扣分' : '确认加分'}
          subtitle="确认后会立即写入评价记录，可填写补充说明。"
          onClose={() => {
            if (submitLoading) return;
            setConfirmRule(null);
            setConfirmRemark('');
          }}
        >
          <div className="evaluation-confirm-shell">
            <div className="evaluation-confirm-summary">
              <div className="evaluation-confirm-item">
                <span>评价对象</span>
                <strong>{selectionSummary.title}</strong>
                <p>{selectionSummary.subtitle}</p>
              </div>
              <div className="evaluation-confirm-item">
                <span>所选规则</span>
                <strong>
                  {confirmRule.name} · {confirmRule.scoreType === 'deduct' ? '-' : '+'}
                  {confirmRule.scoreValue} 分
                </strong>
                <p>
                  {sceneLabelMap[confirmRule.sceneCode] ?? '通用场景'} · {formatSubjectLabel(confirmRule.subjectCode)}
                </p>
              </div>
            </div>
            <label className="evaluation-confirm-remark">
              <span>备注</span>
              <textarea
                className="evaluation-remark"
                value={confirmRemark}
                onChange={(event) => setConfirmRemark(event.target.value)}
                placeholder="可填写课堂背景、补充说明或表扬内容。"
              />
            </label>
            <div className="form-actions">
              <button type="button" className="ghost-button" onClick={() => setConfirmRule(null)} disabled={submitLoading}>
                取消
              </button>
              <button
                type="button"
                className="toolbar-button"
                onClick={() => submitEvaluation(confirmRule, confirmRemark)}
                disabled={submitLoading}
              >
                {submitLoading ? '提交中...' : confirmRule.scoreType === 'deduct' ? '确认扣分' : '确认加分'}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </Shell>
  );
}
