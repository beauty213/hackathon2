const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || 
  (fs.existsSync(path.resolve(__dirname, '../../data')) 
    ? path.resolve(__dirname, '../../data') 
    : path.resolve(__dirname, '../data'));
const DATA_FILE = path.join(DATA_DIR, 'incidents.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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
    fs.writeFileSync(DATA_FILE, JSON.stringify(incidentsCache, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[IncidentStore] Error saving incidents to disk:`, err.message);
  }
}

// Initial load
loadFromDisk();

module.exports = {
  getAll: () => [...incidentsCache],

  getById: (id) => incidentsCache.find((inc) => inc.id === id) || null,

  save: (incident) => {
    const idx = incidentsCache.findIndex((inc) => inc.id === incident.id);
    if (idx >= 0) {
      incidentsCache[idx] = { ...incidentsCache[idx], ...incident };
    } else {
      incidentsCache.push(incident);
    }
    saveToDisk();
    return idx >= 0 ? incidentsCache[idx] : incident;
  },

  saveAll: (incidents) => {
    incidentsCache = [...incidents];
    saveToDisk();
    return incidentsCache;
  },

  resolve: (id, { fixApplied, outcome, rootCause, timeToResolveMinutes }) => {
    const idx = incidentsCache.findIndex((inc) => inc.id === id);
    if (idx < 0) {
      return null;
    }
    incidentsCache[idx] = {
      ...incidentsCache[idx],
      status: 'resolved',
      fixApplied: fixApplied !== undefined ? fixApplied : incidentsCache[idx].fixApplied,
      outcome: outcome !== undefined ? outcome : incidentsCache[idx].outcome,
      rootCause: rootCause !== undefined ? rootCause : incidentsCache[idx].rootCause,
      timeToResolveMinutes: timeToResolveMinutes !== undefined ? Number(timeToResolveMinutes) : incidentsCache[idx].timeToResolveMinutes,
    };
    saveToDisk();
    return incidentsCache[idx];
  },

  clear: () => {
    incidentsCache = [];
    saveToDisk();
  },
};
