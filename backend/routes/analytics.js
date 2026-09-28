const express = require('express');
const router = express.Router();
const incidentStore = require('../store/incidentStore');
const {
  computeOverallStats,
  computeStatsByAlertType,
  computeStatsByFix,
  computeMemoryImpact,
} = require('../services/statsService');
const {
  memoryImpact,
  learningCurve,
  analysisSummary,
} = require('../services/analyticsService');

/**
 * GET /api/analytics/memory-impact
 * Comparative metrics: with memory vs without memory, hit rate, failed fixes avoided
 */
router.get(['/analytics/memory-impact', '/memory-impact'], (req, res) => {
  try {
    const incidents = incidentStore.getAll();
    const result = memoryImpact(incidents);
    res.json(result);
  } catch (err) {
    console.error('[AnalyticsRoute] Error computing memory-impact:', err);
    res.status(500).json({ error: 'Failed to compute memory impact', message: err.message });
  }
});

/**
 * GET /api/analytics/learning-curve
 * Chronological sequence with resolution times, rolling averages, and confidence scores
 */
router.get(['/analytics/learning-curve', '/learning-curve'], (req, res) => {
  try {
    const incidents = incidentStore.getAll();
    const curve = learningCurve(incidents);
    res.json(curve);
  } catch (err) {
    console.error('[AnalyticsRoute] Error computing learning-curve:', err);
    res.status(500).json({ error: 'Failed to compute learning curve', message: err.message });
  }
});

/**
 * GET /api/analytics/summary
 * Full analysis summary: overall, byAlertType with trends, byFix, and auto-generated insights
 */
router.get(['/analytics/summary', '/summary'], (req, res) => {
  try {
    const incidents = incidentStore.getAll();
    const summary = analysisSummary(incidents);
    res.json(summary);
  } catch (err) {
    console.error('[AnalyticsRoute] Error computing summary:', err);
    res.status(500).json({ error: 'Failed to compute summary', message: err.message });
  }
});

/**
 * GET /api/scoreboard (Legacy & backwards compatibility)
 */
router.get(['/scoreboard', '/api/scoreboard'], (req, res) => {
  try {
    const incidents = incidentStore.getAll();
    const overall = computeOverallStats(incidents);
    const byAlertType = computeStatsByAlertType(incidents);
    const byFix = computeStatsByFix(incidents);
    const impact = computeMemoryImpact(incidents);

    res.json({
      overall,
      byAlertType,
      byFix,
      memoryImpact: impact,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[AnalyticsRoute] Error computing scoreboard:', err);
    res.status(500).json({ error: 'Failed to compute scoreboard', message: err.message });
  }
});

module.exports = router;
