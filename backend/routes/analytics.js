const express = require('express');
const router = express.Router();
const incidentStore = require('../store/incidentStore');
const {
  computeOverallStats,
  computeStatsByAlertType,
  computeStatsByFix,
  computeMemoryImpact,
} = require('../services/statsService');

/**
 * GET /api/scoreboard
 * Returns computed metrics: overall, byAlertType, byFix, memoryImpact
 * NOTE: All numbers are computed in code, not by LLM.
 */
router.get('/scoreboard', (req, res) => {
  try {
    const incidents = incidentStore.getAll();

    const overall = computeOverallStats(incidents);
    const byAlertType = computeStatsByAlertType(incidents);
    const byFix = computeStatsByFix(incidents);
    const memoryImpact = computeMemoryImpact(incidents);

    res.json({
      overall,
      byAlertType,
      byFix,
      memoryImpact,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[AnalyticsRoute] Error computing scoreboard:', err);
    res.status(500).json({ error: 'Failed to compute scoreboard', message: err.message });
  }
});

module.exports = router;
