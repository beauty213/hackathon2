/**
 * Pure functions to compute all incident metrics and statistics in code.
 * RULE: ALL numbers are computed here, NOT by the LLM.
 */

function round(num, decimals = 1) {
  if (num === null || num === undefined || isNaN(num)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Compute overall scoreboard metrics
 * @param {Array} incidents 
 */
function computeOverallStats(incidents = []) {
  const totalIncidents = incidents.length;
  const resolved = incidents.filter((i) => i.status === 'resolved');
  const resolvedCount = resolved.length;

  if (resolvedCount === 0) {
    return {
      totalIncidents,
      resolvedCount: 0,
      overallSuccessRate: 0,
      avgTimeToResolve: 0,
    };
  }

  const successCount = resolved.filter((i) => i.outcome === 'success').length;
  const overallSuccessRate = round((successCount / resolvedCount) * 100);

  const times = resolved
    .map((i) => Number(i.timeToResolveMinutes))
    .filter((t) => !isNaN(t) && t > 0);

  const avgTimeToResolve = times.length > 0
    ? round(times.reduce((sum, t) => sum + t, 0) / times.length)
    : 0;

  return {
    totalIncidents,
    resolvedCount,
    overallSuccessRate,
    avgTimeToResolve,
  };
}

/**
 * Compute metrics grouped by alertType
 * @param {Array} incidents 
 */
function computeStatsByAlertType(incidents = []) {
  const groups = {};

  for (const inc of incidents) {
    const type = inc.alertType || 'unknown';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(inc);
  }

  return Object.keys(groups).map((alertType) => {
    const list = groups[alertType];
    const total = list.length;
    const resolved = list.filter((i) => i.status === 'resolved');
    const successes = resolved.filter((i) => i.outcome === 'success').length;
    const successRate = resolved.length > 0 ? round((successes / resolved.length) * 100) : 0;

    const times = resolved
      .map((i) => Number(i.timeToResolveMinutes))
      .filter((t) => !isNaN(t) && t > 0);
    const avgTimeToResolve = times.length > 0
      ? round(times.reduce((sum, t) => sum + t, 0) / times.length)
      : 0;

    return {
      alertType,
      count: total,
      resolvedCount: resolved.length,
      successRate,
      avgTimeToResolve,
    };
  });
}

/**
 * Compute metrics grouped by (alertType, fixApplied)
 * @param {Array} incidents 
 */
function computeStatsByFix(incidents = []) {
  const groups = {};

  const resolved = incidents.filter((i) => i.status === 'resolved' && i.fixApplied);

  for (const inc of resolved) {
    const key = `${inc.alertType}:::${inc.fixApplied}`;
    if (!groups[key]) {
      groups[key] = {
        alertType: inc.alertType,
        fixApplied: inc.fixApplied,
        items: [],
      };
    }
    groups[key].items.push(inc);
  }

  return Object.values(groups).map((group) => {
    const timesUsed = group.items.length;
    const successes = group.items.filter((i) => i.outcome === 'success').length;
    const successRate = round((successes / timesUsed) * 100);

    const times = group.items
      .map((i) => Number(i.timeToResolveMinutes))
      .filter((t) => !isNaN(t) && t > 0);
    const avgTimeToResolve = times.length > 0
      ? round(times.reduce((sum, t) => sum + t, 0) / times.length)
      : 0;

    return {
      alertType: group.alertType,
      fixApplied: group.fixApplied,
      timesUsed,
      successRate,
      avgTimeToResolve,
    };
  });
}

/**
 * Compute Memory Impact comparing memoryAssisted=true vs memoryAssisted=false
 * @param {Array} incidents 
 */
function computeMemoryImpact(incidents = []) {
  const resolved = incidents.filter((i) => i.status === 'resolved');

  const assisted = resolved.filter(
    (i) => i.memoryAssisted === true && Number(i.timeToResolveMinutes) > 0
  );
  const unassisted = resolved.filter(
    (i) => i.memoryAssisted === false && Number(i.timeToResolveMinutes) > 0
  );

  const assistedAvgTime = assisted.length > 0
    ? round(assisted.reduce((sum, i) => sum + Number(i.timeToResolveMinutes), 0) / assisted.length)
    : 0;

  const unassistedAvgTime = unassisted.length > 0
    ? round(unassisted.reduce((sum, i) => sum + Number(i.timeToResolveMinutes), 0) / unassisted.length)
    : 0;

  let percentImprovement = 0;
  if (unassistedAvgTime > 0 && assistedAvgTime > 0) {
    percentImprovement = round(((unassistedAvgTime - assistedAvgTime) / unassistedAvgTime) * 100);
  }

  return {
    assistedCount: assisted.length,
    unassistedCount: unassisted.length,
    assistedAvgTime,
    unassistedAvgTime,
    percentImprovement: Math.max(0, percentImprovement),
  };
}

/**
 * Compute candidate fixes for What-If scenario analysis for a given alertType
 * Ranked by success rate DESC first, then faster avgTimeToResolve ASC.
 * Flags fixes with timesUsed < 2 as lowSampleSize.
 * @param {string} alertType 
 * @param {Array} incidents 
 */
function computeWhatIfCandidates(alertType, incidents = []) {
  const relevant = incidents.filter(
    (i) => i.alertType === alertType && i.status === 'resolved' && i.fixApplied
  );

  const fixMap = {};

  for (const inc of relevant) {
    const fix = inc.fixApplied;
    if (!fixMap[fix]) {
      fixMap[fix] = {
        fixApplied: fix,
        items: [],
      };
    }
    fixMap[fix].items.push(inc);
  }

  const candidates = Object.values(fixMap).map((entry) => {
    const timesUsed = entry.items.length;
    const successes = entry.items.filter((i) => i.outcome === 'success').length;
    const successRate = round((successes / timesUsed) * 100);

    const times = entry.items
      .map((i) => Number(i.timeToResolveMinutes))
      .filter((t) => !isNaN(t) && t > 0);
    const avgTimeToResolve = times.length > 0
      ? round(times.reduce((sum, t) => sum + t, 0) / times.length)
      : 0;

    // Find the latest timestamp when this fix was applied
    const sortedDates = entry.items
      .map((i) => i.timestamp)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a));
    const lastUsed = sortedDates[0] || 'N/A';

    return {
      fixApplied: entry.fixApplied,
      timesUsed,
      successRate,
      avgTimeToResolve,
      lastUsed,
      lowSampleSize: timesUsed < 2,
    };
  });

  // Rank: highest success rate first, then lowest avgTimeToResolve
  candidates.sort((a, b) => {
    if (b.successRate !== a.successRate) {
      return b.successRate - a.successRate;
    }
    return a.avgTimeToResolve - b.avgTimeToResolve;
  });

  // Assign recommendedRank (1, 2, 3...)
  return candidates.map((c, index) => ({
    ...c,
    recommendedRank: index + 1,
  }));
}

module.exports = {
  computeOverallStats,
  computeStatsByAlertType,
  computeStatsByFix,
  computeMemoryImpact,
  computeWhatIfCandidates,
};
