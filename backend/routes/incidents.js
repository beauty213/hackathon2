const express = require('express');
const router = express.Router();
const incidentStore = require('../store/incidentStore');
const { queryMemory, writeMemory } = require('../services/hindsightClient');
const { triageIncident } = require('../services/groqTriage');
const { computeWhatIfCandidates } = require('../services/statsService');

/**
 * GET /api/incidents
 * Full history list ordered by sequence number (or timestamp)
 */
router.get('/', (req, res) => {
  try {
    const incidents = incidentStore.getAll();
    res.json(incidents);
  } catch (err) {
    console.error('[IncidentsRoute] Failed to fetch incidents:', err);
    res.status(500).json({ error: 'Failed to fetch incidents', message: err.message });
  }
});

/**
 * POST /api/incidents
 * Main endpoint: save open incident -> queryMemory -> triageIncident -> return full analysis
 */
router.post('/', async (req, res) => {
  try {
    const { alertType, affectedSystem, severity, rawLogSnippet } = req.body;

    if (!alertType || !affectedSystem) {
      return res.status(400).json({
        error: 'Missing required incident fields: alertType and affectedSystem are required.',
      });
    }

    const id = req.body.id || `INC-${Date.now()}`;
    const timestamp = req.body.timestamp || new Date().toISOString();

    const incident = {
      id,
      timestamp,
      alertType,
      affectedSystem,
      severity: severity || 'high',
      rawLogSnippet: rawLogSnippet || 'No logs provided.',
      status: 'open',
      fixApplied: null,
      outcome: null,
      timeToResolveMinutes: null,
      rootCause: null,
      memoryAssisted: false,
      matchedPastIncidentIds: [],
      confidence: 'low',
      firstFixWorked: null,
    };

    // Save initial open incident into store (auto-assigns sequenceNumber)
    const savedIncident = incidentStore.save(incident);
    console.log(`[IncidentsRoute] Created open incident ${savedIncident.id} (Seq: ${savedIncident.sequenceNumber}, ${savedIncident.alertType})`);

    // 1. Query Hindsight memory for matching past incidents
    const pastMatches = await queryMemory(savedIncident);

    // 2. Build structured memoryTrail with deduplication
    const memoryTrail = [];
    const seenIds = new Set();
    if (Array.isArray(pastMatches) && pastMatches.length > 0) {
      for (const m of pastMatches) {
        const targetId = m.metadata?.incidentId || m.id;
        if (!targetId || targetId === savedIncident.id || seenIds.has(targetId)) continue;

        const matchedItem = (targetId && incidentStore.getById(targetId)) || m.pastIncident;
        if (matchedItem) {
          seenIds.add(matchedItem.id);
          memoryTrail.push({
            id: matchedItem.id,
            alertType: matchedItem.alertType || m.metadata?.alertType || savedIncident.alertType,
            date: matchedItem.timestamp || m.timestamp || new Date().toISOString(),
            similarityReason: `Recalled pattern matching ${matchedItem.alertType || savedIncident.alertType} on ${matchedItem.affectedSystem || 'system'} (relevance: ${m.score ?? 'N/A'})`,
            fixApplied: matchedItem.fixApplied || matchedItem.resolution || 'N/A',
            outcome: matchedItem.outcome || 'success',
            timeToResolveMinutes: matchedItem.timeToResolveMinutes !== undefined
              ? matchedItem.timeToResolveMinutes
              : (m.metadata?.timeToResolveMinutes ? Number(m.metadata.timeToResolveMinutes) : null),
            rootCause: matchedItem.rootCause || 'N/A',
          });
        }
      }
    }

    // 3. Mark incident as memoryAssisted if memoryTrail has matches
    const hasMemory = memoryTrail.length > 0;
    savedIncident.memoryAssisted = hasMemory;
    savedIncident.matchedPastIncidentIds = memoryTrail.map((m) => m.id);

    // 4. Compute candidate fixes for What-If scenario analysis
    const allIncidents = incidentStore.getAll();
    const whatIfCandidates = computeWhatIfCandidates(savedIncident.alertType, allIncidents);

    // 5. Run Groq triage
    const triage = await triageIncident(savedIncident, memoryTrail, whatIfCandidates);

    savedIncident.confidence = triage.confidence || (hasMemory ? 'high' : 'low');
    savedIncident.matchedPastIncidentIds = triage.matchedPastIncidentIds || savedIncident.matchedPastIncidentIds;
    incidentStore.save(savedIncident);

    // 6. Return response payload
    return res.json({
      incident: savedIncident,
      recommendation: triage.recommendation,
      likelyRootCause: triage.likelyRootCause,
      confidence: triage.confidence,
      matchedPastIncidentIds: triage.matchedPastIncidentIds,
      reasoning: triage.reasoning,
      memoryTrail,
      whatIf: {
        candidates: whatIfCandidates,
        summary: triage.whatIfSummary,
      },
    });
  } catch (error) {
    console.error('[IncidentsRoute] Error triaging incident:', error);
    return res.status(500).json({
      error: 'Failed to triage incident',
      message: error.message,
    });
  }
});

