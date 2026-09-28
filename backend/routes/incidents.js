const express = require('express');
const router = express.Router();
const { queryMemory, writeMemory } = require('../services/hindsightClient');
const { triageIncident } = require('../services/groqTriage');

/**
 * POST /api/incidents
 * Main endpoint: queryMemory -> triageIncident -> return result
 */
router.post('/', async (req, res) => {
  try {
    const incident = req.body;

    if (!incident || !incident.alertType || !incident.affectedSystem) {
      return res.status(400).json({
        error: 'Missing required incident fields: alertType and affectedSystem are required.',
      });
    }

    // Default missing properties if omitted
    const normalizedIncident = {
      id: incident.id || `INC-${Date.now()}`,
      timestamp: incident.timestamp || new Date().toISOString(),
      alertType: incident.alertType,
      affectedSystem: incident.affectedSystem,
      severity: incident.severity || 'high',
      rawLogSnippet: incident.rawLogSnippet || 'No logs provided.',
      rootCause: incident.rootCause || null,
      resolution: incident.resolution || null,
    };

    console.log(`[IncidentsRoute] Processing incoming incident ${normalizedIncident.id} (${normalizedIncident.alertType})`);

    // 1. Query Hindsight memory for matching past incidents
    const pastMatches = await queryMemory(normalizedIncident);

    // 2. Perform AI triage with Groq using the incident context + Hindsight matches
    const triage = await triageIncident(normalizedIncident, pastMatches);

    // 3. If caller explicitly requested to learn/retain this incident (or if rootCause/resolution are supplied)
    if (req.body.saveToMemory || (normalizedIncident.rootCause && normalizedIncident.resolution)) {
      await writeMemory({
        ...normalizedIncident,
        rootCause: normalizedIncident.rootCause || triage.likelyRootCause,
        resolution: normalizedIncident.resolution || triage.recommendation,
      });
      console.log(`[IncidentsRoute] Learned new incident ${normalizedIncident.id} into Hindsight memory`);
    }

    // 4. Return the combined result
    return res.json({
      incident: normalizedIncident,
      pastMatches,
      triage,
    });
  } catch (error) {
    console.error('[IncidentsRoute] Error handling incident:', error);
    return res.status(500).json({
      error: 'Failed to triage incident',
      message: error.message,
    });
  }
});

module.exports = router;
