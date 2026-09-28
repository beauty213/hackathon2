const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const HINDSIGHT_BASE_URL = process.env.HINDSIGHT_BASE_URL || 'https://api.hindsight.vectorize.io';
const HINDSIGHT_API_KEY = process.env.HINDSIGHT_API_KEY || '';
const HINDSIGHT_BANK_ID = process.env.HINDSIGHT_BANK_ID || 'sentinelmind-incidents';

// In-memory persistent mirror for resiliency and offline/demo fallback
const localMemoryStore = [];

let sdkClient = null;
try {
  const { HindsightClient } = require('@vectorize-io/hindsight-client');
  if (HINDSIGHT_API_KEY) {
    sdkClient = new HindsightClient({
      baseUrl: HINDSIGHT_BASE_URL,
      apiKey: HINDSIGHT_API_KEY,
    });
    console.log(`[Hindsight] Initialized HindsightClient for bank: ${HINDSIGHT_BANK_ID} at ${HINDSIGHT_BASE_URL}`);
  } else {
    console.warn('[Hindsight] No HINDSIGHT_API_KEY provided. Using in-memory fallback memory store.');
  }
} catch (err) {
  console.warn('[Hindsight] @vectorize-io/hindsight-client not loaded directly, falling back to HTTP/in-memory:', err.message);
}

/**
 * Format an incident object into a comprehensive memory document text
 */
function formatIncidentMemory(incident) {
  return [
    `Incident ID: ${incident.id}`,
    `Alert Type: ${incident.alertType}`,
    `Affected System: ${incident.affectedSystem}`,
    `Severity: ${incident.severity}`,
    `Timestamp: ${incident.timestamp || new Date().toISOString()}`,
    `Root Cause: ${incident.rootCause || 'Under Investigation'}`,
    `Resolution: ${incident.resolution || 'Pending Remediation'}`,
    `Raw Log Snippet: ${incident.rawLogSnippet}`,
  ].join('\n');
}

/**
 * Write an incident into Hindsight persistent memory
 * @param {Object} incident 
 * @returns {Promise<Object>}
 */
async function writeMemory(incident) {
  const content = formatIncidentMemory(incident);
  const metadata = {
    incidentId: String(incident.id),
    alertType: String(incident.alertType),
    affectedSystem: String(incident.affectedSystem),
    severity: String(incident.severity),
    hasRootCause: incident.rootCause ? 'true' : 'false',
    hasResolution: incident.resolution ? 'true' : 'false',
  };

  // Always retain in local memory store as guaranteed fallback
  const existingIdx = localMemoryStore.findIndex(m => m.incidentId === incident.id);
  const localRecord = {
    incidentId: incident.id,
    content,
    incident,
    metadata,
    timestamp: incident.timestamp || new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    localMemoryStore[existingIdx] = localRecord;
  } else {
    localMemoryStore.push(localRecord);
  }

  // If Hindsight SDK client is active, retain in Hindsight cloud/server
  if (sdkClient && HINDSIGHT_API_KEY) {
    try {
      console.log(`[Hindsight] Retaining incident ${incident.id} into bank '${HINDSIGHT_BANK_ID}'...`);
      const response = await sdkClient.retain(HINDSIGHT_BANK_ID, content, {
        timestamp: incident.timestamp ? new Date(incident.timestamp) : new Date(),
        context: `Security incident triage log for ${incident.affectedSystem}`,
        metadata,
      });
      console.log(`[Hindsight] Successfully retained memory for incident ${incident.id}`);
      return { success: true, source: 'hindsight-cloud', response };
    } catch (err) {
      console.error(`[Hindsight] SDK retain failed for ${incident.id}:`, err.message);
      // Fall through to HTTP or local store
    }
  }

  // Try direct REST call if SDK wasn't configured or failed
  if (HINDSIGHT_API_KEY) {
    try {
      const url = `${HINDSIGHT_BASE_URL.replace(/\/$/, '')}/v1/default/banks/${HINDSIGHT_BANK_ID}/memories`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HINDSIGHT_API_KEY}`,
        },
        body: JSON.stringify({
          items: [{
            content,
            timestamp: incident.timestamp || new Date().toISOString(),
            context: `Security incident triage log for ${incident.affectedSystem}`,
            metadata,
          }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[Hindsight] Direct HTTP retain successful for ${incident.id}`);
        return { success: true, source: 'hindsight-http', data };
      } else {
        console.warn(`[Hindsight] Direct HTTP retain returned status ${res.status}`);
      }
    } catch (httpErr) {
      console.warn(`[Hindsight] Direct HTTP retain error:`, httpErr.message);
    }
  }

  console.log(`[Hindsight] Incident ${incident.id} saved to in-memory fallback store (${localMemoryStore.length} items total)`);
  return { success: true, source: 'local-memory-fallback', id: incident.id };
}

