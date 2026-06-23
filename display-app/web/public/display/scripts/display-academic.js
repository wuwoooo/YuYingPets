(function initDisplayAcademic(global) {
  function splitAcademicAiLines(text) {
    return String(text || "")
      .split(/\n|。|；|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function normalizeAcademicDimensions(dimensions) {
    return Array.isArray(dimensions)
      ? dimensions
          .map((item) => ({
            dimension: item?.dimension || "未分类",
            count: Number(item?.count || 0),
            positiveCount: Number(item?.positiveCount || 0),
            negativeCount: Number(item?.negativeCount || 0),
          }))
          .sort((left, right) => right.count - left.count)
      : [];
  }

  function buildAcademicAiView(summary) {
    if (!summary) return null;
    const positiveCount = Number(summary.positiveSummary?.count || 0);
    const positiveDelta = Number(summary.positiveSummary?.scoreDelta || 0);
    const negativeCount = Number(summary.negativeSummary?.count || 0);
    const negativeDelta = Number(summary.negativeSummary?.scoreDelta || 0);
    const trend = summary.trendSummary || {};
    const dimensions = normalizeAcademicDimensions(summary.dimensionSummary);
    const topPositive = [...dimensions]
      .sort((a, b) => b.positiveCount - a.positiveCount)
      .find((item) => item.positiveCount > 0);
    const topNegative = [...dimensions]
      .sort((a, b) => b.negativeCount - a.negativeCount)
      .find((item) => item.negativeCount > 0);
    const periodLabel = summary.periodType === "monthly" ? "近30天" : "近7天";
    const positiveRatio = Math.round(Number(trend.positiveRatio || 0) * 100);
    const suggestions = splitAcademicAiLines(summary.aiSuggestion);
    const highlights = [];
    const risks = [];
    const actions = [];

    if (positiveCount > 0) {
      highlights.push(
        `${periodLabel}正向 ${positiveCount} 次，积分 ${positiveDelta >= 0 ? "+" : ""}${positiveDelta}`,
      );
    }
    if (topPositive) {
      highlights.push(
        `优势维度：${topPositive.dimension}（${topPositive.positiveCount} 次）`,
      );
    }
    if (trend.recentTrend === "up") highlights.push("近期状态向上，节奏正在改善");
    if (negativeCount > 0) {
      risks.push(
        `${periodLabel}负向 ${negativeCount} 次，影响 ${negativeDelta >= 0 ? "+" : ""}${negativeDelta}`,
      );
    }
    if (topNegative) {
      risks.push(
        `重点关注：${topNegative.dimension}（${topNegative.negativeCount} 次）`,
      );
    }
    if (trend.recentTrend === "down") risks.push("近期趋势回落，需要及时纠偏");

    suggestions.slice(0, 2).forEach((item) => actions.push(item));
    if (!actions.length) {
      actions.push(
        negativeCount > positiveCount
          ? "建议优先跟进课堂执行与作业完成，设置短周期目标。"
          : "建议保持优势维度，每周沉淀一个可量化进步目标。",
      );
    }

    return {
      summary: summary.aiSummary || "暂无阶段总结",
      suggestion: summary.aiSuggestion || "暂无教师建议",
      trendLine: `${periodLabel}净积分 ${Number(trend.totalScoreDelta || 0)} · 活跃天数 ${Number(trend.activeDays || 0)} · 正向占比 ${positiveRatio}%`,
      highlights: highlights.slice(0, 3),
      risks: risks.slice(0, 3),
      actions: actions.slice(0, 3),
      metrics: {
        positiveCount,
        negativeCount,
        totalScoreDelta: Number(trend.totalScoreDelta || 0),
        activeDays: Number(trend.activeDays || 0),
      },
      dimensions: dimensions.slice(0, 4),
      evidence: Array.isArray(trend.evidence) ? trend.evidence.slice(0, 4) : [],
    };
  }

  function buildAcademicAiBodyHtml(view, helpers = {}) {
    const escapeHtml = helpers.escapeHtml || ((value) => String(value ?? ""));
    const academicDeltaText =
      helpers.academicDeltaText ||
      ((value) => {
        const num = Number(value || 0);
        return num > 0 ? `+${num}` : String(num);
      });
    if (!view) {
      return '<div class="academic-ai-placeholder">暂无 AI 学情摘要。</div>';
    }

    const listHtml = (items, emptyText) =>
      items.length
        ? items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")
        : `<span>${escapeHtml(emptyText)}</span>`;
    const dimensionHtml = view.dimensions.length
      ? view.dimensions
          .map(
            (item) =>
              `<div><span>${escapeHtml(item.dimension)}</span><strong>${item.count}</strong><em>正${item.positiveCount} / 负${item.negativeCount}</em></div>`,
          )
          .join("")
      : "<div><span>暂无维度</span><strong>0</strong><em>待积累</em></div>";
    const evidenceHtml = view.evidence.length
      ? view.evidence
          .map(
            (item) => `<div class="academic-ai-evidence-item">
          <strong>${escapeHtml(item.ruleName || item.signal || "学情事件")}</strong>
          <span>${escapeHtml([item.date, item.subject, item.scene].filter(Boolean).join(" · "))}</span>
          <b class="${Number(item.scoreDelta || 0) >= 0 ? "up" : "down"}">${academicDeltaText(item.scoreDelta)}</b>
        </div>`,
          )
          .join("")
      : '<div class="academic-ai-evidence-item"><strong>暂无关键证据</strong><span>后续会展示课堂、作业和学科事件</span><b>--</b></div>';

    return `
    <div class="academic-ai-summary-grid">
      <div class="academic-ai-copy"><span>阶段总结</span><p>${escapeHtml(view.summary)}</p></div>
      <div class="academic-ai-copy soft"><span>教师建议</span><p>${escapeHtml(view.suggestion)}</p></div>
    </div>
    <div class="academic-ai-trend">${escapeHtml(view.trendLine)}</div>
    <div class="academic-ai-metrics">
      <div><span>正向次数</span><strong>${view.metrics.positiveCount}</strong></div>
      <div><span>负向次数</span><strong>${view.metrics.negativeCount}</strong></div>
      <div><span>积分净变</span><strong>${view.metrics.totalScoreDelta}</strong></div>
      <div><span>活跃天数</span><strong>${view.metrics.activeDays}</strong></div>
    </div>
    <div class="academic-ai-cards">
      <div><strong>本期亮点</strong>${listHtml(view.highlights, "暂无明显亮点，建议继续积累正向表现。")}</div>
      <div><strong>风险提醒</strong>${listHtml(view.risks, "暂无高风险信号，当前状态整体平稳。")}</div>
      <div><strong>下阶段建议</strong>${listHtml(view.actions, "暂无建议，可重新生成分析。")}</div>
    </div>
    <div class="academic-ai-lower">
      <div class="academic-ai-dimensions">${dimensionHtml}</div>
      <div class="academic-ai-evidence">${evidenceHtml}</div>
    </div>
  `;
  }

  global.DisplayAcademic = {
    splitAcademicAiLines,
    normalizeAcademicDimensions,
    buildAcademicAiView,
    buildAcademicAiBodyHtml,
  };
})(window);
