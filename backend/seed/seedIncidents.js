const { writeMemory } = require('../services/hindsightClient');

/**
 * 5 Hardcoded past incidents preloaded with root causes and resolutions
 */
const SEED_INCIDENTS = [
  {
    id: 'INC-2024-001',
    timestamp: '2024-01-14T03:12:44Z',
    alertType: 'AuthFailureSpike',
    affectedSystem: 'payment-service',
    severity: 'critical',
    rawLogSnippet: '[ERR] 2024-01-14T03:12:44Z RedisConnectionPool: max clients reached (10000); unauthorized auth attempt with expired rotated key v2',
    rootCause: 'Zombie microservice containers in payment-gateway-pool still using cached v2 token instead of v3 vault secret, flooding Redis with auth retries and exhausting the TCP connection pool.',
    resolution: 'Force-restarted zombie pods in payment-gateway-pool, revoked v2 secret in HashiCorp Vault, and configured Redis client TCP keepalive to 60s.',
  },
  {
    id: 'INC-2024-002',
    timestamp: '2024-02-10T14:22:11Z',
    alertType: 'SuspiciousEgress',
    affectedSystem: 'webhook-dispatcher',
    severity: 'high',
    rawLogSnippet: '[SECURITY] 2024-02-10T14:22:11Z HTTP 200 GET to 169.254.169.254/latest/meta-data/iam/security-credentials/ from client webhook proxy',
    rootCause: 'Unsanitized customer webhook URLs allowed server-side request forgery (SSRF) into cloud instance metadata service (IMDSv1).',
    resolution: 'Enforced IMDSv2 with hop limit 1, deployed Calico network egress policy blocking CIDR 169.254.169.254/32, and implemented domain whitelist on outbound dispatcher.',
  },
  {
    id: 'INC-2024-003',
    timestamp: '2024-03-05T08:44:02Z',
    alertType: 'PrivilegeEscalationDetected',
    affectedSystem: 'ci-runner-cluster',
    severity: 'critical',
    rawLogSnippet: '[AUDIT] 2024-03-05T08:44:02Z PutBucketPolicy denied initially, then AssumeRole succeeded with AdministratorAccess for arn:aws:iam::123456789012:role/github-actions-deploy',
    rootCause: 'Overly broad wildcard condition repo:myorg/* in GitHub Actions OIDC trust policy allowed PR branch from fork to assume administrative deployment role.',
    resolution: 'Restricted OIDC condition to repo:myorg/main-repo:ref:refs/heads/main, rotated compromised AWS credentials, and applied Service Control Policy (SCP) to limit role permissions.',
  },
  {
    id: 'INC-2024-004',
    timestamp: '2024-04-18T19:05:33Z',
    alertType: 'DatabaseDeadlock',
    affectedSystem: 'auth-db-primary',
    severity: 'high',
    rawLogSnippet: '[FATAL] 2024-04-18T19:05:33Z remaining connection slots are reserved for non-replication superuser connections; exclusive lock wait timeout on table session_tokens',
    rootCause: 'Unindexed session cleanup cron query DELETE FROM session_tokens WHERE expires_at < NOW() running concurrently with user login bursts, locking the table and cascading connection starvation.',
    resolution: 'Added partial index on session_tokens (expires_at), capped cleanup batch size to 500 rows, and switched pgbouncer mode to transaction.',
  },
  {
    id: 'INC-2024-005',
    timestamp: '2024-05-22T23:18:09Z',
    alertType: 'HighEntropyDNSQueries',
    affectedSystem: 'staging-bastion-01',
    severity: 'critical',
    rawLogSnippet: '[NET-SEC] 2024-05-22T23:18:09Z Anomaly: TXT record query 7a8f9c1b2e3d.tunnel.exfil-data.net (length: 218 bytes), 620 queries in 45 seconds from host 10.0.4.15',
    rootCause: 'Compromised developer private key used to install iodine DNS tunneling backdoor on staging bastion for data exfiltration.',
    resolution: 'Severed bastion network interface, terminated rogue iodine process pid 8491, rotated developer SSH keys, and deployed Route53 DNS Firewall blocking known exfil domains.',
  },
];

/**
 * Preload the 5 seed incidents into Hindsight memory
 */
async function seedPastIncidents() {
  console.log(`[Seed] Preloading ${SEED_INCIDENTS.length} baseline security incidents into Hindsight memory...`);
  for (const incident of SEED_INCIDENTS) {
    try {
      await writeMemory(incident);
      console.log(`[Seed] Seeded ${incident.id} (${incident.alertType})`);
    } catch (err) {
      console.error(`[Seed] Failed seeding ${incident.id}:`, err.message);
    }
  }
  console.log('[Seed] Baseline memory seeding complete.');
}

module.exports = {
  SEED_INCIDENTS,
  seedPastIncidents,
};