/**
 * Query Hindsight memory for past incidents relevant to the incoming incident
 * @param {Object} incident 
 * @returns {Promise<Array>} Array of matched past incidents / memories
 */
async function queryMemory(incident) {
  const query = `${incident.alertType} ${incident.affectedSystem} ${incident.rawLogSnippet}`;
  console.log(`[Hindsight] Querying memory with prompt: "${query.substring(0, 100)}..."`);

  let cloudMatches = [];

  // 1. Try Hindsight SDK recall
  if (sdkClient && HINDSIGHT_API_KEY) {
    try {
      const response = await sdkClient.recall(HINDSIGHT_BANK_ID, query, {
        maxTokens: 1500,
      });

      if (response && Array.isArray(response.results) && response.results.length > 0) {
        cloudMatches = response.results.map((r, idx) => ({
          id: r.id || `recalled-${idx}`,
          text: r.text || '',
          metadata: r.metadata || {},
          score: r.scores?.relevance ?? 0.85,
          source: 'hindsight-cloud',
        }));
        console.log(`[Hindsight] Recalled ${cloudMatches.length} memory records from cloud`);
        return cloudMatches;
      }
    } catch (err) {
      console.warn(`[Hindsight] SDK recall failed:`, err.message);
    }
  }

  // 2. Try direct HTTP recall endpoint if SDK failed
  if (HINDSIGHT_API_KEY) {
    try {
      const recallUrls = [
        `${HINDSIGHT_BASE_URL.replace(/\/$/, '')}/v1/default/banks/${HINDSIGHT_BANK_ID}/memories/recall`,
        `${HINDSIGHT_BASE_URL.replace(/\/$/, '')}/v1/default/banks/${HINDSIGHT_BANK_ID}/recall`,
      ];

      for (const url of recallUrls) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${HINDSIGHT_API_KEY}`,
            },
            body: JSON.stringify({ query, max_tokens: 1500 }),
          });

          if (res.ok) {
            const data = await res.json();
            const results = data.results || data.items || [];
            if (results.length > 0) {
              return results.map((r, idx) => ({
                id: r.id || `http-recalled-${idx}`,
                text: r.text || r.content || '',
                metadata: r.metadata || {},
                score: r.score ?? 0.85,
                source: 'hindsight-http',
              }));
            }
          }
        } catch (_) {}
      }
    } catch (httpErr) {
      console.warn(`[Hindsight] Direct HTTP recall failed:`, httpErr.message);
    }
  }

  // 3. Fallback semantic/keyword similarity against in-memory store
  console.log(`[Hindsight] Searching in-memory fallback store (${localMemoryStore.length} past incidents)`);
  const queryTokens = new Set(
    query
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2)
  );

  const scored = localMemoryStore.map(item => {
    // Avoid matching the exact same newly submitted incident ID if it exists
    if (incident.id && item.incidentId === incident.id) {
      return { item, score: 0 };
    }

    const itemTokens = (item.content || '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);

    let matchCount = 0;
    for (const token of itemTokens) {
      if (queryTokens.has(token)) {
        matchCount++;
      }
    }

    // Boost score if alertType or affectedSystem matches
    let boost = 0;
    if (item.incident?.alertType && incident.alertType && 
        item.incident.alertType.toLowerCase() === incident.alertType.toLowerCase()) {
      boost += 5;
    }
    if (item.incident?.affectedSystem && incident.affectedSystem &&
        item.incident.affectedSystem.toLowerCase() === incident.affectedSystem.toLowerCase()) {
      boost += 5;
    }

    const normalizedScore = (matchCount + boost) / Math.max(1, queryTokens.size);
    return { item, score: normalizedScore };
  });

  // Only return matches above similarity threshold
  const filtered = scored
    .filter(s => s.score >= 0.25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ item, score }) => ({
      id: item.incidentId || item.id,
      text: item.content,
      metadata: item.metadata,
      score: Math.min(1.0, Number(score.toFixed(2))),
      source: 'local-memory-fallback',
      pastIncident: item.incident,
    }));

  console.log(`[Hindsight] Local search found ${filtered.length} matching past incidents (up to 10)`);
  return filtered;
}

module.exports = {
  writeMemory,
  queryMemory,
  getMemoryCount: () => localMemoryStore.length,
};
