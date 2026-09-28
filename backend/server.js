const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');

const incidentsRouter = require('./routes/incidents');
const analyticsRouter = require('./routes/analytics');
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
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'healthy',
    service: 'SentinelMind Backend',
    memoriesSeeded: getMemoryCount(),
    timestamp: new Date().toISOString(),
  });
});

// Mount endpoints with and without /api prefix for maximum deployment flexibility
app.use('/api/incidents', incidentsRouter);
app.use('/incidents', incidentsRouter);
app.use('/api', analyticsRouter);
app.use('/', analyticsRouter);

// Start server and seed baseline memories into Hindsight
if (!process.env.VERCEL && require.main === module) {
  const server = app.listen(PORT, async () => {
    console.log(`====================================================`);
    console.log(`🛡️  SentinelMind Backend running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📡 Incidents API: http://localhost:${PORT}/api/incidents`);
    console.log(`📊 Scoreboard API: http://localhost:${PORT}/api/scoreboard`);
    console.log(`====================================================`);

    try {
      await seedPastIncidents();
    } catch (err) {
      console.error('Failed to seed baseline incidents on startup:', err);
    }
  });
} else {
  // Running in serverless environment (e.g. Vercel)
  seedPastIncidents().catch((err) =>
    console.warn('[Serverless] Initial seeding check:', err.message)
  );
}

module.exports = app;
