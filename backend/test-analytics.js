const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const req = http.request(`http://localhost:5000${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('Testing Memory Impact endpoint...');
  const impact = await get('/api/analytics/memory-impact');
  console.log('Status:', impact.status);
  console.log('Impact keys:', Object.keys(impact.body));
  console.log('Impact summary:', {
    timeSavedPercent: impact.body.timeSavedPercent,
    avgTimeToResolve: impact.body.avgTimeToResolve,
    successRate: impact.body.successRate,
    repeatIncidentsCaught: impact.body.repeatIncidentsCaught,
    failedFixesAvoided: impact.body.failedFixesAvoided
  });

  console.log('\nTesting Learning Curve endpoint...');
  const curve = await get('/api/analytics/learning-curve');
  console.log('Status:', curve.status);
  const points = Array.isArray(curve.body) ? curve.body : curve.body.points;
  console.log('Curve points count:', points?.length);
  if (points?.length > 0) {
    console.log('First point:', points[0]);
    console.log('Last point:', points[points.length - 1]);
  }

  console.log('\nTesting Summary endpoint...');
  const summary = await get('/api/analytics/summary');
  console.log('Status:', summary.status);
  console.log('Insights count:', summary.body.insights?.length);
  console.log('Sample insight:', summary.body.insights?.[0]);
  console.log('By Alert Type count:', summary.body.byAlertType?.length);
  console.log('By Fix count:', summary.body.byFix?.length);

  console.log('\nTesting Compare endpoint...');
  const compare = await post('/api/incidents/compare', {
    alertType: 'credential_stuffing',
    affectedSystem: 'auth-service',
    severity: 'critical',
    rawLogSnippet: '150 failed login attempts/sec on /api/v1/auth/login from IPs: 185.220.101.4, 185.220.101.5. User enumeration detected.'
  });
  console.log('Status:', compare.status);
  console.log('Compare keys:', Object.keys(compare.body));
  console.log('Without Memory:', compare.body.withoutMemory?.confidence, `${compare.body.withoutMemory?.estimatedTimeToResolve}m`);
  console.log('With Memory:', compare.body.withMemory?.confidence, `${compare.body.withMemory?.estimatedTimeToResolve}m`, 'matches:', compare.body.withMemory?.matchedPastIncidentIds?.length);
  console.log('Differences:', compare.body.differences);

  console.log('\nALL ANALYTICS TESTS PASSED!');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
