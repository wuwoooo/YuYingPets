import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Modal } from '../components/Modal';
import { Shell } from '../components/Shell';
import { TablePagination } from '../components/TablePagination';
import {
  ruleModuleLabelMap,
  ruleModuleOptions,
  resolveRuleDimension,
  ruleSceneLabelMap,
  ruleSceneOptions,
  ruleSubjectLabelMap,
  ruleSubjectOptions,
  ruleTagOptions,
} from '../constants/admin';
import { usePagination } from '../hooks/usePagination';
import type { 
  AdminClass,
  ScoreRule,
  ScoreRuleTreeModule,
  ScoreRuleUpsertPayload,
  SessionUser,
  SystemSettings
} from '../lib/api';
import { adminApi } from '../lib/api';
import type {
  RuleFormState
} from '../types/admin';
import {
  buildAutoCode,
  createRuleForm
} from '../utils/adminForms';
import { canManageRules } from '../utils/adminPermissions';

type TreeSelection =
  | { type: 'all'; key: null }
  | { type: 'module'; key: string }
  | { type: 'subject'; key: string }
  | { type: 'scene'; key: string }
  | { type: 'rule'; key: string };

const roleLabelMap: Record<string, string> = {
  super_admin: '系统管理员',
  school_admin: '学校管理员',
  academic_admin: '教务管理员',
  moral_admin: '德育管理员',
  grade_admin: '年级管理员',
  homeroom_teacher: '班主任',
  subject_teacher: '任课教师',
};

const STUDENT_MANAGEMENT_RULE_CODE_PREFIX = 'MORAL_';

function isStudentManagementRule(rule: Pick<ScoreRule, 'code'>) {
  return rule.code.startsWith(STUDENT_MANAGEMENT_RULE_CODE_PREFIX);
}

function formatAllowedRoleLabels(rule: Pick<ScoreRule, 'allowedRoleCodes'>) {
  if (rule.allowedRoleCodes.length === 0) return '全部后台角色';
  return rule.allowedRoleCodes.map((item) => roleLabelMap[item] ?? item).join(' / ');
}

type RulesPageProps = {
  token: string;
  user: SessionUser | null;
  classes: AdminClass[];
  rules: ScoreRule[];
  loading: boolean;
  error: string | null;
  onSaved: () => Promise<void>;
};

