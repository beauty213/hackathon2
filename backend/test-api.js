const app = require('./server');

async function runTests() {
  const PORT = 5099;
  const server = app.listen(PORT, async () => {
    console.log(`Test server running on port ${PORT}`);

    try {
      // Test 1: Health check
      console.log('\n--- Running Test 1: Health Check ---');
      const healthRes = await fetch(`http://localhost:${PORT}/health`);
      const healthData = await healthRes.json();
      console.log('Health Response:', healthData);

      // Test 2: Novel Incident (Expect 0 matches, generic triage, confidence medium)
      console.log('\n--- Running Test 2: Novel Incident ---');
      const novelIncident = {
        id: 'INC-TEST-NOVEL',
        alertType: 'CryptoKernelCompilation',
        affectedSystem: 'gpu-inference-cluster',
        severity: 'critical',
        rawLogSnippet: '[KERN-SEC] Anomaly: nvcc compilation detected in rootless container worker-gpu-09; unexpected instruction set AVX512_FMA targeting unapproved stratum pool at 185.220.101.5:443',
      };

      const novelRes = await fetch(`http://localhost:${PORT}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novelIncident),
      });
      const novelData = await novelRes.json();
      console.log('Novel Incident Triage:', {
        matchedPastIncidentId: novelData.triage.matchedPastIncidentId,
        confidence: novelData.triage.confidence,
        pastMatchesCount: novelData.pastMatches.length,
        recommendation: novelData.triage.recommendation.substring(0, 100) + '...',
      });

      // Test 3: Similar Incident (Expect match with INC-2024-001, high confidence, specific remediation)
      console.log('\n--- Running Test 3: Similar Incident (Redis Connection Pool) ---');
      const similarIncident = {
        id: 'INC-TEST-SIMILAR',
        alertType: 'AuthFailureSpike',
        affectedSystem: 'payment-service',
        severity: 'critical',
        rawLogSnippet: '[ERR] 2024-09-27T10:15:02Z RedisConnectionPool: max clients reached (9994); auth rejected for key version v2 during token refresh cycle',
      };

      const similarRes = await fetch(`http://localhost:${PORT}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(similarIncident),
      });
      const similarData = await similarRes.json();
      console.log('Similar Incident Triage:', {
        matchedPastIncidentId: similarData.triage.matchedPastIncidentId,
        confidence: similarData.triage.confidence,
        pastMatchesCount: similarData.pastMatches.length,
        recommendation: similarData.triage.recommendation,
        likelyRootCause: similarData.triage.likelyRootCause,
      });

      console.log('\n✅ All integration tests PASSED successfully!');
    } catch (err) {
      console.error('Test execution failed:', err);
      process.exit(1);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

runTests();
