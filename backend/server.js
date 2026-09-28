const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');

const incidentsRouter = require('./routes/incidents');
const { seedPastIncidents } = require('./seed/seedIncidents');
const { getMemoryCount } = require('./services/hindsightClient');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins
app.use(cors({ origin: '*' }));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'SentinelMind Backend',
    memoriesSeeded: getMemoryCount(),
    timestamp: new Date().toISOString(),
  });
});

// Mount the single incidents endpoint: POST /api/incidents
app.use('/api/incidents', incidentsRouter);

// Start server and seed baseline memories into Hindsight
const server = app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🛡️  SentinelMind Backend running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 Incidents API: POST http://localhost:${PORT}/api/incidents`);
  console.log(`====================================================`);

  try {
    await seedPastIncidents();
  } catch (err) {
    console.error('Failed to seed baseline incidents on startup:', err);
  }
});

module.exports = app;