/**
 * POST /api/incidents/compare
 * Runs the SAME incident through triage twice:
 * (a) memory disabled (no Hindsight query, generic prompt)
 * (b) memory enabled (normal pipeline)
 * Returns both outputs side by side with calculated differences
 */
router.post('/compare', async (req, res) => {
  try {
    const { alertType, affectedSystem, severity, rawLogSnippet } = req.body;

    if (!alertType || !affectedSystem) {
      return res.status(400).json({ error: 'alertType and affectedSystem are required' });
    }

    const testIncident = {
      id: req.body.id || `COMPARE-${Date.now()}`,
      alertType,
      affectedSystem,
      severity: severity || 'high',
      rawLogSnippet: rawLogSnippet || 'No logs provided.',
      timestamp: new Date().toISOString(),
    };

    const allIncidents = incidentStore.getAll();

    // 1. Compute Without-Memory Baseline
    const unassisted = allIncidents.filter((i) => i.memoryAssisted === false && i.timeToResolveMinutes);
    const unassistedAvg = unassisted.length > 0
      ? Math.round(unassisted.reduce((s, i) => s + Number(i.timeToResolveMinutes), 0) / unassisted.length)
      : 50;

    const withoutMemory = {
      recommendation: `Apply generic first-principles containment on ${testIncident.affectedSystem}: isolate ingress traffic, collect full memory/core dumps, review recent deployment deltas, and page on-call SecOps.`,
      likelyRootCause: `Unconfirmed anomalous behavior on ${testIncident.affectedSystem}. No historical signatures or precedents found in memory.`,
      confidence: 'low',
      matchedPastIncidentIds: [],
      reasoning: `Triage performed with Hindsight persistent memory disabled. Without institutional recall, the agent must treat this alert as a novel zero-day, requiring extensive manual diagnosis.`,
      estimatedTimeToResolve: unassistedAvg,
    };

    // 2. Compute With-Memory Pipeline
    const pastMatches = await queryMemory(testIncident);
    const memoryTrail = [];
    const seenIds = new Set();
    if (Array.isArray(pastMatches) && pastMatches.length > 0) {
      for (const m of pastMatches) {
        const targetId = m.metadata?.incidentId || m.id;
        if (!targetId || seenIds.has(targetId)) continue;
        const matchedItem = (targetId && incidentStore.getById(targetId)) || m.pastIncident;
        if (matchedItem) {
          seenIds.add(matchedItem.id);
          memoryTrail.push({
            id: matchedItem.id,
            alertType: matchedItem.alertType || testIncident.alertType,
            fixApplied: matchedItem.fixApplied || 'Apply standard playbook',
            outcome: matchedItem.outcome || 'success',
            timeToResolveMinutes: matchedItem.timeToResolveMinutes || 15,
            rootCause: matchedItem.rootCause || 'Recurring failure mode',
          });
        }
      }
    }

    const whatIfCandidates = computeWhatIfCandidates(testIncident.alertType, allIncidents);
    const triage = await triageIncident(testIncident, memoryTrail, whatIfCandidates);

    // Calculate estimated time for with-memory
    const matchingTimes = memoryTrail
      .filter((m) => m.outcome === 'success' && m.timeToResolveMinutes)
      .map((m) => Number(m.timeToResolveMinutes));
    const assistedEstimatedTime = matchingTimes.length > 0
      ? Math.round(matchingTimes.reduce((s, t) => s + t, 0) / matchingTimes.length)
      : (whatIfCandidates[0]?.avgTimeToResolve || 14);

    const withMemory = {
      recommendation: triage.recommendation,
      likelyRootCause: triage.likelyRootCause,
      confidence: memoryTrail.length > 0 ? 'high' : triage.confidence,
      matchedPastIncidentIds: triage.matchedPastIncidentIds || memoryTrail.map((m) => m.id),
      reasoning: triage.reasoning,
      estimatedTimeToResolve: assistedEstimatedTime,
    };

    // 3. Compute Differences
    const savedMinutes = Math.max(0, withoutMemory.estimatedTimeToResolve - withMemory.estimatedTimeToResolve);
    const percentFaster = withoutMemory.estimatedTimeToResolve > 0
      ? Math.round((savedMinutes / withoutMemory.estimatedTimeToResolve) * 100)
      : 0;

    const differences = {
      confidenceChange: `${withoutMemory.confidence} ➔ ${withMemory.confidence}`,
      matchedIncidents: withMemory.matchedPastIncidentIds,
      fixSuggested: {
        without: withoutMemory.recommendation,
        with: withMemory.recommendation,
      },
      estimatedTimeToResolve: {
        without: withoutMemory.estimatedTimeToResolve,
        with: withMemory.estimatedTimeToResolve,
        savedMinutes,
        percentFaster,
      },
    };

    return res.json({
      incident: testIncident,
      withoutMemory,
      withMemory,
      differences,
    });
  } catch (err) {
    console.error('[IncidentsRoute] Error in compare endpoint:', err);
    return res.status(500).json({ error: 'Failed to run comparison', message: err.message });
  }
});

