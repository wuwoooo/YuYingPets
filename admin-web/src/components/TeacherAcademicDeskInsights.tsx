import { useCallback, useEffect, useState } from "react";
import { resolveSubjectLabel } from "../constants/admin";
import type { AcademicDeskOverviewPayload } from "../lib/api";
import { EllipsisTip } from "./EllipsisTip";
import type { AcademicStudentSignal } from "../utils/academicGrowth";
import type {
  TeacherDeskAcademicBrief,
  TeacherDeskQuadrant,
} from "../utils/teacherDeskAcademicBrief";

export type TeacherAcademicDeskInsightsProps = {
  /** 卡片标题（不传则按视角使用默认文案） */
  panelTitle?: string;
  /** 标题下方说明 */
  introNote?: string;
  /** homeroom：全科与班主任话术；subject：任课教师仅展示本科学分项 */
  deskPerspective?: "homeroom" | "subject";
  brief: TeacherDeskAcademicBrief;
  hasExam: boolean;
  loading: boolean;
  deskClassId: number | null;
  /** 深链成绩单用 */
  linkClassId?: number | null;
  subjectFocus?: AcademicDeskOverviewPayload["subjectFocus"];
  subjectFocusLoading?: boolean;
  /** 「数学」等在规则中的展示标签 */
  subjectLabel?: string;
  onOpenScores: (params: {
    tab?: string;
    examId?: number;
    classId?: number;
    studentId?: number;
  }) => void;
  footerNote?: string;
};

function trendBarPercent(values: number[], current: number) {
  const m = Math.max(...values.filter((x) => x > 0), 1);
  return Math.max(12, Math.min(100, Math.round((current / m) * 100)));
}

