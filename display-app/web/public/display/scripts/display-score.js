(function initDisplayScore(global) {
  function createEmptyScoreEffectsBucket() {
    return {
      byStudent: new Map(),
      upgrades: new Map(),
      classScoreDelta: 0,
      eventCount: 0,
      suppressSound: false,
    };
  }

  function shouldSuppressScoreSoundForPayload(payload) {
    return payload?.suppressScoreSound === true;
  }

  function accumulateScoreEffects(bucket, payload) {
    if (!bucket || !payload) return;
    const changes = Array.isArray(payload.changes) ? payload.changes : [];
    if (shouldSuppressScoreSoundForPayload(payload)) {
      bucket.suppressSound = true;
    }
    changes.forEach((change) => {
      const studentId = Number(change?.studentId);
      if (!Number.isFinite(studentId) || studentId <= 0) return;
      const prev = bucket.byStudent.get(studentId) || {
        studentId,
        netDelta: 0,
        currentScore: null,
        currentPetLevel: null,
      };
      const scoreDelta = Number(change.scoreDelta || 0);
      prev.netDelta += Number.isFinite(scoreDelta) ? scoreDelta : 0;
      if (change.currentScore != null) {
        prev.currentScore = Number(change.currentScore);
      }
      if (change.currentPetLevel != null) {
        prev.currentPetLevel = Number(change.currentPetLevel);
      }
      bucket.byStudent.set(studentId, prev);
    });

    (Array.isArray(payload.upgrades) ? payload.upgrades : []).forEach((item) => {
      const studentId = Number(item?.studentId);
      const afterLevel = Number(item?.afterLevel || 0);
      if (!Number.isFinite(studentId) || studentId <= 0) return;
      bucket.upgrades.set(studentId, {
        studentId,
        afterLevel:
          Number.isFinite(afterLevel) && afterLevel > 0 ? afterLevel : null,
      });
    });

    if (typeof payload.classScoreDelta === "number") {
      bucket.classScoreDelta += payload.classScoreDelta;
    }
    bucket.eventCount += 1;
  }

  function scoreEffectsToRows(bucket) {
    if (!bucket) return [];
    return Array.from(bucket.byStudent.values()).filter(
      (row) => row.netDelta !== 0 || row.currentScore != null,
    );
  }

  function computeScoreAnimDuration(animCount, budget = {}) {
    const staggerMs = budget.scoreAnimStaggerMs ?? 120;
    const floatMs = budget.scoreFloatDurationMs ?? 1400;
    const tailMs = budget.scoreFloatTailMs ?? 180;
    const count = Math.max(0, Number(animCount) || 0);
    if (count <= 0) return 0;
    return (count - 1) * staggerMs + floatMs + tailMs;
  }

  function getRemoteScoreAnimCount(rows = [], mode = "immediate", budget = {}) {
    const activeRows = rows.filter((row) => row.netDelta !== 0);
    const cap = budget.remoteScoreAnimCap ?? 8;
    return mode === "deferred" && activeRows.length > cap
      ? cap
      : activeRows.length;
  }

  function selectRemoteScoreRows(rows = [], mode = "immediate", budget = {}) {
    const cap = budget.remoteScoreAnimCap ?? 8;
    if (mode !== "deferred" || rows.length <= cap) {
      return rows;
    }
    return [...rows]
      .sort((a, b) => Math.abs(b.netDelta) - Math.abs(a.netDelta))
      .slice(0, cap);
  }

  function upgradesFromBucket(bucket) {
    if (!bucket) return [];
    return Array.from(bucket.upgrades.values()).map((item) => ({
      studentId: item.studentId,
      afterLevel: item.afterLevel,
    }));
  }

  global.DisplayScore = {
    createEmptyScoreEffectsBucket,
    shouldSuppressScoreSoundForPayload,
    accumulateScoreEffects,
    scoreEffectsToRows,
    computeScoreAnimDuration,
    getRemoteScoreAnimCount,
    selectRemoteScoreRows,
    upgradesFromBucket,
  };
})(window);