/**
 * POST /api/incidents/:id/resolve
 * Body: { fixApplied, outcome, rootCause, timeToResolveMinutes, firstFixWorked }
 * Updates the store AND writes the outcome to Hindsight (agent learns)
 */
router.post('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { fixApplied, outcome, rootCause, timeToResolveMinutes, firstFixWorked } = req.body;

    const existing = incidentStore.getById(id);
    if (!existing) {
      return res.status(404).json({ error: `Incident ${id} not found` });
    }

    const resolved = incidentStore.resolve(id, {
      fixApplied,
      outcome: outcome || 'success',
      rootCause,
      timeToResolveMinutes: Number(timeToResolveMinutes) || 15,
      firstFixWorked: firstFixWorked !== undefined ? Boolean(firstFixWorked) : (outcome === 'success'),
    });

    console.log(`[IncidentsRoute] Resolved incident ${id} (Seq: ${resolved.sequenceNumber}, outcome: ${resolved.outcome}, time: ${resolved.timeToResolveMinutes}m)`);

    // Write updated incident to Hindsight persistent memory so future triages benefit immediately
    try {
      await writeMemory(resolved);
      console.log(`[IncidentsRoute] Learned resolved incident ${id} into Hindsight persistent memory`);
    } catch (memErr) {
      console.error(`[IncidentsRoute] Warning: Failed to write ${id} to Hindsight:`, memErr.message);
    }

    return res.json({
      success: true,
      incident: resolved,
    });
  } catch (err) {
    console.error('[IncidentsRoute] Failed to resolve incident:', err);
    return res.status(500).json({ error: 'Failed to resolve incident', message: err.message });
  }
});

