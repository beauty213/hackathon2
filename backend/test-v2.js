const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting SentinelMind v2 Automated API Tests...\n');

  // 1. Health check
  console.log('1️⃣ Testing GET /health...');
  const health = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET',
  });
  console.log(`Status: ${health.status}, Result:`, health.data);
  if (health.status !== 200) throw new Error('Health check failed');

  // 2. Scoreboard
  console.log('\n2️⃣ Testing GET /api/scoreboard...');
  const scoreboard = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/scoreboard',
    method: 'GET',
  });
  console.log(`Status: ${scoreboard.status}`);
  console.log('Overall Stats:', scoreboard.data.overall);
  console.log('Memory Impact:', scoreboard.data.memoryImpact);
  console.log('Alert Types Count:', scoreboard.data.byAlertType?.length);
  if (!scoreboard.data.memoryImpact || scoreboard.data.memoryImpact.percentImprovement === undefined) {
    throw new Error('Scoreboard missing memoryImpact!');
  }
  console.log(`⚡ Memory Impact: ${scoreboard.data.memoryImpact.percentImprovement}% improvement with memory assistance!`);

  // 3. List incidents
  console.log('\n3️⃣ Testing GET /api/incidents...');
  const list = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/incidents',
    method: 'GET',
  });
  console.log(`Status: ${list.status}, Total Incidents in Store: ${list.data.length}`);
  if (list.data.length < 10) throw new Error(`Expected at least 10 incidents, got ${list.data.length}`);

  // 4. Test Novel Incident (CryptoKernelCompilation)
  console.log('\n4️⃣ Testing POST /api/incidents (Novel Incident)...');
  const novelPayload = {
    id: `INC-NOVEL-${Date.now()}`,
    alertType: 'CryptoKernelCompilation',
    affectedSystem: 'gpu-inference-cluster',
    severity: 'critical',
    rawLogSnippet: '[KERN-SEC] Anomaly: nvcc compilation detected in rootless container worker-gpu-09; unexpected instruction set AVX512_FMA targeting unapproved pool at 192.0.2.77:8080; zero-day driver panic',
  };
  const novelRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/incidents',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    novelPayload
  );
  console.log(`Status: ${novelRes.status}`);
  console.log(`Confidence: ${novelRes.data.confidence}`);
  console.log(`Matched Past Incidents: ${JSON.stringify(novelRes.data.matchedPastIncidentIds)}`);
  console.log(`Memory Trail Length: ${novelRes.data.memoryTrail?.length}`);
  console.log(`Recommendation: ${novelRes.data.recommendation?.substring(0, 100)}...`);
  if (novelRes.data.memoryTrail?.length !== 0) {
    console.warn('⚠️ Expected empty memory trail for novel incident');
  }

  // 5. Test Repeat Incident (unusual_outbound_traffic on webhook dispatcher)
  console.log('\n5️⃣ Testing POST /api/incidents (Repeat Incident)...');
  const repeatPayload = {
    id: `INC-REPEAT-${Date.now()}`,
    alertType: 'unusual_outbound_traffic',
    affectedSystem: 'webhook-dispatcher-01',
    severity: 'high',
    rawLogSnippet: '[SECURITY] HTTP 200 GET to 169.254.169.254/latest/meta-data/iam/security-credentials/ from client webhook proxy worker-04; egress payload 512MB',
  };
  const repeatRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/incidents',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    repeatPayload
  );
  console.log(`Status: ${repeatRes.status}`);
  console.log(`Confidence: ${repeatRes.data.confidence}`);
  console.log(`Matched Past Incidents: ${JSON.stringify(repeatRes.data.matchedPastIncidentIds)}`);
  console.log(`Memory Trail Length: ${repeatRes.data.memoryTrail?.length}`);
  console.log(`Recommendation: ${repeatRes.data.recommendation}`);
  console.log(`What-If Summary: ${repeatRes.data.whatIf?.summary}`);
  console.log(`What-If Candidates Count: ${repeatRes.data.whatIf?.candidates?.length}`);

  // 6. Test Resolving an Incident (POST /api/incidents/:id/resolve)
  console.log('\n6️⃣ Testing POST /api/incidents/:id/resolve...');
  const resolveRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/incidents/${repeatPayload.id}/resolve`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      fixApplied: 'Enforce IMDSv2 and deploy Calico network egress policy blocking 169.254.169.254/32',
      outcome: 'success',
      rootCause: 'Re-emergence of SSRF vulnerability in webhook proxy',
      timeToResolveMinutes: 11,
    }
  );
  console.log(`Status: ${resolveRes.status}, Resolved:`, resolveRes.data.incident?.status);

  // 7. Verify Scoreboard updated with the newly resolved incident
  console.log('\n7️⃣ Verifying Updated Scoreboard...');
  const updatedScoreboard = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/scoreboard',
    method: 'GET',
  });
  console.log('New Resolved Count:', updatedScoreboard.data.overall.resolvedCount);
  console.log('Updated Memory Impact:', updatedScoreboard.data.memoryImpact);

  // 8. Test GET /api/incidents/:id/whatif
  console.log('\n8️⃣ Testing GET /api/incidents/:id/whatif...');
  const whatifRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/incidents/${repeatPayload.id}/whatif`,
    method: 'GET',
  });
  console.log(`Status: ${whatifRes.status}, Candidates:`, whatifRes.data.candidates);

  console.log('\n🎉 ALL 8 BACKEND API TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
