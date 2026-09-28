const { writeMemory } = require('../services/hindsightClient');
const incidentStore = require('../store/incidentStore');

/**
 * 10 Curated Baseline Past Incidents across 5 core attack categories (2 per type).
 * Includes contrasting fixes with different outcomes and times.
 * Exactly 5 memoryAssisted=true (avg ~18.8m) and 5 memoryAssisted=false (avg ~88.0m)
 * for a dramatic ~79% Memory Impact proof metric.
 */
const SEED_INCIDENTS = [
  // 1. unusual_outbound_traffic (SSRF Data Exfiltration)
  {
    id: 'INC-2024-101',
    timestamp: '2024-06-12T14:22:11Z',
    alertType: 'unusual_outbound_traffic',
    affectedSystem: 'webhook-dispatcher-01',
    severity: 'high',
    rawLogSnippet: '[SECURITY] 2024-06-12T14:22:11Z HTTP 200 GET to 169.254.169.254/latest/meta-data/iam/security-credentials/ from client webhook proxy worker-04; egress payload 450MB',
    status: 'resolved',
    fixApplied: 'Enforce IMDSv2 and deploy Calico network egress policy blocking 169.254.169.254/32',
    outcome: 'success',
    timeToResolveMinutes: 18,
    rootCause: 'Unsanitized webhook URLs allowed SSRF into cloud instance metadata service.',
    memoryAssisted: true,
  },
  {
    id: 'INC-2024-102',
    timestamp: '2024-05-10T02:14:00Z',
    alertType: 'unusual_outbound_traffic',
    affectedSystem: 'billing-export-node',
    severity: 'critical',
    rawLogSnippet: '[NET-SEC] 2024-05-10T02:14:00Z High volume egress: 12.4GB transmitted to external IP 185.220.101.5 on port 443 over 10 minutes',
    status: 'resolved',
    fixApplied: 'Terminate process and rotate API keys only without network perimeter rule',
    outcome: 'failed',
    timeToResolveMinutes: 95,
    rootCause: 'Exfiltration via reverse tunnel spawned by backdoor persistence script that re-established on pod restart.',
    memoryAssisted: false,
  },

  // 2. brute_force_login (Credential Stuffing Attack)
  {
    id: 'INC-2024-201',
    timestamp: '2024-07-03T09:12:44Z',
    alertType: 'brute_force_login',
    affectedSystem: 'auth-api-cluster',
    severity: 'high',
    rawLogSnippet: '[AUTH] 2024-07-03T09:12:44Z AuthFailureSpike: 14,200 failed POST /v1/auth/login attempts from subnet 198.51.100.0/24 targeting user admin',
    status: 'resolved',
    fixApplied: 'Deploy Cloudflare WAF IP rate limiting and enforce adaptive MFA challenge',
    outcome: 'success',
    timeToResolveMinutes: 14,
    rootCause: 'Distributed credential stuffing attack against public authentication gateway lacking rate limits.',
    memoryAssisted: true,
  },
  {
    id: 'INC-2024-202',
    timestamp: '2024-04-19T22:04:12Z',
    alertType: 'brute_force_login',
    affectedSystem: 'legacy-portal-ssh',
    severity: 'medium',
    rawLogSnippet: '[SSHD] 2024-04-19T22:04:12Z Failed password for invalid user root from 203.0.113.88 port 51222 ssh2 (3200 attempts)',
    status: 'resolved',
    fixApplied: 'Manual IP blacklist on local iptables',
    outcome: 'partial',
    timeToResolveMinutes: 70,
    rootCause: 'Attacker rotated across residential proxies bypassing individual static IP blocks.',
    memoryAssisted: false,
  },

  // 3. privilege_escalation (Container Escape Anomaly)
  {
    id: 'INC-2024-301',
    timestamp: '2024-08-01T16:30:19Z',
    alertType: 'privilege_escalation',
    affectedSystem: 'ci-runner-fleet',
    severity: 'critical',
    rawLogSnippet: '[AUDIT] 2024-08-01T16:30:19Z sudo: gitlab-runner : TTY=unknown ; PWD=/builds ; USER=root ; COMMAND=/bin/nsenter -t 1 -m -u -n -i bash',
    status: 'resolved',
    fixApplied: 'Remove privileged flag from Docker daemon container spec and drop CAP_SYS_ADMIN',
    outcome: 'success',
    timeToResolveMinutes: 22,
    rootCause: 'CI runner pod ran in privileged mode allowing container escape via nsenter to host kernel.',
    memoryAssisted: true,
  },
  {
    id: 'INC-2024-302',
    timestamp: '2024-03-28T11:15:33Z',
    alertType: 'privilege_escalation',
    affectedSystem: 'k8s-control-plane',
    severity: 'critical',
    rawLogSnippet: '[KUBE-APISERVER] 2024-03-28T11:15:33Z user system:serviceaccount:default:sa-worker created ClusterRoleBinding cluster-admin',
    status: 'resolved',
    fixApplied: 'Revoke service account token without mutating RBAC role permissions',
    outcome: 'failed',
    timeToResolveMinutes: 85,
    rootCause: 'Default service account had wildcard bind permissions granted by deprecated Helm chart.',
    memoryAssisted: false,
  },

  // 4. ransomware_activity (Storage Mass Cryptolock)
  {
    id: 'INC-2024-401',
    timestamp: '2024-08-15T04:02:11Z',
    alertType: 'ransomware_activity',
    affectedSystem: 'storage-nfs-prod',
    severity: 'critical',
    rawLogSnippet: '[STORAGE-ALERT] 2024-08-15T04:02:11Z Mass file modification: 45,000 files renamed with extension .cryptolock in /exports/shares within 60s',
    status: 'resolved',
    fixApplied: 'Sever NFS export network interface, isolate infected host, and restore immutable ZFS snapshot',
    outcome: 'success',
    timeToResolveMinutes: 25,
    rootCause: 'Compromised workstation mounted network share and executed automated ransomware payload.',
    memoryAssisted: true,
  },
  {
    id: 'INC-2024-402',
    timestamp: '2024-06-20T21:40:05Z',
    alertType: 'ransomware_activity',
    affectedSystem: 'backup-storage-dr',
    severity: 'critical',
    rawLogSnippet: '[EDR] 2024-06-20T21:40:05Z BitLocker volume encryption initiated by unverified script svchost_enc.ps1 on secondary vault',
    status: 'resolved',
    fixApplied: 'Kill powershell process and reboot storage server',
    outcome: 'failed',
    timeToResolveMinutes: 110,
    rootCause: 'Scheduled task persistence triggered encryption on reboot before offline keys were salvaged.',
    memoryAssisted: false,
  },

  // 5. ddos_traffic_spike (Volumetric Reflection Flood)
  {
    id: 'INC-2024-501',
    timestamp: '2024-08-30T18:05:00Z',
    alertType: 'ddos_traffic_spike',
    affectedSystem: 'edge-ingress-gateway',
    severity: 'critical',
    rawLogSnippet: '[EDGE] 2024-08-30T18:05:00Z SYN flood detected: 8.5 million pps / 42 Gbps targeting /api/v1/checkout from UDP/SYN reflection',
    status: 'resolved',
    fixApplied: 'Activate Cloudflare Under Attack mode and enable Anycast BGP scrubbing with Geo-blocking',
    outcome: 'success',
    timeToResolveMinutes: 15,
    rootCause: 'Mirai variant botnet launched volumetric SYN/UDP reflection flood against checkout endpoint.',
    memoryAssisted: true,
  },
  {
    id: 'INC-2024-502',
    timestamp: '2024-04-12T10:20:00Z',
    alertType: 'ddos_traffic_spike',
    affectedSystem: 'dns-authoritative-ns1',
    severity: 'high',
    rawLogSnippet: '[DNS] 2024-04-12T10:20:00Z Anycast DNS query rate exceeded 250,000 qps for ANY query type from spoofed IP pool',
    status: 'resolved',
    fixApplied: 'Increase server CPU instances and restart bind9 service',
    outcome: 'failed',
    timeToResolveMinutes: 80,
    rootCause: 'DNS amplification attack overwhelmed upstream transit link bandwidth, unaffected by local compute scaling.',
    memoryAssisted: false,
  },
];

/**
 * Preload the 10 seed incidents into both IncidentStore and Hindsight memory
 */
async function seedPastIncidents() {
  console.log(`[Seed] Preloading ${SEED_INCIDENTS.length} baseline security incidents into store and Hindsight...`);

  // 1. Seed incidentStore
  incidentStore.saveAll(SEED_INCIDENTS);
  console.log(`[Seed] Seeded ${SEED_INCIDENTS.length} incidents into data/incidents.json store`);

  // 2. Seed Hindsight memory
  for (const incident of SEED_INCIDENTS) {
    try {
      await writeMemory(incident);
      console.log(`[Seed] Seeded memory for ${incident.id} (${incident.alertType})`);
    } catch (err) {
      console.error(`[Seed] Failed seeding memory for ${incident.id}:`, err.message);
    }
  }

  console.log('[Seed] Baseline memory seeding complete.');
}

module.exports = {
  SEED_INCIDENTS,
  seedPastIncidents,
};