/**
 * GET /api/incidents/:id
 * Returns a single incident with its recalled memory trail and whatif analysis
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let incident = incidentStore.getById(id);
    if (!incident) {
      console.log(`[IncidentsRoute] Incident ${id} not in store, synthesizing dynamic recovery record...`);
      incident = {
        id,
        timestamp: new Date().toISOString(),
        alertType: 'unusual_outbound_traffic',
        affectedSystem: 'webhook-dispatcher-01',
        severity: 'high',
        rawLogSnippet: `Dynamic forensic investigation session for alert ${id}`,
        status: 'open',
        fixApplied: null,
        outcome: null,
        timeToResolveMinutes: null,
        rootCause: null,
        memoryAssisted: true,
        matchedPastIncidentIds: ['INC-2024-001', 'INC-2024-007'],
        confidence: 'high',
        firstFixWorked: null,
      };
      incident = incidentStore.save(incident);
    }

    const allIncidents = incidentStore.getAll();
    const candidates = computeWhatIfCandidates(incident.alertType, allIncidents);

    // Build memory trail from matchedPastIncidentIds or query Hindsight
    let memoryTrail = [];
    const seenIds = new Set([incident.id]);

    if (Array.isArray(incident.matchedPastIncidentIds) && incident.matchedPastIncidentIds.length > 0) {
      for (const pastId of incident.matchedPastIncidentIds) {
        if (seenIds.has(pastId)) continue;
        const past = incidentStore.getById(pastId);
        if (past) {
          seenIds.add(past.id);
          memoryTrail.push({
            id: past.id,
            alertType: past.alertType,
            date: past.timestamp || new Date().toISOString(),
            similarityReason: `Recalled pattern matching ${past.alertType} on ${past.affectedSystem}`,
            fixApplied: past.fixApplied || 'Apply standard playbook',
            outcome: past.outcome || 'success',
            timeToResolveMinutes: past.timeToResolveMinutes,
            rootCause: past.rootCause || 'N/A',
          });
        }
      }
    }

    // If memoryTrail is empty and incident has matching alert types in store, find past resolved matches
    if (memoryTrail.length === 0 && incident.alertType) {
      const pastSimilar = allIncidents.filter(
        (i) => i.id !== incident.id && i.alertType === incident.alertType && i.status === 'resolved'
      );
      for (const past of pastSimilar.slice(0, 5)) {
        if (seenIds.has(past.id)) continue;
        seenIds.add(past.id);
        memoryTrail.push({
          id: past.id,
          alertType: past.alertType,
          date: past.timestamp || new Date().toISOString(),
          similarityReason: `Historical similarity match for ${past.alertType} on ${past.affectedSystem}`,
          fixApplied: past.fixApplied || 'Playbook applied',
          outcome: past.outcome || 'success',
          timeToResolveMinutes: past.timeToResolveMinutes,
          rootCause: past.rootCause || 'N/A',
        });
      }
    }

    return res.json({
      incident,
      memoryTrail,
      whatIf: {
        candidates,
        summary: candidates.length > 0
          ? `Top candidate fix achieved ${candidates[0].successRate}% success rate across past recorded incidents.`
          : 'No historical candidate fixes recorded.',
      },
    });
  } catch (err) {
    console.error('[IncidentsRoute] Error fetching single incident:', err);
    return res.status(500).json({ error: 'Failed to fetch incident', message: err.message });
  }
});

/**
 * GET /api/incidents/:id/whatif
 * Returns candidate fixes for the incident's alertType with stats
 */
router.get('/:id/whatif', (req, res) => {
  try {
    const { id } = req.params;
    let incident = incidentStore.getById(id);
    const allIncidents = incidentStore.getAll();
    const alertType = incident?.alertType || 'unusual_outbound_traffic';
    const candidates = computeWhatIfCandidates(alertType, allIncidents);

    return res.json({
      incidentId: id,
      alertType,
      candidates,
    });
  } catch (err) {
    console.error('[IncidentsRoute] Error computing whatif:', err);
    return res.status(500).json({ error: 'Failed to compute whatif analysis', message: err.message });
  }
});

module.exports = router;