function renderRiskMini(
  rows: AcademicStudentSignal[],
  onOpen: TeacherAcademicDeskInsightsProps["onOpenScores"],
  linkClassId: number | undefined,
) {
  if (!rows.length) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <div className="panel-title compact">学业需关注（本班）</div>
      <div className="mini-list">
        {rows.map((item) => (
          <button
            type="button"
            key={`${item.studentId}-${item.classId}`}
            className="mini-list-item mini-list-item-button"
            onClick={() =>
              onOpen({
                tab: "scores",
                classId: linkClassId ?? item.classId,
                studentId: item.studentId,
              })
            }
          >
            <div>
              <strong>{item.studentName}</strong>
              <span>
                总分 {Math.round(item.totalScore * 10) / 10} · 名次Δ{" "}
                {item.rankDelta > 0 ? `+${item.rankDelta}` : item.rankDelta}
                {item.reason ? ` · ${item.reason}` : ""}
              </span>
            </div>
            <b>{item.quadrant === "risk" ? "关注" : "查看"}</b>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * 教师工作台：班主任视角（全科快照）或任课视角（本科学分项）。
 */
export function TeacherAcademicDeskInsights(props: TeacherAcademicDeskInsightsProps) {
  const {
    panelTitle,
    introNote,
    deskPerspective = "homeroom",
    brief,
    hasExam,
    loading,
    deskClassId,
    linkClassId,
    subjectFocus,
    subjectFocusLoading,
    subjectLabel,
    onOpenScores,
    footerNote: footerNoteProp,
  } = props;

  const isSubjectPerspective = deskPerspective === "subject";
  const subjectFocusDisplayLabel = resolveSubjectLabel(
    subjectFocus?.subjectCode,
    subjectLabel ?? subjectFocus?.subjectName,
  );
  const resolvedPanelTitle =
    panelTitle ??
    (isSubjectPerspective ? "学科成绩快照" : "学业成绩快照");
  const resolvedFooterNote =
    footerNoteProp ??
    (isSubjectPerspective
      ? "任课视图：以下为所选学科归档分项；不包含全科总分与班主任学业象限。"
      : "数据口径与课堂积分不同；统计仅限当前账号在全站可见的成绩快照范围。");

  const [expandedQuadrant, setExpandedQuadrant] = useState<
    TeacherDeskQuadrant["key"] | null
  >(null);
  const toggleQuadrant = useCallback((key: TeacherDeskQuadrant["key"]) => {
    setExpandedQuadrant((prev) => (prev === key ? null : key));
  }, []);

  useEffect(() => {
    setExpandedQuadrant(null);
  }, [deskClassId, brief.latestExamId]);

  const cid = linkClassId ?? deskClassId ?? undefined;
  const trendVals = brief.classTrend.map((t) => t.classAverageScore);
  const quadrantListCap = 40;

  const subjectDeskCard =
    subjectFocusLoading ? (
      <p
        className="metric-sub"
        style={{ marginTop: isSubjectPerspective ? 0 : 12 }}
      >
        {isSubjectPerspective
          ? "正在加载本科学目数据…"
          : "正在聚合本科学目快照…"}
      </p>
    ) : subjectFocus?.participantCount ? (
      <div
        className="analytics-ai-card analytics-ai-card-soft"
        style={{ marginTop: isSubjectPerspective ? 0 : 14 }}
      >
        <div className="panel-title compact">
          {subjectFocusDisplayLabel} · {subjectFocus.examName}
        </div>
        <p>
          <strong>{subjectFocus.averageScore}</strong>{" "}
          <span style={{ opacity: 0.85 }}>
            班均分 · 参评 {subjectFocus.participantCount} 人 · 单科分项由教务归档
          </span>
        </p>
        {subjectFocus.sampleLow.length ? (
          <div style={{ marginTop: 10 }}>
            <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
              相对薄弱样本（单科分偏低，仅作随访线索）
            </div>
            <div className="mini-list">
              {subjectFocus.sampleLow.map((s) => (
                <button
                  type="button"
                  key={`low-${s.studentId}`}
                  className="mini-list-item mini-list-item-button"
                  onClick={() =>
                    onOpenScores({
                      tab: "scores",
                      classId: cid,
                      examId: subjectFocus.examId,
                      studentId: s.studentId,
                    })
                  }
                >
                  <div>
                    <strong>{s.studentName}</strong>
                    <span>
                      {s.score} 分
                      {s.classRank !== null ? ` · 班级名次 ${s.classRank}` : ""}
                      {typeof s.classRankDelta === "number"
                        ? ` · 名次Δ ${s.classRankDelta > 0 ? `+${s.classRankDelta}` : s.classRankDelta}`
                        : ""}
                    </span>
                  </div>
                  <b>成绩单</b>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    ) : isSubjectPerspective ? (
      <div className="mini-list-item" style={{ marginTop: 12 }}>
        <div>
          <strong>暂无本科学情</strong>
          <span>
            最近一次导入的成绩里还没有您这门课的分项，或本班这次考试没有本科成绩。可到成绩单里按科目核对。
          </span>
        </div>
        <button
          type="button"
          className="op-btn"
          onClick={() => onOpenScores({ tab: "scores", classId: cid })}
        >
          成绩单
        </button>
      </div>
    ) : null;

  const emptyState = (
    <div className="mini-list-item">
      <div>
        <strong>
          {isSubjectPerspective ? "暂无本科学情归档" : "暂无成绩快照"}
        </strong>
        <span>
          {isSubjectPerspective
            ? "教务侧暂无可用考试档案，或当前班级暂无你所教科目的成绩分项。"
            : brief.headline}
        </span>
      </div>
      <button
        type="button"
        className="op-btn"
        onClick={() => onOpenScores({ tab: "scores", classId: cid })}
      >
        去学生页成绩单
      </button>
    </div>
  );

  return (
    <div className="panel teacher-academic-panel">
      <div className="panel-title">{resolvedPanelTitle}</div>
      {introNote ? <p className="teacher-panel-desc">{introNote}</p> : null}
      <div className="teacher-academic-desk-body">
      {loading ? (
        <div className="mini-list-item">
          <div>
            <strong>成绩单加载中</strong>
            <span>
              {isSubjectPerspective
                ? "同步成绩单与本科学目数据…"
                : "同步最近归档的考试成绩…"}
            </span>
          </div>
          <b>…</b>
        </div>
      ) : null}
      {!loading && !hasExam ? emptyState : null}
      {!loading && hasExam && deskClassId ? (
        <>
          {!isSubjectPerspective ? (
            <>
              <div
                className="analytics-ai-card analytics-ai-card-soft"
                style={{ marginBottom: 12 }}
              >
                <p>
                  <strong>{brief.headline}</strong>
                </p>
                <p className="analytics-report-copy">{brief.subline}</p>
              </div>
              {brief.suggestions.length ? (
                <div className="ck-ai-section teacher-academic-suggestions">
                  <div className="ck-ai-section-label">建议动作</div>
                  <ol className="analytics-report-points">
                    {brief.suggestions.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ol>
                </div>
              ) : null}
              <p className="metric-sub teacher-academic-section-note">
                最近一次考试的四象限分布；点击卡片可查看本班该象限学生名单并可跳转成绩单。
              </p>
              <div className="teacher-academic-quadrant-grid insight-grid">
                {brief.quadrantsClass.map((q) => (
                  <button
                    type="button"
                    key={q.key}
                    className={`insight-chip insight-chip-button${
                      expandedQuadrant === q.key ? " is-expanded" : ""
                    }`}
                    aria-expanded={expandedQuadrant === q.key}
                    onClick={() => toggleQuadrant(q.key)}
                  >
                    <strong>{q.count}</strong>
                    <span>{q.label}</span>
                  </button>
                ))}
              </div>
              {expandedQuadrant ? (
                <div className="teacher-academic-expanded-block">
                  <div className="panel-title compact">
                    {brief.quadrantsClass.find((x) => x.key === expandedQuadrant)
                      ?.label ?? expandedQuadrant}{" "}
                    · 本班名单
                  </div>
                  {brief.quadrantRoster[expandedQuadrant].length ? (
                    <>
                      <div className="mini-list">
                        {brief.quadrantRoster[expandedQuadrant]
                          .slice(0, quadrantListCap)
                          .map((item) => (
                            <button
                              type="button"
                              key={`${item.studentId}-${item.classId}-${expandedQuadrant}`}
                              className="mini-list-item mini-list-item-button"
                              onClick={() =>
                                onOpenScores({
                                  tab: "scores",
                                  classId: cid,
                                  examId: brief.latestExamId ?? undefined,
                                  studentId: item.studentId,
                                })
                              }
                            >
                              <div>
                                <strong>{item.studentName}</strong>
                                <span>
                                  总分 {Math.round(item.totalScore * 10) / 10} ·
                                  名次Δ{" "}
                                  {item.rankDelta > 0
                                    ? `+${item.rankDelta}`
                                    : item.rankDelta}
                                  {item.reason ? ` · ${item.reason}` : ""}
                                </span>
                              </div>
                              <b>成绩单</b>
                            </button>
                          ))}
                      </div>
                      {brief.quadrantRoster[expandedQuadrant].length >
                      quadrantListCap ? (
                        <p className="metric-sub" style={{ marginTop: 10 }}>
                          以上展示前 {quadrantListCap}{" "}
                          名（按姓名排序），本象限另有{" "}
                          {brief.quadrantRoster[expandedQuadrant].length -
                            quadrantListCap}{" "}
                          人，可在成绩单中按本场考试与本班筛选完整名单。
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="metric-sub" style={{ marginTop: 8 }}>
                      暂无学生落在该象限，或本场缺少行为分等字段导致无法归入象限。
                    </p>
                  )}
                </div>
              ) : null}
              {brief.classTrend.length > 1 ? (
                <div className="teacher-academic-trend-block">
                  <div className="panel-title compact">本班历次考试总分均分</div>
                  <div className="academic-trend-bars">
                    {brief.classTrend.map((item) => (
                      <div className="academic-trend-item" key={item.examId}>
                        <EllipsisTip
                          text={item.examName}
                          className="ellipsis-tip--align-left"
                        />
                        <div className="academic-trend-track">
                          <i
                            style={{
                              width: `${trendBarPercent(trendVals, item.classAverageScore)}%`,
                            }}
                          />
                        </div>
                        <b>
                          {item.classAverageScore} · {item.participantCount} 人
                        </b>
                      </div>
                    ))}
                  </div>
                </div>
              ) : brief.classTrend.length === 1 ? (
                <p className="metric-sub" style={{ marginTop: 12 }}>
                  仅有一场汇总归档，暂不绘制跨场次趋势；再归档一场同年级全科汇总后即可对比。
                </p>
              ) : null}
            </>
          ) : (
            <p className="metric-sub" style={{ marginBottom: 14 }}>
              以下为<strong>{subjectFocusDisplayLabel}</strong>
              在最近归档考试中的班况摘要；不包含全科总分、年级全科均值对照及班主任用的学业象限。
            </p>
          )}
          {subjectDeskCard}
          <div style={{ marginTop: 14 }} className="mini-list">
            <div className="mini-list-item">
              <div>
                <strong>快捷入口</strong>
                <span>
                  {isSubjectPerspective
                    ? "成绩单中可按科目筛选查看你所教科目的历次明细"
                    : "打开本班历次成绩明细表"}
                </span>
              </div>
              <button
                type="button"
                className="op-btn"
                onClick={() =>
                  onOpenScores({
                    tab: "scores",
                    classId: cid,
                  })
                }
              >
                成绩单
              </button>
            </div>
          </div>

          {!isSubjectPerspective
            ? renderRiskMini(brief.riskForClass, onOpenScores, cid)
            : null}
          <p className="metric-sub teacher-academic-footer-note">
            {resolvedFooterNote}
          </p>
        </>
      ) : null}
      </div>
    </div>
  );
}