export function RulesPage({
  token,
  user,
  classes,
  rules,
  loading,
  error,
  onSaved,
}: RulesPageProps) {
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [editingRule, setEditingRule] = useState<ScoreRule | null>(null);
  const [form, setForm] = useState<RuleFormState>(() => createRuleForm(rules[0]?.semesterId ?? classes[0]?.semesterId));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'student' | 'class' | 'moral'>('all');
  const [currentSemester, setCurrentSemester] = useState<SystemSettings['semester'] | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [togglePendingIds, setTogglePendingIds] = useState<number[]>([]);
  const [ruleOverrides, setRuleOverrides] = useState<Record<number, Pick<ScoreRule, 'adminEnabled' | 'displayEnabled'>>>({});
  const [treeData, setTreeData] = useState<ScoreRuleTreeModule[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [treeSelection, setTreeSelection] = useState<TreeSelection>({ type: 'all', key: null });
  const rulesMainRef = useRef<HTMLDivElement | null>(null);

  const defaultSemesterId = rules[0]?.semesterId ?? classes[0]?.semesterId;
  const allowManage = canManageRules(user?.roleCode);
  const isEditorOpen = editorMode !== null;
  const isEditing = editorMode === 'edit' && Boolean(editingRule);
  const isStudentManagementDraft = isEditing && editingRule ? isStudentManagementRule(editingRule) : false;
  const normalizedName = form.name.trim();
  const normalizedSubjectCode = form.moduleType === 'subject' ? form.subjectCode.trim() : '';
  const generatedRuleCode = buildAutoCode('rule', form.name, editingRule?.code || form.code);
  const resolvedDimension = useMemo(
    () => resolveRuleDimension(form.sceneCode, form.scoreType),
    [form.sceneCode, form.scoreType],
  );
  const mergedRules = useMemo(
    () =>
      rules.map((rule) => ({
        ...rule,
        ...(ruleOverrides[rule.id] ?? {}),
      })),
    [ruleOverrides, rules],
  );
  useEffect(() => {
    let active = true;
    setPageLoading(true);
    Promise.all([adminApi.settings(token), adminApi.scoreRulesTree(token)])
      .then(([settings, treeResponse]) => {
        if (!active) return;
        setCurrentSemester(settings.data.semester);
        setTreeData(Array.isArray(treeResponse.data) ? treeResponse.data : []);
      })
      .catch((err) => {
        if (!active) return;
        setSubmitError(err instanceof Error ? err.message : '规则配置数据加载失败');
      })
      .finally(() => {
        if (active) setPageLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, rules.length]);
  const statusFilteredRules = useMemo(() => {
    return mergedRules.filter((rule) => {
      if (statusFilter === 'all') return true;
      const enabled = rule.adminEnabled || rule.displayEnabled;
      return statusFilter === 'enabled' ? enabled : !enabled;
    });
  }, [mergedRules, statusFilter]);

  const audienceFilteredRules = useMemo(() => {
    return statusFilteredRules.filter((rule) => {
      if (audienceFilter === 'all') return true;
      if (audienceFilter === 'student') return rule.scoreTarget === 'student';
      if (audienceFilter === 'class') return rule.scoreTarget === 'class';
      return isStudentManagementRule(rule);
    });
  }, [audienceFilter, statusFilteredRules]);

  const filteredTreeData = useMemo(() => {
    const ruleMap = new Map(audienceFilteredRules.map((rule) => [rule.id, rule]));

    return treeData
      .map((moduleNode) => {
        const subjects = moduleNode.subjects
          .map((subjectNode) => {
            const scenes = subjectNode.scenes
              .map((sceneNode) => {
                const sceneRules = sceneNode.rules
                  .map((rule) => ruleMap.get(rule.id))
                  .filter((rule): rule is ScoreRule => Boolean(rule))
                  .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

                return sceneRules.length > 0
                  ? {
                      ...sceneNode,
                      count: sceneRules.length,
                      rules: sceneRules,
                    }
                  : null;
              })
              .filter((scene): scene is NonNullable<typeof scene> => Boolean(scene));

            return scenes.length > 0
              ? {
                  ...subjectNode,
                  count: scenes.reduce((sum, scene) => sum + scene.count, 0),
                  scenes,
                }
              : null;
          })
          .filter((subject): subject is NonNullable<typeof subject> => Boolean(subject));

        return subjects.length > 0
          ? {
              ...moduleNode,
              count: subjects.reduce((sum, subject) => sum + subject.count, 0),
              subjects,
            }
          : null;
      })
      .filter((moduleNode): moduleNode is NonNullable<typeof moduleNode> => Boolean(moduleNode));
  }, [audienceFilteredRules, treeData]);

  useEffect(() => {
    setExpandedNodes((prev) => {
      const next: Record<string, boolean> = {};
      filteredTreeData.forEach((moduleNode, index) => {
        next[`module:${moduleNode.moduleType}`] = prev[`module:${moduleNode.moduleType}`] ?? index === 0;
        moduleNode.subjects.forEach((subjectNode) => {
          const subjectKey = `subject:${moduleNode.moduleType}:${subjectNode.subjectCode ?? 'general'}`;
          next[subjectKey] = prev[subjectKey] ?? moduleNode.moduleType === 'general';
        });
      });
      return next;
    });
  }, [filteredTreeData]);

  useEffect(() => {
    if (treeSelection.type === 'all') return;
    const exists =
      treeSelection.type === 'module'
        ? filteredTreeData.some((moduleNode) => moduleNode.moduleType === treeSelection.key)
        : treeSelection.type === 'subject'
          ? filteredTreeData.some((moduleNode) =>
              moduleNode.subjects.some(
                (subjectNode) => `${moduleNode.moduleType}:${subjectNode.subjectCode ?? 'general'}` === treeSelection.key,
              ),
            )
          : treeSelection.type === 'scene'
            ? filteredTreeData.some((moduleNode) =>
                moduleNode.subjects.some((subjectNode) =>
                  subjectNode.scenes.some(
                    (sceneNode) =>
                      `${moduleNode.moduleType}:${subjectNode.subjectCode ?? 'general'}:${sceneNode.sceneCode}` ===
                      treeSelection.key,
                  ),
                ),
              )
            : filteredTreeData.some((moduleNode) =>
                moduleNode.subjects.some((subjectNode) =>
                  subjectNode.scenes.some((sceneNode) =>
                    sceneNode.rules.some((rule) => String(rule.id) === treeSelection.key),
                  ),
                ),
              );
    if (!exists) {
      setTreeSelection({ type: 'all', key: null });
    }
  }, [filteredTreeData, treeSelection]);

  useEffect(() => {
    if (!isEditorOpen) return;
    if (form.moduleType === 'subject') return;
    if (!form.subjectCode) return;
    setForm((prev) => ({ ...prev, subjectCode: '' }));
  }, [form.moduleType, form.subjectCode, isEditorOpen]);

  const filteredRules = useMemo(() => {
    if (treeSelection.type === 'all') return audienceFilteredRules;
    if (treeSelection.type === 'module') {
      return audienceFilteredRules.filter((rule) => rule.moduleType === treeSelection.key);
    }
    if (treeSelection.type === 'subject') {
      const [, subjectCode] = treeSelection.key.split(':');
      return audienceFilteredRules.filter((rule) => (rule.subjectCode ?? 'general') === subjectCode);
    }
    if (treeSelection.type === 'scene') {
      const [, subjectCode, sceneCode] = treeSelection.key.split(':');
      return audienceFilteredRules.filter(
        (rule) => (rule.subjectCode ?? 'general') === subjectCode && rule.sceneCode === sceneCode,
      );
    }
    return audienceFilteredRules.filter((rule) => String(rule.id) === treeSelection.key);
  }, [audienceFilteredRules, treeSelection]);

  const duplicateDraftChecks = useMemo(() => {
    const currentRuleId = editingRule?.id ?? null;
    const compareRules = rules.filter((rule) => rule.id !== currentRuleId);
    const normalizedSceneCode = form.sceneCode.trim().toLocaleLowerCase();
    const sameBranch = (rule: ScoreRule) =>
      rule.moduleType === form.moduleType &&
      (rule.subjectCode?.trim().toLocaleLowerCase() ?? '') === normalizedSubjectCode.toLocaleLowerCase() &&
      rule.sceneCode.trim().toLocaleLowerCase() === normalizedSceneCode &&
      rule.scoreTarget === form.scoreTarget;
    const duplicatedNameRule = normalizedName
      ? compareRules.find(
          (rule) => sameBranch(rule) && rule.name.trim().toLocaleLowerCase() === normalizedName.toLocaleLowerCase(),
        )
      : null;
    const normalizedCode = generatedRuleCode.trim().toLocaleLowerCase();
    const duplicatedCodeRule = normalizedCode
      ? compareRules.find((rule) => rule.code.trim().toLocaleLowerCase() === normalizedCode)
      : null;

    return {
      duplicatedNameRule,
      duplicatedCodeRule,
    };
  }, [editingRule?.id, form.moduleType, form.sceneCode, form.scoreTarget, generatedRuleCode, normalizedName, normalizedSubjectCode, rules]);

  const rulePagination = usePagination(
    filteredRules,
    `${statusFilter}|${mergedRules.length}|${Object.keys(ruleOverrides).join(',')}|${treeSelection.type}|${treeSelection.key ?? 'all'}`,
  );

  const selectionLabel = useMemo(() => {
    if (treeSelection.type === 'all') return '全部规则';
    if (treeSelection.type === 'module') {
      return filteredTreeData.find((moduleNode) => moduleNode.moduleType === treeSelection.key)?.moduleLabel ?? treeSelection.key;
    }
    if (treeSelection.type === 'subject') {
      const [moduleType, subjectCode] = treeSelection.key.split(':');
      return (
        filteredTreeData
          .find((moduleNode) => moduleNode.moduleType === moduleType)
          ?.subjects.find((subjectNode) => (subjectNode.subjectCode ?? 'general') === subjectCode)?.subjectLabel ??
        treeSelection.key
      );
    }
    if (treeSelection.type === 'scene') {
      const [moduleType, subjectCode, sceneCode] = treeSelection.key.split(':');
      return (
        filteredTreeData
          .find((moduleNode) => moduleNode.moduleType === moduleType)
          ?.subjects.find((subjectNode) => (subjectNode.subjectCode ?? 'general') === subjectCode)
          ?.scenes.find((sceneNode) => sceneNode.sceneCode === sceneCode)?.sceneLabel ?? treeSelection.key
      );
    }
    return statusFilteredRules.find((rule) => String(rule.id) === treeSelection.key)?.name ?? '已选规则';
  }, [filteredTreeData, statusFilteredRules, treeSelection]);

  function toggleNode(nodeKey: string) {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeKey]: !prev[nodeKey],
    }));
  }

  function openNode(nodeKey: string) {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeKey]: true,
    }));
  }

  function applyTreeSelection(nextSelection: TreeSelection) {
    setTreeSelection(nextSelection);
    requestAnimationFrame(() => {
      rulesMainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function selectTreeGroup(nodeKey: string, nextSelection: TreeSelection) {
    openNode(nodeKey);
    applyTreeSelection(nextSelection);
  }

  function selectRule(ruleId: number) {
    applyTreeSelection({ type: 'rule', key: String(ruleId) });
  }

  function openCreate() {
    setEditingRule(null);
    setEditorMode('create');
    setSubmitError(null);
    setSubmitSuccess(null);
    setForm(createRuleForm(currentSemester?.id ?? defaultSemesterId));
  }

  function openEdit(row: ScoreRule) {
    setSubmitError(null);
    setSubmitSuccess(null);
    setEditorMode('edit');
    setEditingRule(row);
    setForm(createRuleForm(currentSemester?.id ?? defaultSemesterId, row));
  }

  function closeModal(force = false) {
    if (submitting && !force) return;
    setEditorMode(null);
    setEditingRule(null);
    setSubmitError(null);
  }

  async function handleToggleRule(row: ScoreRule) {
    if (togglePendingIds.includes(row.id)) return;
    setSubmitError(null);
    setSubmitSuccess(null);
    const enabled = row.adminEnabled || row.displayEnabled;
    const nextState = {
      displayEnabled: enabled ? false : row.displayEnabled || true,
      adminEnabled: enabled ? false : true,
    };

    setTogglePendingIds((prev) => [...prev, row.id]);
    setRuleOverrides((prev) => ({
      ...prev,
      [row.id]: nextState,
    }));

    try {
      await adminApi.updateScoreRule(token, row.id, {
        semesterId: row.semesterId,
        moduleType: row.moduleType,
        ...(row.subjectCode ? { subjectCode: row.subjectCode } : {}),
        sceneCode: row.sceneCode,
        code: row.code,
        name: row.name,
        scoreType: row.scoreType,
        scoreTarget: row.scoreTarget,
        scoreValue: row.scoreValue,
        ...(row.dimension ? { dimension: row.dimension } : {}),
        ...(row.tag ? { tag: row.tag } : {}),
        sentiment: row.sentiment,
        ...(row.aiSummaryText ? { aiSummaryText: row.aiSummaryText } : {}),
        ...(row.description ? { description: row.description } : {}),
        ...(row.allowedRoleCodes.length > 0 ? { allowedRoleCodes: row.allowedRoleCodes } : {}),
        isHighFrequency: row.isHighFrequency,
        displayEnabled: nextState.displayEnabled,
        adminEnabled: nextState.adminEnabled,
      });
      await onSaved();
      setRuleOverrides((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      setSubmitSuccess(enabled ? '规则已停用' : '规则已重新启用');
    } catch (err) {
      setRuleOverrides((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      setSubmitError(err instanceof Error ? err.message : '规则状态更新失败');
    } finally {
      setTogglePendingIds((prev) => prev.filter((item) => item !== row.id));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const semesterId = form.semesterId || (currentSemester?.id ? String(currentSemester.id) : '');
      const ruleCode = generatedRuleCode;
      const name = normalizedName;
      const subjectCode = normalizedSubjectCode;
      const sceneCode = form.sceneCode.trim();
      const scoreValueText = form.scoreValue.trim();
      const sentiment = form.scoreType === 'deduct' ? 'negative' : 'positive';

      if (!semesterId || !sceneCode || !name || !scoreValueText) {
        throw new Error('请填写完整的规则基础信息');
      }
      if (form.moduleType === 'subject' && !subjectCode) {
        throw new Error('学科类规则必须选择适用学科');
      }
      if (!/^-?\d+$/.test(scoreValueText) || Number(scoreValueText) <= 0) {
        throw new Error('积分分值必须是大于 0 的整数');
      }
      if (!form.displayEnabled && !form.adminEnabled) {
        throw new Error('请至少保留一个使用位置');
      }
      if (duplicateDraftChecks.duplicatedNameRule) {
        throw new Error(`规则名称重复：已存在“${duplicateDraftChecks.duplicatedNameRule.name}”`);
      }
      if (duplicateDraftChecks.duplicatedCodeRule) {
        throw new Error(`规则编码重复：已存在“${duplicateDraftChecks.duplicatedCodeRule.code}”`);
      }

      const payload: ScoreRuleUpsertPayload = {
        semesterId: Number(semesterId),
        moduleType: form.moduleType,
        ...(subjectCode ? { subjectCode } : {}),
        sceneCode,
        code: ruleCode,
        name,
        scoreType: form.scoreType,
        scoreTarget: form.scoreTarget,
        scoreValue: Number(scoreValueText),
        ...(resolvedDimension ? { dimension: resolvedDimension } : {}),
        ...(form.tag.trim() ? { tag: form.tag.trim() } : {}),
        sentiment,
        ...(form.aiSummaryText.trim() ? { aiSummaryText: form.aiSummaryText.trim() } : {}),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
        ...(form.allowedRoleCodes.length > 0 ? { allowedRoleCodes: form.allowedRoleCodes } : {}),
        isHighFrequency: form.isHighFrequency,
        displayEnabled: form.displayEnabled,
        adminEnabled: form.adminEnabled,
      };

      if (isEditing && editingRule) {
        await adminApi.updateScoreRule(token, editingRule.id, payload);
      } else {
        await adminApi.createScoreRule(token, payload);
      }

      await onSaved();
      setSubmitSuccess(isEditing ? '规则已更新' : '规则已创建');
      closeModal(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  const draftAudience = [
    form.displayEnabled ? '展示大屏' : null,
    form.adminEnabled ? '教师后台' : null,
  ]
    .filter(Boolean)
    .join(' / ');

  return (
    <Shell
      title="积分规则"
      subtitle="按课堂、作业、学业场景维护规则与标签"
      loading={loading || pageLoading}
      user={user}
      status={
        <>
          {loading || pageLoading ? <div className="status-card">规则数据加载中...</div> : null}
          {error ? <div className="status-card error">{error}</div> : null}
          {submitSuccess ? <div className="status-card success">{submitSuccess}</div> : null}
        </>
      }
    >
      <div className="page-header">
        <h2>积分规则管理</h2>
        <div className="page-actions">
          <select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">全部状态</option>
            <option value="enabled">启用中</option>
            <option value="disabled">已停用</option>
          </select>
          <select
            className="filter-select"
            value={audienceFilter}
            onChange={(event) => setAudienceFilter(event.target.value as 'all' | 'student' | 'class' | 'moral')}
          >
            <option value="all">全部规则</option>
            <option value="student">学生评价</option>
            <option value="class">班级评价</option>
            <option value="moral">学生管理</option>
          </select>
          {allowManage ? (
            <button className="btn btn-primary" onClick={openCreate}>
              + 新建规则
            </button>
          ) : null}
        </div>
      </div>
      <div className="rules-layout">
        <div className="cat-tree">
          <h4>行为分类</h4>
          <button
            type="button"
            className={`tree-root-button${treeSelection.type === 'all' ? ' active' : ''}`}
            onClick={() => applyTreeSelection({ type: 'all', key: null })}
          >
            <span>全部规则</span>
            <span className="tree-count">{audienceFilteredRules.length}</span>
          </button>
          {filteredTreeData.map((moduleNode) => {
            const moduleKey = `module:${moduleNode.moduleType}`;
            const moduleSelected = treeSelection.type === 'module' && treeSelection.key === moduleNode.moduleType;
            return (
              <div className="cat-folder" key={moduleNode.moduleType}>
                <div className={`cat-folder-head${moduleSelected ? ' active' : ''}`}>
                  <button
                    type="button"
                    className={`tree-toggle${expandedNodes[moduleKey] ? ' open' : ''}`}
                    onClick={() => toggleNode(moduleKey)}
                    aria-label={expandedNodes[moduleKey] ? `折叠${moduleNode.moduleLabel}` : `展开${moduleNode.moduleLabel}`}
                  >
                    ▶
                  </button>
                  <button
                    type="button"
                    className="tree-group-button"
                    onClick={() => selectTreeGroup(moduleKey, { type: 'module', key: moduleNode.moduleType })}
                  >
                    <span>{moduleNode.moduleLabel}</span>
                    <span className="tree-count">{moduleNode.count}</span>
                  </button>
                </div>
                {expandedNodes[moduleKey] ? (
                  <div className="cat-children open">
                    {moduleNode.subjects.map((subjectNode) => {
                      const subjectFilterKey = `${moduleNode.moduleType}:${subjectNode.subjectCode ?? 'general'}`;
                      const subjectNodeKey = `subject:${subjectFilterKey}`;
                      const subjectSelected = treeSelection.type === 'subject' && treeSelection.key === subjectFilterKey;
                      return (
                        <div className="cat-folder nested" key={subjectFilterKey}>
                          <div className={`cat-folder-head nested${subjectSelected ? ' active' : ''}`}>
                            <button
                              type="button"
                              className={`tree-toggle${expandedNodes[subjectNodeKey] ? ' open' : ''}`}
                              onClick={() => toggleNode(subjectNodeKey)}
                              aria-label={expandedNodes[subjectNodeKey] ? `折叠${subjectNode.subjectLabel}` : `展开${subjectNode.subjectLabel}`}
                            >
                              ▶
                            </button>
                            <button
                              type="button"
                              className="tree-group-button"
                              onClick={() => selectTreeGroup(subjectNodeKey, { type: 'subject', key: subjectFilterKey })}
                            >
                              <span>{subjectNode.subjectLabel}</span>
                              <span className="tree-count">{subjectNode.count}</span>
                            </button>
                          </div>
                          {expandedNodes[subjectNodeKey] ? (
                            <div className="cat-children open nested">
                              {subjectNode.scenes.map((sceneNode) => {
                                const sceneFilterKey = `${subjectFilterKey}:${sceneNode.sceneCode}`;
                                const sceneSelected = treeSelection.type === 'scene' && treeSelection.key === sceneFilterKey;
                                return (
                                  <div className="cat-scene-block" key={sceneFilterKey}>
                                    <button
                                      type="button"
                                      className={`cat-scene-button${sceneSelected ? ' active' : ''}`}
                                      onClick={() => applyTreeSelection({ type: 'scene', key: sceneFilterKey })}
                                    >
                                      <span>{sceneNode.sceneLabel}</span>
                                      <span className="tree-count">{sceneNode.count}</span>
                                    </button>
                                    <div className="cat-children nested rules">
                                      {sceneNode.rules.map((rule) => (
                                        <button
                                          type="button"
                                          className={`cat-child${treeSelection.type === 'rule' && treeSelection.key === String(rule.id) ? ' active' : ''}`}
                                          key={rule.id}
                                          onClick={() => selectRule(rule.id)}
                                        >
                                          <span className="cat-child-name">{rule.name}</span>
                                          <span className="cat-child-score">{`${rule.scoreType === 'deduct' ? '-' : '+'}${rule.scoreValue}`}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="rules-main" ref={rulesMainRef}>
          <div className="rules-toolbar">
            <div className="rules-summary">
              <span className="rules-summary-label">当前筛选</span>
              <strong>{selectionLabel}</strong>
              <span>{`共 ${filteredRules.length} 条`}</span>
            </div>
            {treeSelection.type !== 'all' ? (
              <button
                type="button"
                className="ghost-button"
                onClick={() => applyTreeSelection({ type: 'all', key: null })}
              >
                清除筛选
              </button>
            ) : null}
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>规则名称</th>
                  <th>适用分类</th>
                  <th>评价对象</th>
                  <th>适用角色</th>
                  <th>积分方向</th>
                  <th>分值</th>
                  <th>使用位置</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {rulePagination.pagedItems.map((row) => {
                  const enabled = row.adminEnabled || row.displayEnabled;
                  return (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>
                      {[
                        row.moduleType === 'subject'
                          ? ruleSubjectLabelMap[row.subjectCode ?? ''] ?? row.subjectCode ?? ruleModuleLabelMap.subject
                          : ruleModuleLabelMap.general,
                        ruleSceneLabelMap[row.sceneCode] ?? row.sceneCode,
                        row.dimension ?? undefined,
                      ]
                        .filter(Boolean)
                        .join(' / ')}
                    </td>
                    <td>{row.scoreTarget === 'class' ? '班级评价' : '学生评价'}</td>
                    <td>{formatAllowedRoleLabels(row)}</td>
                    <td>
                      <span className={row.scoreType === 'deduct' ? 'score-badge deduct' : 'score-badge add'}>
                        {row.scoreType === 'deduct' ? '减分' : '加分'}
                      </span>
                    </td>
                    <td className={row.scoreType === 'deduct' ? 'score-text deduct' : 'score-text add'}>
                      {`${row.scoreType === 'deduct' ? '-' : '+'}${row.scoreValue}`}
                    </td>
                    <td>{`${row.displayEnabled ? '展示大屏' : ''}${row.displayEnabled && row.adminEnabled ? ' / ' : ''}${row.adminEnabled ? '教师后台' : ''}`}</td>
                    <td><span className={enabled ? 'status-on' : 'status-off'}>{enabled ? '启用' : '停用'}</span></td>
                    <td>
                      {allowManage ? (
                        <>
                          <button className="op-btn" type="button" onClick={() => openEdit(row)}>
                            编辑
                          </button>
                          <button
                            className="op-btn"
                            type="button"
                            onClick={() => void handleToggleRule(row)}
                            disabled={togglePendingIds.includes(row.id)}
                          >
                            {togglePendingIds.includes(row.id) ? '提交中...' : enabled ? '停用' : '启用'}
                          </button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                  );
                })}
                {filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="table-empty">
                      当前筛选条件下没有积分规则
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={rulePagination.currentPage}
            pageSize={rulePagination.pageSize}
            totalItems={rulePagination.totalItems}
            totalPages={rulePagination.totalPages}
            onPageChange={rulePagination.setCurrentPage}
            onPageSizeChange={rulePagination.setPageSize}
          />
        </div>
      </div>

      {allowManage && isEditorOpen ? (
        <Modal
          title={isEditing ? '编辑积分规则' : '新增积分规则'}
          subtitle=""
          onClose={closeModal}
        >
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="span-2">
              <span>规则名称</span>
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="例如：课堂主动发言"
              />
              {duplicateDraftChecks.duplicatedNameRule ? (
                <span className="field-hint error-text">
                  规则名称重复：已存在“{duplicateDraftChecks.duplicatedNameRule.name}”
                </span>
              ) : normalizedName ? (
                <span className="field-hint success-text">规则名称可用</span>
              ) : null}
            </label>
            <label className="span-2">
              <span>规则编码</span>
              <input value={generatedRuleCode} readOnly />
              {duplicateDraftChecks.duplicatedCodeRule ? (
                <span className="field-hint error-text">
                  规则编码重复：已存在“{duplicateDraftChecks.duplicatedCodeRule.code}”
                </span>
              ) : generatedRuleCode.trim() ? (
                <span className="field-hint success-text">编码将随保存一并写入</span>
              ) : null}
            </label>
            <label>
              <span>所属学期</span>
              <input
                value={currentSemester?.name ?? (form.semesterId ? '当前学期' : '请先配置当前学期')}
                readOnly
              />
            </label>
            <label>
              <span>适用范围</span>
              <select
                value={form.moduleType}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    moduleType: event.target.value as RuleFormState['moduleType'],
                  }))
                }
              >
                {ruleModuleOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>适用学科</span>
              <select
                value={form.subjectCode}
                onChange={(event) => setForm((prev) => ({ ...prev, subjectCode: event.target.value }))}
                disabled={form.moduleType !== 'subject'}
              >
                <option value="">{form.moduleType === 'subject' ? '请选择学科' : '班级通用规则无需选择'}</option>
                {ruleSubjectOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>规则归属</span>
              <input
                value={
                  form.moduleType === 'subject'
                    ? `${ruleModuleLabelMap.subject} / ${ruleSubjectLabelMap[form.subjectCode] ?? '待选择学科'}`
                    : ruleModuleLabelMap.general
                }
                readOnly
              />
            </label>
            <label>
              <span>应用场景</span>
              <select
                value={form.sceneCode}
                onChange={(event) => setForm((prev) => ({ ...prev, sceneCode: event.target.value }))}
              >
                <option value="">请选择应用场景</option>
                {ruleSceneOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>评价对象</span>
              <select
                value={form.scoreTarget}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    scoreTarget: event.target.value as RuleFormState['scoreTarget'],
                  }))
                }
              >
                <option value="student">学生评价</option>
                <option value="class">班级评价</option>
              </select>
            </label>
            <label>
              <span>适用角色</span>
              {isStudentManagementDraft ? (
                <>
                  <input value="全部后台角色" readOnly />
                  <span className="field-hint">学生管理规则默认全员可见、全员可用。</span>
                </>
              ) : (
                <input value={form.allowedRoleCodes.length === 0 ? '全部后台角色' : formatAllowedRoleLabels(form)} readOnly />
              )}
            </label>
            <label>
              <span>积分方向</span>
              <select
                value={form.scoreType}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    scoreType: event.target.value as RuleFormState['scoreType'],
                  }))
                }
              >
                <option value="add">加分鼓励</option>
                <option value="deduct">扣分提醒</option>
              </select>
            </label>
            <label>
              <span>积分分值</span>
              <input
                value={form.scoreValue}
                onChange={(event) => setForm((prev) => ({ ...prev, scoreValue: event.target.value }))}
                placeholder="例如：2"
              />
            </label>
            <label>
              <span>适用分类</span>
              <input value={resolvedDimension || '请先选择应用场景'} readOnly />
              <span className="field-hint">系统会根据应用场景自动归类，保存时无需再手动选择。</span>
            </label>
            <label>
              <span>标签</span>
              <select value={form.tag} onChange={(event) => setForm((prev) => ({ ...prev, tag: event.target.value }))}>
                <option value="">请选择标签</option>
                {ruleTagOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              <span>呈现语气</span>
              <input value={form.scoreType === 'deduct' ? '提醒纠偏' : '正向激励'} readOnly />
            </label>
            <label className="span-2">
              <span>展示说明</span>
              <input
                value={form.aiSummaryText}
                onChange={(event) => setForm((prev) => ({ ...prev, aiSummaryText: event.target.value }))}
                placeholder="选填，例如：主动发言，表达清晰"
              />
            </label>
            <label className="span-2">
              <span>教师使用说明</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={4}
                placeholder="选填，说明老师在什么情况下使用这条规则"
              />
            </label>
            <label className="span-2">
              <span>角色说明</span>
              <input value={form.allowedRoleCodes.length === 0 ? '全部后台角色' : formatAllowedRoleLabels(form)} readOnly />
            </label>
            <div className="checkbox-grid span-2">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={form.isHighFrequency}
                  onChange={(event) => setForm((prev) => ({ ...prev, isHighFrequency: event.target.checked }))}
                />
                设为常用规则
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={form.displayEnabled}
                  onChange={(event) => setForm((prev) => ({ ...prev, displayEnabled: event.target.checked }))}
                />
                可在展示大屏显示
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={form.adminEnabled}
                  onChange={(event) => setForm((prev) => ({ ...prev, adminEnabled: event.target.checked }))}
                />
                可在教师后台使用
              </label>
            </div>
            <div className="span-2 evaluation-rule-preview compact rule-draft-preview">
              <div className="rule-draft-preview-head">
                <strong>草稿预览</strong>
                <span>{isEditing ? '编辑后效果' : '创建后效果'}</span>
              </div>
              <div className="rule-draft-preview-score-row">
                <span className={form.scoreType === 'deduct' ? 'score-badge deduct' : 'score-badge add'}>
                  {form.scoreType === 'deduct' ? '减分规则' : '加分规则'}
                </span>
                <strong className={form.scoreType === 'deduct' ? 'score-text deduct' : 'score-text add'}>
                  {`${form.scoreType === 'deduct' ? '-' : '+'}${form.scoreValue.trim() || '0'}`}
                </strong>
              </div>
              <p>
                <strong>{normalizedName || '未填写规则名称'}</strong>
              </p>
              <p>
                {[
                  form.moduleType === 'subject'
                    ? `${ruleModuleLabelMap.subject} / ${ruleSubjectLabelMap[normalizedSubjectCode] ?? '待选择学科'}`
                    : ruleModuleLabelMap.general,
                  ruleSceneLabelMap[form.sceneCode] ?? '待选择应用场景',
                  resolvedDimension || '待选择适用分类',
                  form.tag || '待选择标签',
                ].join(' · ')}
              </p>
              <p>{form.aiSummaryText.trim() || '这里会显示展示说明，便于确认大屏或教师侧如何理解这条规则。'}</p>
              <p>{form.description.trim() || '这里会显示教师使用说明，便于确认什么场景下应使用这条规则。'}</p>
              <div className="rule-draft-preview-meta">
                <span>编码：{generatedRuleCode || '待生成'}</span>
                <span>语气：{form.scoreType === 'deduct' ? '提醒纠偏' : '正向激励'}</span>
                <span>使用位置：{draftAudience || '未选择'}</span>
                <span>适用角色：{form.allowedRoleCodes.length === 0 ? '全部后台角色' : formatAllowedRoleLabels(form)}</span>
                <span>常用规则：{form.isHighFrequency ? '是' : '否'}</span>
              </div>
            </div>
            {submitError ? <div className="status-card error span-2">{submitError}</div> : null}
            <div className="form-actions span-2">
              <button type="button" className="ghost-button" onClick={() => closeModal()} disabled={submitting}>
                取消
              </button>
              <button type="submit" className="toolbar-button" disabled={submitting}>
                {submitting ? '提交中...' : isEditing ? '保存修改' : '创建规则'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </Shell>
  );
}
