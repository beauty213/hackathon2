/**
 * Pure functions for SentinelMind Memory Impact & Analysis System.
 *
 * GOLDEN RULE: ALL NUMBERS ARE COMPUTED HERE IN CODE.
 * No numbers are ever hallucinated or estimated by the LLM.
 */

function round(val, decimals = 1) {
  if (val === null || val === undefined || isNaN(val)) return null;
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

/**
 * 1. memoryImpact(incidents)
 * Computes comparative performance between memory-assisted and unassisted incidents.
 */
function memoryImpact(incidents = []) {
  const resolved = incidents.filter((i) => i.status === 'resolved');

  if (resolved.length === 0) {
    return {
      avgTimeToResolve: { withMemory: null, withoutMemory: null },
      timeSavedPercent: null,
      successRate: { withMemory: null, withoutMemory: null },
      firstFixAccuracy: { withMemory: null, withoutMemory: null },
      memoryHitRate: null,
      repeatIncidentsCaught: 0,
      failedFixesAvoided: 0,
      totalAnalyzed: 0,
    };
  }

  const assisted = resolved.filter((i) => i.memoryAssisted === true);
  const unassisted = resolved.filter((i) => i.memoryAssisted === false);

  // Resolution Times
  const assistedTimes = assisted
    .map((i) => Number(i.timeToResolveMinutes))
    .filter((t) => !isNaN(t) && t > 0);
  const unassistedTimes = unassisted
    .map((i) => Number(i.timeToResolveMinutes))
    .filter((t) => !isNaN(t) && t > 0);

  const avgWith = assistedTimes.length > 0
    ? round(assistedTimes.reduce((sum, t) => sum + t, 0) / assistedTimes.length)
    : null;
  const avgWithout = unassistedTimes.length > 0
    ? round(unassistedTimes.reduce((sum, t) => sum + t, 0) / unassistedTimes.length)
    : null;

  let timeSavedPercent = null;
  if (avgWithout && avgWith && avgWithout > 0) {
    timeSavedPercent = round(((avgWithout - avgWith) / avgWithout) * 100);
  }

  // Success Rates
  const assistedSuccessCount = assisted.filter((i) => i.outcome === 'success').length;
  const unassistedSuccessCount = unassisted.filter((i) => i.outcome === 'success').length;

  const successWith = assisted.length > 0
    ? round((assistedSuccessCount / assisted.length) * 100)
    : null;
  const successWithout = unassisted.length > 0
    ? round((unassistedSuccessCount / unassisted.length) * 100)
    : null;

  // First-Fix Accuracy
  const assistedFirstFix = assisted.filter((i) => i.firstFixWorked === true).length;
  const unassistedFirstFix = unassisted.filter((i) => i.firstFixWorked === true).length;

  const firstFixWith = assisted.length > 0
    ? round((assistedFirstFix / assisted.length) * 100)
    : null;
  const firstFixWithout = unassisted.length > 0
    ? round((unassistedFirstFix / unassisted.length) * 100)
    : null;

  // Memory Hit Rate
  const memoryHitRate = round((assisted.length / resolved.length) * 100);

  // Failed Fixes Avoided:
  // Identify known fixes that previously failed or were partial
  const failedFixesByAlert = new Set();
  for (const inc of unassisted) {
    if ((inc.outcome === 'failed' || inc.outcome === 'partial') && inc.fixApplied) {
      failedFixesByAlert.add(`${inc.alertType}:::${inc.fixApplied.toLowerCase().trim()}`);
    }
  }

  // Count how many assisted incidents had a prior failure recorded for their alertType
  // but applied a different, successful fix
  let failedFixesAvoided = 0;
  for (const inc of assisted) {
    if (inc.outcome === 'success' && inc.fixApplied) {
      const matchingFailure = Array.from(failedFixesByAlert).some(
        (key) => key.startsWith(`${inc.alertType}:::`) && !key.endsWith(`:::${inc.fixApplied.toLowerCase().trim()}`)
      );
      if (matchingFailure) {
        failedFixesAvoided++;
      }
    }
  }

  return {
    avgTimeToResolve: {
      withMemory: avgWith,
      withoutMemory: avgWithout,
    },
    timeSavedPercent,
    successRate: {
      withMemory: successWith,
      withoutMemory: successWithout,
    },
    firstFixAccuracy: {
      withMemory: firstFixWith,
      withoutMemory: firstFixWithout,
    },
    memoryHitRate,
    repeatIncidentsCaught: assisted.length,
    failedFixesAvoided,
    totalAnalyzed: resolved.length,
  };
}

/**
 * 2. learningCurve(incidents)
 * Computes chronological resolution time and rolling average to visualize agent progression.
 */
function learningCurve(incidents = []) {
  const sorted = [...incidents]
    .filter((i) => i.timeToResolveMinutes && Number(i.timeToResolveMinutes) > 0)
    .sort((a, b) => (Number(a.sequenceNumber) || 0) - (Number(b.sequenceNumber) || 0));

  let cumulativeMemoriesCount = 0;

  return sorted.map((inc, index) => {
    if (inc.memoryAssisted) {
      cumulativeMemoriesCount++;
    }

    const time = Number(inc.timeToResolveMinutes);

    // Rolling average over window of 3 (current + up to 2 previous)
    const windowStart = Math.max(0, index - 2);
    const windowSlice = sorted.slice(windowStart, index + 1);
    const windowSum = windowSlice.reduce((sum, item) => sum + Number(item.timeToResolveMinutes), 0);
    const rollingAvgTime = round(windowSum / windowSlice.length);

    let confidenceScore = 1; // low
    if (inc.confidence === 'high') confidenceScore = 3;
    else if (inc.confidence === 'medium') confidenceScore = 2;

    return {
      sequenceNumber: inc.sequenceNumber || index + 1,
      incidentId: inc.id,
      alertType: inc.alertType,
      timeToResolveMinutes: time,
      rollingAvgTime,
      cumulativeMemories: cumulativeMemoriesCount,
      confidenceScore,
      confidence: inc.confidence || (inc.memoryAssisted ? 'high' : 'low'),
      memoryAssisted: Boolean(inc.memoryAssisted),
      outcome: inc.outcome || 'success',
    };
  });
}

/**
 * 3. analysisSummary(incidents)
 * Comprehensive breakdown by alertType, byFix, top recurring, and code-generated insights.
 */
function analysisSummary(incidents = []) {
  const total = incidents.length;
  const resolved = incidents.filter((i) => i.status === 'resolved');
  const open = incidents.filter((i) => i.status === 'open');

  const successes = resolved.filter((i) => i.outcome === 'success').length;
  const overallSuccessRate = resolved.length > 0 ? round((successes / resolved.length) * 100) : null;

  const validTimes = resolved
    .map((i) => Number(i.timeToResolveMinutes))
    .filter((t) => !isNaN(t) && t > 0);
  const avgTimeToResolve = validTimes.length > 0
    ? round(validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length)
    : null;

  // Breakdown by alertType
  const typeGroups = {};
  for (const inc of incidents) {
    const t = inc.alertType || 'unknown';
    if (!typeGroups[t]) typeGroups[t] = [];
    typeGroups[t].push(inc);
  }

  const byAlertType = Object.keys(typeGroups).map((alertType) => {
    const list = typeGroups[alertType].sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
    const count = list.length;
    const resolvedList = list.filter((i) => i.status === 'resolved');
    const successCount = resolvedList.filter((i) => i.outcome === 'success').length;
    const successRate = resolvedList.length > 0 ? round((successCount / resolvedList.length) * 100) : null;

    const times = resolvedList.map((i) => Number(i.timeToResolveMinutes)).filter((t) => !isNaN(t) && t > 0);
    const avgTime = times.length > 0 ? round(times.reduce((sum, t) => sum + t, 0) / times.length) : null;

    const assistedCount = resolvedList.filter((i) => i.memoryAssisted === true).length;
    const memoryHitRate = resolvedList.length > 0 ? round((assistedCount / resolvedList.length) * 100) : null;

    // Trend: compare first half vs second half of incidents
    let trend = 'flat';
    if (times.length >= 2) {
      const mid = Math.floor(times.length / 2);
      const firstHalf = times.slice(0, mid);
      const secondHalf = times.slice(mid);

      const avg1 = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
      const avg2 = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;

      if (avg2 < avg1 - 2) {
        trend = 'improving'; // faster is better
      } else if (avg2 > avg1 + 2) {
        trend = 'worsening';
      }
    }

    return {
      alertType,
      count,
      resolvedCount: resolvedList.length,
      successRate,
      avgTime,
      memoryHitRate,
      trend,
    };
  });

  // Top 3 recurring types
  const topRecurringTypes = [...byAlertType]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Breakdown by fix
  const fixGroups = {};
  for (const inc of resolved) {
    if (!inc.fixApplied) continue;
    const key = `${inc.alertType}:::${inc.fixApplied}`;
    if (!fixGroups[key]) {
      fixGroups[key] = {
        alertType: inc.alertType,
        fixApplied: inc.fixApplied,
        items: [],
      };
    }
    fixGroups[key].items.push(inc);
  }

  const byFix = Object.values(fixGroups).map((g) => {
    const timesUsed = g.items.length;
    const succ = g.items.filter((i) => i.outcome === 'success').length;
    const successRate = round((succ / timesUsed) * 100);

    const times = g.items.map((i) => Number(i.timeToResolveMinutes)).filter((t) => !isNaN(t) && t > 0);
    const avgTime = times.length > 0 ? round(times.reduce((s, t) => s + t, 0) / times.length) : null;

    const timestamps = g.items.map((i) => i.timestamp).filter(Boolean).sort((a, b) => new Date(b) - new Date(a));
    const lastUsed = timestamps[0] || 'N/A';

    return {
      alertType: g.alertType,
      fixApplied: g.fixApplied,
      timesUsed,
      successRate,
      avgTime,
      lastUsed,
      lowSampleFlag: timesUsed < 2,
    };
  });

  // Auto-Generated Insights (from code templates using pure computed numbers)
  const impact = memoryImpact(incidents);
  const insights = [];

  if (impact.timeSavedPercent && impact.timeSavedPercent > 0) {
    insights.push(
      `Hindsight persistent memory reduced resolution time by ${impact.timeSavedPercent}% (averaging ${impact.avgTimeToResolve.withMemory}m with memory vs ${impact.avgTimeToResolve.withoutMemory}m unassisted).`
    );
  }

  if (impact.firstFixAccuracy.withMemory !== null && impact.firstFixAccuracy.withoutMemory !== null) {
    insights.push(
      `First-fix accuracy jumped from ${impact.firstFixAccuracy.withoutMemory}% without memory to ${impact.firstFixAccuracy.withMemory}% when recalling institutional playbooks.`
    );
  }

  if (impact.failedFixesAvoided > 0) {
    insights.push(
      `Autonomous pattern matching successfully detected and averted ${impact.failedFixesAvoided} previously failed remediation attempts.`
    );
  }

  if (topRecurringTypes.length > 0 && topRecurringTypes[0].trend === 'improving') {
    insights.push(
      `High-volume '${topRecurringTypes[0].alertType}' alerts are trending significantly faster (${topRecurringTypes[0].avgTime}m avg) as the agent's institutional memory consolidates.`
    );
  }

  if (insights.length < 3) {
    insights.push(
      `Memory Hit Rate stands at ${impact.memoryHitRate}%, covering ${impact.repeatIncidentsCaught} repeat incident patterns.`
    );
  }

  return {
    overall: {
      total,
      resolved: resolved.length,
      open: open.length,
      successRate: overallSuccessRate,
      avgTimeToResolve,
    },
    byAlertType,
    byFix,
    topRecurringTypes,
    insights,
  };
}

module.exports = {
  memoryImpact,
  learningCurve,
  analysisSummary,
};
