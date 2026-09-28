const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || 
  (process.env.VERCEL ? '/tmp/data' :
    (fs.existsSync(path.resolve(__dirname, '../../data')) 
      ? path.resolve(__dirname, '../../data') 
      : path.resolve(__dirname, '../data')));
const DATA_FILE = path.join(DATA_DIR, 'incidents.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (_) {}
}

// In-memory cache
let incidentsCache = [];

function loadFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      incidentsCache = JSON.parse(content);
      console.log(`[IncidentStore] Loaded ${incidentsCache.length} incidents from ${DATA_FILE}`);
    } else {
      incidentsCache = [];
      saveToDisk();
    }
  } catch (err) {
    console.error(`[IncidentStore] Error loading incidents from disk:`, err.message);
    incidentsCache = [];
  }
}

function saveToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(incidentsCache, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[IncidentStore] Warning: Could not save to disk (${err.message}). In-memory store remains active.`);
  }
}

// Initial load
loadFromDisk();

module.exports = {
  getAll: () => [...incidentsCache].sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0)),

  getById: (id) => incidentsCache.find((inc) => inc.id === id) || null,

  save: (incident) => {
    const idx = incidentsCache.findIndex((inc) => inc.id === incident.id);
    if (idx >= 0) {
      incidentsCache[idx] = { ...incidentsCache[idx], ...incident };
      saveToDisk();
      return incidentsCache[idx];
    } else {
      const maxSeq = incidentsCache.length > 0 
        ? Math.max(...incidentsCache.map((i) => Number(i.sequenceNumber) || 0)) 
        : 0;
      const nextSeq = incident.sequenceNumber !== undefined ? Number(incident.sequenceNumber) : maxSeq + 1;
      const newInc = { 
        ...incident, 
        sequenceNumber: nextSeq,
        matchedPastIncidentIds: incident.matchedPastIncidentIds || [],
        confidence: incident.confidence || (incident.memoryAssisted ? 'high' : 'low'),
        firstFixWorked: incident.firstFixWorked !== undefined ? incident.firstFixWorked : null,
      };
      incidentsCache.push(newInc);
      saveToDisk();
      return newInc;
    }
  },

  saveAll: (incidents) => {
    incidentsCache = incidents.map((inc, i) => ({
      ...inc,
      sequenceNumber: inc.sequenceNumber !== undefined ? Number(inc.sequenceNumber) : i + 1,
      matchedPastIncidentIds: inc.matchedPastIncidentIds || [],
      confidence: inc.confidence || (inc.memoryAssisted ? 'high' : 'low'),
      firstFixWorked: inc.firstFixWorked !== undefined ? inc.firstFixWorked : (inc.outcome === 'success'),
    }));
    saveToDisk();
    return incidentsCache;
  },

  resolve: (id, { fixApplied, outcome, rootCause, timeToResolveMinutes, firstFixWorked }) => {
    const idx = incidentsCache.findIndex((inc) => inc.id === id);
    if (idx < 0) {
      return null;
    }
    const resolvedOutcome = outcome !== undefined ? outcome : incidentsCache[idx].outcome;
    incidentsCache[idx] = {
      ...incidentsCache[idx],
      status: 'resolved',
      fixApplied: fixApplied !== undefined ? fixApplied : incidentsCache[idx].fixApplied,
      outcome: resolvedOutcome,
      rootCause: rootCause !== undefined ? rootCause : incidentsCache[idx].rootCause,
      timeToResolveMinutes: timeToResolveMinutes !== undefined ? Number(timeToResolveMinutes) : incidentsCache[idx].timeToResolveMinutes,
      firstFixWorked: firstFixWorked !== undefined ? Boolean(firstFixWorked) : (resolvedOutcome === 'success'),
    };
    saveToDisk();
    return incidentsCache[idx];
  },

  clear: () => {
    incidentsCache = [];
    saveToDisk();
  },
};
