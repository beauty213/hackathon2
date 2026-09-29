/**
 * Canonical 10 Static Incidents & Fallback Dataset for SentinelMind
 * Guarantees zero blank/empty screen states across Dashboard, System History,
 * and New Incident scenario picker.
 */

export const STATIC_10_INCIDENTS = [
  {
    sequenceNumber: 1,
    id: "INC-2024-001",
    timestamp: "2024-08-10T09:15:00Z",
    alertType: "unusual_outbound_traffic",
    affectedSystem: "billing-export-01",
    severity: "critical",
    rawLogSnippet: "[NET-SEC] 2024-08-10T09:15:00Z High volume egress: 12.4GB transmitted to external IP 185.220.101.5 on port 443 over 10 minutes",
    status: "resolved",
    fixApplied: "Terminate process and rotate API keys only without network perimeter rule",
    outcome: "failed",
    timeToResolveMinutes: 55,
    rootCause: "Exfiltration via reverse tunnel spawned by backdoor persistence script that re-established on pod restart.",
    memoryAssisted: false,
    matchedPastIncidentIds: [],
    confidence: "low",
    firstFixWorked: false
  },
  {
    sequenceNumber: 2,
    id: "INC-2024-002",
    timestamp: "2024-08-11T14:20:00Z",
    alertType: "brute_force_login",
    affectedSystem: "legacy-portal-ssh",
    severity: "medium",
    rawLogSnippet: "[SSHD] 2024-08-11T14:20:00Z Failed password for invalid user root from 203.0.113.88 port 51222 ssh2 (3200 attempts)",
    status: "resolved",
    fixApplied: "Manual IP blacklist on local iptables",
    outcome: "partial",
    timeToResolveMinutes: 48,
    rootCause: "Attacker rotated through residential proxies, quickly bypassing individual static IP blocks.",
    memoryAssisted: false,
    matchedPastIncidentIds: [],
    confidence: "low",
    firstFixWorked: false
  },
  {
    sequenceNumber: 3,
    id: "INC-2024-003",
    timestamp: "2024-08-13T11:05:00Z",
    alertType: "privilege_escalation",
    affectedSystem: "k8s-control-plane",
    severity: "critical",
    rawLogSnippet: "[KUBE-APISERVER] 2024-08-13T11:05:00Z user system:serviceaccount:default:sa-worker created ClusterRoleBinding cluster-admin",
    status: "resolved",
    fixApplied: "Revoke service account token without mutating RBAC role permissions",
    outcome: "failed",
    timeToResolveMinutes: 60,
    rootCause: "Default service account had wildcard bind permissions granted by deprecated Helm chart.",
    memoryAssisted: false,
    matchedPastIncidentIds: [],
    confidence: "low",
    firstFixWorked: false
  },
  {
    sequenceNumber: 4,
    id: "INC-2024-004",
    timestamp: "2024-08-14T21:40:00Z",
    alertType: "ransomware_activity",
    affectedSystem: "backup-vault-02",
    severity: "critical",
    rawLogSnippet: "[EDR] 2024-08-14T21:40:00Z BitLocker volume encryption initiated by unverified script svchost_enc.ps1 on secondary vault",
    status: "resolved",
    fixApplied: "Kill powershell process and reboot storage server",
    outcome: "failed",
    timeToResolveMinutes: 52,
    rootCause: "Scheduled task persistence triggered automated encryption immediately on reboot before keys were saved.",
    memoryAssisted: false,
    matchedPastIncidentIds: [],
    confidence: "low",
    firstFixWorked: false
  },
  {
    sequenceNumber: 5,
    id: "INC-2024-005",
    timestamp: "2024-08-16T10:30:00Z",
    alertType: "ddos_traffic_spike",
    affectedSystem: "dns-authoritative-ns1",
    severity: "high",
    rawLogSnippet: "[DNS] 2024-08-16T10:30:00Z Anycast DNS query rate exceeded 250,000 qps for ANY query type from spoofed IP pool",
    status: "resolved",
    fixApplied: "Increase server CPU instances and restart bind9 service",
    outcome: "failed",
    timeToResolveMinutes: 45,
    rootCause: "DNS amplification attack overwhelmed upstream transit link bandwidth, unaffected by compute scaling.",
    memoryAssisted: false,
    matchedPastIncidentIds: [],
    confidence: "low",
    firstFixWorked: false
  },
  {
    sequenceNumber: 6,
    id: "INC-2024-006",
    timestamp: "2024-08-17T13:25:00Z",
    alertType: "phishing_credential_harvest",
    affectedSystem: "mail-exchange-online",
    severity: "high",
    rawLogSnippet: "[M365] 2024-08-17T13:25:00Z Mailbox inbox rule created: forward all emails containing invoice, payment, secret to extern-drop@proton.me",
    status: "resolved",
    fixApplied: "Delete forwarding rule and reset user password only",
    outcome: "partial",
    timeToResolveMinutes: 40,
    rootCause: "OAuth consent grant remained authorized, allowing third-party app to keep reading mail without password.",
    memoryAssisted: false,
    matchedPastIncidentIds: [],
    confidence: "medium",
    firstFixWorked: false
  },
  {
    sequenceNumber: 7,
    id: "INC-2024-007",
    timestamp: "2024-08-19T14:22:00Z",
    alertType: "unusual_outbound_traffic",
    affectedSystem: "webhook-dispatcher-01",
    severity: "high",
    rawLogSnippet: "[SECURITY] 2024-08-19T14:22:00Z HTTP 200 GET to 169.254.169.254/latest/meta-data/iam/security-credentials/ from client webhook proxy worker-04; egress payload 450MB",
    status: "resolved",
    fixApplied: "Enforce IMDSv2 and deploy Calico network egress policy blocking 169.254.169.254/32",
    outcome: "success",
    timeToResolveMinutes: 18,
    rootCause: "Unsanitized webhook URLs allowed SSRF into cloud instance metadata service.",
    memoryAssisted: true,
    matchedPastIncidentIds: ["INC-2024-001"],
    confidence: "high",
    firstFixWorked: true
  },
  {
    sequenceNumber: 8,
    id: "INC-2024-008",
    timestamp: "2024-08-20T09:12:00Z",
    alertType: "brute_force_login",
    affectedSystem: "auth-api-cluster",
    severity: "high",
    rawLogSnippet: "[AUTH] 2024-08-20T09:12:00Z AuthFailureSpike: 14,200 failed POST /v1/auth/login attempts from subnet 198.51.100.0/24 targeting user admin",
    status: "resolved",
    fixApplied: "Deploy Cloudflare WAF IP rate limiting and enforce adaptive MFA challenge",
    outcome: "success",
    timeToResolveMinutes: 14,
    rootCause: "Distributed credential stuffing attack against public authentication gateway lacking rate limits.",
    memoryAssisted: true,
    matchedPastIncidentIds: ["INC-2024-002"],
    confidence: "high",
    firstFixWorked: true
  },
  {
    sequenceNumber: 9,
    id: "INC-2024-009",
    timestamp: "2024-08-22T16:30:00Z",
    alertType: "privilege_escalation",
    affectedSystem: "ci-runner-fleet",
    severity: "critical",
    rawLogSnippet: "[AUDIT] 2024-08-22T16:30:00Z sudo: gitlab-runner : TTY=unknown ; PWD=/builds ; USER=root ; COMMAND=/bin/nsenter -t 1 -m -u -n -i bash",
    status: "resolved",
    fixApplied: "Remove privileged flag from Docker daemon container spec and drop CAP_SYS_ADMIN",
    outcome: "success",
    timeToResolveMinutes: 16,
    rootCause: "CI runner pod ran in privileged mode allowing container escape via nsenter to host kernel.",
    memoryAssisted: true,
    matchedPastIncidentIds: ["INC-2024-003"],
    confidence: "high",
    firstFixWorked: true
  },
  {
    sequenceNumber: 10,
    id: "INC-2024-010",
    timestamp: "2024-08-23T04:02:00Z",
    alertType: "ransomware_activity",
    affectedSystem: "storage-nfs-prod",
    severity: "critical",
    rawLogSnippet: "[STORAGE-ALERT] 2024-08-23T04:02:00Z Mass file modification: 45,000 files renamed with extension .cryptolock in /exports/shares within 60s",
    status: "resolved",
    fixApplied: "Sever NFS export network interface, isolate infected host, and restore immutable ZFS snapshot",
    outcome: "success",
    timeToResolveMinutes: 15,
    rootCause: "Compromised workstation mounted network share and executed automated ransomware payload.",
    memoryAssisted: true,
    matchedPastIncidentIds: ["INC-2024-004"],
    confidence: "high",
    firstFixWorked: true
  }
];

export const ALL_STATIC_INCIDENTS = [
  ...STATIC_10_INCIDENTS,
  {
    sequenceNumber: 11,
    id: "INC-2024-011",
    timestamp: "2024-08-25T18:05:00Z",
    alertType: "ddos_traffic_spike",
    affectedSystem: "edge-ingress-gateway",
    severity: "critical",
    rawLogSnippet: "[EDGE] 2024-08-25T18:05:00Z SYN flood detected: 8.5 million pps / 42 Gbps targeting /api/v1/checkout from UDP/SYN reflection",
    status: "resolved",
    fixApplied: "Activate Cloudflare Under Attack mode and enable Anycast BGP scrubbing with Geo-blocking",
    outcome: "success",
    timeToResolveMinutes: 12,
    rootCause: "Mirai variant botnet launched volumetric SYN/UDP reflection flood against checkout endpoint.",
    memoryAssisted: true,
    matchedPastIncidentIds: ["INC-2024-005"],
    confidence: "high",
    firstFixWorked: true
  },
  {
    sequenceNumber: 12,
    id: "INC-2024-012",
    timestamp: "2024-08-26T08:14:00Z",
    alertType: "phishing_credential_harvest",
    affectedSystem: "okta-idp-gateway",
    severity: "high",
    rawLogSnippet: "[OKTA] 2024-08-26T08:14:00Z Sign-in from anomalous location: User sarah.c@corp.com logged in from Lagos 3 minutes after NY login",
    status: "resolved",
    fixApplied: "Revoke all active Okta sessions, invalidate refresh tokens, and enforce FIDO2 WebAuthn hardware key",
    outcome: "success",
    timeToResolveMinutes: 10,
    rootCause: "Adversary-in-the-Middle (Evilginx) phishing site intercepted SMS 2FA code and session cookie.",
    memoryAssisted: true,
    matchedPastIncidentIds: ["INC-2024-006"],
    confidence: "high",
    firstFixWorked: true
  },
  {
    sequenceNumber: 13,
    id: "INC-2024-013",
    timestamp: "2024-08-28T12:00:00Z",
    alertType: "unusual_outbound_traffic",
    affectedSystem: "data-analytics-pipeline",
    severity: "high",
    rawLogSnippet: "[SECURITY] 2024-08-28T12:00:00Z Outbound metadata scrape attempt to 169.254.169.254 intercepted by security gateway",
    status: "resolved",
    fixApplied: "Enforce IMDSv2 and deploy Calico network egress policy blocking 169.254.169.254/32",
    outcome: "success",
    timeToResolveMinutes: 11,
    rootCause: "Spark job configuration parameter SSRF attempt matching INC-2024-007 signature.",
    memoryAssisted: true,
    matchedPastIncidentIds: ["INC-2024-001", "INC-2024-007"],
    confidence: "high",
    firstFixWorked: true
  },
  {
    sequenceNumber: 14,
    id: "INC-2024-014",
    timestamp: "2024-08-29T15:30:00Z",
    alertType: "brute_force_login",
    affectedSystem: "partner-portal-api",
    severity: "high",
    rawLogSnippet: "[AUTH] 2024-08-29T15:30:00Z 22,000 rapid failed authentication requests on /oauth/token from botnet range",
    status: "resolved",
    fixApplied: "Deploy Cloudflare WAF IP rate limiting and enforce adaptive MFA challenge",
    outcome: "success",
    timeToResolveMinutes: 9,
    rootCause: "Distributed credential stuffing matching INC-2024-008 pattern.",
    memoryAssisted: true,
    matchedPastIncidentIds: ["INC-2024-002", "INC-2024-008"],
    confidence: "high",
    firstFixWorked: true
  },
  {
    sequenceNumber: 15,
    id: "INC-2024-015",
    timestamp: "2024-08-31T17:10:00Z",
    alertType: "privilege_escalation",
    affectedSystem: "staging-cluster-worker",
    severity: "critical",
    rawLogSnippet: "[AUDIT] 2024-08-31T17:10:00Z Container spawned with hostPID=true and privileged=true in staging namespace",
    status: "resolved",
    fixApplied: "Remove privileged flag from Docker daemon container spec and drop CAP_SYS_ADMIN",
    outcome: "success",
    timeToResolveMinutes: 8,
    rootCause: "Privileged container escape attempt matching INC-2024-009 signature.",
    memoryAssisted: true,
    matchedPastIncidentIds: ["INC-2024-003", "INC-2024-009"],
    confidence: "high",
    firstFixWorked: true
  }
];

export const STATIC_STATS = {
  overall: {
    totalIncidents: 15,
    resolvedCount: 15,
    openIncidents: 0,
    overallSuccessRate: 67,
    avgTimeToResolve: 27.5,
  }
};

/**
 * Pre-computed detail lookups so clicking any of the 10 static incidents renders
 * immediately with memory trail & What-If candidate fixes.
 */
export function getStaticIncidentDetail(id) {
  const incident = ALL_STATIC_INCIDENTS.find(i => i.id === id);
  if (!incident) return null;

  // Build memory trail
  const memoryTrail = [];
  if (Array.isArray(incident.matchedPastIncidentIds) && incident.matchedPastIncidentIds.length > 0) {
    for (const pastId of incident.matchedPastIncidentIds) {
      const past = ALL_STATIC_INCIDENTS.find(i => i.id === pastId);
      if (past) {
        memoryTrail.push({
          id: past.id,
          alertType: past.alertType,
          date: past.timestamp,
          similarityReason: `Recalled pattern matching ${past.alertType} on ${past.affectedSystem}`,
          fixApplied: past.fixApplied,
          outcome: past.outcome,
          timeToResolveMinutes: past.timeToResolveMinutes,
          rootCause: past.rootCause
        });
      }
    }
  } else {
    // If unassisted, find any historical same-type items
    const sameType = ALL_STATIC_INCIDENTS.filter(i => i.id !== incident.id && i.alertType === incident.alertType);
    for (const past of sameType.slice(0, 2)) {
      memoryTrail.push({
        id: past.id,
        alertType: past.alertType,
        date: past.timestamp,
        similarityReason: `Historical record of ${past.alertType} on ${past.affectedSystem}`,
        fixApplied: past.fixApplied,
        outcome: past.outcome,
        timeToResolveMinutes: past.timeToResolveMinutes,
        rootCause: past.rootCause
      });
    }
  }

  // Build What-If candidate fixes
  const matchingTypeIncidents = ALL_STATIC_INCIDENTS.filter(i => i.alertType === incident.alertType);
  const fixMap = {};
  for (const item of matchingTypeIncidents) {
    const fix = item.fixApplied;
    if (!fix) continue;
    if (!fixMap[fix]) {
      fixMap[fix] = { fixApplied: fix, timesUsed: 0, successCount: 0, totalTime: 0 };
    }
    fixMap[fix].timesUsed += 1;
    if (item.outcome === 'success') fixMap[fix].successCount += 1;
    if (item.timeToResolveMinutes) fixMap[fix].totalTime += Number(item.timeToResolveMinutes);
  }

  const candidates = Object.values(fixMap).map((c) => {
    const successRate = Math.round((c.successCount / c.timesUsed) * 100);
    const avgTimeToResolve = c.timesUsed > 0 ? Math.round(c.totalTime / c.timesUsed) : 15;
    return {
      fixApplied: c.fixApplied,
      timesUsed: c.timesUsed,
      successRate,
      avgTimeToResolve,
      lowSampleSize: c.timesUsed < 2
    };
  }).sort((a, b) => b.successRate - a.successRate || a.avgTimeToResolve - b.avgTimeToResolve)
    .map((c, idx) => ({ ...c, recommendedRank: idx + 1 }));

  return {
    incident,
    memoryTrail,
    whatIf: {
      candidates,
      summary: candidates.length > 0
        ? `Top candidate fix achieved ${candidates[0].successRate}% success rate across past recorded incidents.`
        : 'No historical candidate fixes recorded.'
    }
  };
}

/**
 * Generate fallback triage response if backend is offline or delayed
 */
export function generateStaticTriage(formInput) {
  const matchingTypeIncidents = ALL_STATIC_INCIDENTS.filter(
    (i) => i.alertType === formInput.alertType
  );

  const pastSuccessful = matchingTypeIncidents.filter(
    (i) => i.outcome === 'success' && i.status === 'resolved'
  );

  const hasMemoryMatch = pastSuccessful.length > 0;
  const targetMatch = pastSuccessful[0] || matchingTypeIncidents[0];

  const id = `INC-${Date.now().toString().slice(-6)}`;
  const incident = {
    id,
    timestamp: new Date().toISOString(),
    alertType: formInput.alertType,
    affectedSystem: formInput.affectedSystem,
    severity: formInput.severity || 'high',
    rawLogSnippet: formInput.rawLogSnippet,
    status: 'open',
    fixApplied: null,
    outcome: null,
    timeToResolveMinutes: null,
    rootCause: null,
    memoryAssisted: hasMemoryMatch,
    matchedPastIncidentIds: targetMatch ? [targetMatch.id] : [],
    confidence: hasMemoryMatch ? 'high' : 'low',
    firstFixWorked: null
  };

  const detail = getStaticIncidentDetail(targetMatch ? targetMatch.id : ALL_STATIC_INCIDENTS[0].id);

  if (hasMemoryMatch && targetMatch) {
    return {
      incident,
      recommendation: targetMatch.fixApplied || `Deploy hardened network and authentication policies to ${formInput.affectedSystem}`,
      likelyRootCause: targetMatch.rootCause || `Recurring vulnerability pattern detected in ${formInput.affectedSystem}`,
      confidence: 'high',
      matchedPastIncidentIds: [targetMatch.id],
      reasoning: `Hindsight persistent memory successfully correlated this alert with historical incident ${targetMatch.id} (${targetMatch.alertType}). Recommending previously validated remediation playbook.`,
      memoryTrail: detail.memoryTrail.length > 0 ? detail.memoryTrail : [
        {
          id: targetMatch.id,
          alertType: targetMatch.alertType,
          date: targetMatch.timestamp,
          similarityReason: `Identical attack pattern on ${targetMatch.affectedSystem}`,
          fixApplied: targetMatch.fixApplied,
          outcome: targetMatch.outcome,
          timeToResolveMinutes: targetMatch.timeToResolveMinutes,
          rootCause: targetMatch.rootCause
        }
      ],
      whatIf: detail.whatIf
    };
  } else {
    return {
      incident,
      recommendation: `Apply generic first-principles containment on ${formInput.affectedSystem}: isolate network perimeter, revoke non-essential credentials, and dump diagnostic logs.`,
      likelyRootCause: `Unrecognized anomalous telemetry on ${formInput.affectedSystem}. No prior institutional memory or playbook exists in vector bank.`,
      confidence: 'low',
      matchedPastIncidentIds: [],
      reasoning: `No matches found in Hindsight persistent memory bank. Agent is triaging from zero-day first principles without historical assistance.`,
      memoryTrail: [],
      whatIf: {
        candidates: [],
        summary: 'No historical candidate fixes recorded for novel alert type.'
      }
    };
  }
}

export const COMPARE_PRESETS = [
  {
    key: 'unusual_outbound_traffic',
    label: '1. Unusual Outbound Traffic (SSRF Exfiltration)',
    alertType: 'unusual_outbound_traffic',
    system: 'webhook-dispatcher-01',
    severity: 'high',
    matchedId: 'INC-2024-001',
    log: 'HTTP 200 GET to 169.254.169.254/latest/meta-data/iam/security-credentials/ from client webhook proxy worker-04; outbound payload 480MB'
  },
  {
    key: 'brute_force_login',
    label: '2. Brute Force Login (Credential Stuffing Spike)',
    alertType: 'brute_force_login',
    system: 'auth-api-cluster',
    severity: 'high',
    matchedId: 'INC-2024-002',
    log: '150 failed login attempts/sec on /api/v1/auth/login from subnet 198.51.100.0/24 targeting user admin'
  },
  {
    key: 'privilege_escalation',
    label: '3. Privilege Escalation (Container Escape)',
    alertType: 'privilege_escalation',
    system: 'ci-runner-fleet',
    severity: 'critical',
    matchedId: 'INC-2024-003',
    log: 'sudo: gitlab-runner : TTY=unknown ; PWD=/builds ; USER=root ; COMMAND=/bin/nsenter -t 1 -m -u -n -i bash'
  },
  {
    key: 'ransomware_activity',
    label: '4. Ransomware Activity (Cryptolock Volume Encryption)',
    alertType: 'ransomware_activity',
    system: 'storage-nfs-prod',
    severity: 'critical',
    matchedId: 'INC-2024-004',
    log: 'Mass file modification: 52,000 files renamed with extension .cryptolock in /exports/shares within 45s'
  },
  {
    key: 'ddos_traffic_spike',
    label: '5. DDoS Traffic Spike (SYN Reflection Flood)',
    alertType: 'ddos_traffic_spike',
    system: 'edge-ingress-gateway',
    severity: 'critical',
    matchedId: 'INC-2024-005',
    log: 'SYN flood detected: 9.2 million pps / 48 Gbps targeting /api/v1/checkout from UDP/SYN reflection pool'
  },
  {
    key: 'phishing_credential_harvest',
    label: '6. Phishing & OAuth Hijack (Mailbox Forwarding Rule)',
    alertType: 'phishing_credential_harvest',
    system: 'mail-exchange-online',
    severity: 'high',
    matchedId: 'INC-2024-006',
    log: 'Mailbox inbox rule created: forward all emails containing invoice, payment, secret to extern-drop@proton.me; OAuth app granted full Mail.ReadWrite'
  }
];

export function getStaticCompare(presetKey) {
  const preset = COMPARE_PRESETS.find((p) => p.key === presetKey) || COMPARE_PRESETS[0];

  const compareMap = {
    unusual_outbound_traffic: {
      withoutMemory: {
        recommendation: "Terminate outgoing connections on webhook-dispatcher-01, rotate AWS access keys, and review recent pod deployment history.",
        likelyRootCause: "Unconfirmed anomalous egress. Possible compromised API token or unauthorized microservice call.",
        confidence: "low",
        matchedPastIncidentIds: [],
        reasoning: "Triage executed with persistent memory disabled. The agent must diagnose from zero-day first principles, risking ineffective process kills that don't stop SSRF tunnels.",
        estimatedTimeToResolve: 55,
        pitfalls: "Terminating the process fails because the backdoor re-establishes via pod restart. Without memory, network egress blocking is missed."
      },
      withMemory: {
        recommendation: "Enforce IMDSv2 metadata hop limits and deploy Calico network egress policy blocking 169.254.169.254/32 directly at the CNI layer.",
        likelyRootCause: "Unsanitized webhook URLs allowing SSRF into cloud instance metadata service (identical pattern to INC-2024-001).",
        confidence: "high",
        matchedPastIncidentIds: ["INC-2024-001"],
        reasoning: "Hindsight memory recalled INC-2024-001. Previous attempt of killing process failed (took 55m); memory guided the agent straight to Calico network perimeter rules.",
        estimatedTimeToResolve: 18,
        benefits: "Immediate precision containment. Bypasses known failed approaches and permanently blocks metadata access in 18 minutes."
      }
    },
    brute_force_login: {
      withoutMemory: {
        recommendation: "Apply manual IP blacklists on iptables and prompt users on the target subnet to reset their passwords.",
        likelyRootCause: "Isolated dictionary attack targeting admin accounts from suspicious IP addresses.",
        confidence: "low",
        matchedPastIncidentIds: [],
        reasoning: "Triage performed without historical recall. The agent suggests individual IP blocking, which easily fails against distributed rotating proxy botnets.",
        estimatedTimeToResolve: 48,
        pitfalls: "Attacker rotates through residential proxies, quickly bypassing individual static IP blocks. Manual rules take 48m to diagnose."
      },
      withMemory: {
        recommendation: "Deploy Cloudflare WAF IP reputation rate limiting and enforce adaptive MFA challenges on all /v1/auth/login endpoints.",
        likelyRootCause: "Distributed credential stuffing attack leveraging rotating proxy pools (matched to INC-2024-002 failure mode).",
        confidence: "high",
        matchedPastIncidentIds: ["INC-2024-002", "INC-2024-008"],
        reasoning: "Recalled INC-2024-002 where manual IP blocking had only partial success. Memory immediately applies global WAF rate limiting and MFA challenges.",
        estimatedTimeToResolve: 14,
        benefits: "Stops credential stuffing botnets globally in 14 minutes, eliminating manual IP chasing."
      }
    },
    privilege_escalation: {
      withoutMemory: {
        recommendation: "Revoke service account credentials and restart the Kubernetes node daemon.",
        likelyRootCause: "Suspicious privileged process activity detected inside runner pod.",
        confidence: "low",
        matchedPastIncidentIds: [],
        reasoning: "Without institutional memory, the agent focuses on temporary credentials rather than root-level container capability misconfigurations.",
        estimatedTimeToResolve: 60,
        pitfalls: "Token revocation leaves the privileged container spec untouched, allowing the attacker to re-enter via nsenter."
      },
      withMemory: {
        recommendation: "Remove privileged flag from Docker daemon spec, drop CAP_SYS_ADMIN, and apply Kyverno admission policy.",
        likelyRootCause: "CI runner container escape via nsenter to host kernel (matched to INC-2024-003 signature).",
        confidence: "high",
        matchedPastIncidentIds: ["INC-2024-003", "INC-2024-009"],
        reasoning: "Recalled INC-2024-003 failure where token reset failed. Directly remediates the host container escape vector.",
        estimatedTimeToResolve: 16,
        benefits: "Surgically eliminates container breakout vector in 16m instead of 60m manual root-cause tracing."
      }
    },
    ransomware_activity: {
      withoutMemory: {
        recommendation: "Kill PowerShell/encryption processes and reboot storage host to inspect file system integrity.",
        likelyRootCause: "Cryptographic ransomware script active on storage vault.",
        confidence: "low",
        matchedPastIncidentIds: [],
        reasoning: "Unassisted first-principles triage suggests rebooting, which historically triggered automated encryption on boot before keys were secured.",
        estimatedTimeToResolve: 52,
        pitfalls: "Rebooting without network severing accelerates encryption via startup tasks, causing data loss."
      },
      withMemory: {
        recommendation: "Sever NFS export network interface immediately, isolate infected host, and restore immutable ZFS snapshot.",
        likelyRootCause: "Compromised workstation mounted network share executing ransomware payload (matched to INC-2024-004).",
        confidence: "high",
        matchedPastIncidentIds: ["INC-2024-004", "INC-2024-010"],
        reasoning: "Recalled INC-2024-004 where rebooting worsened damage. Applies instant network severance and zero-data-loss ZFS rollback.",
        estimatedTimeToResolve: 15,
        benefits: "Prevents entire share corruption. Restores clean state in 15 minutes with zero ransom payment."
      }
    },
    ddos_traffic_spike: {
      withoutMemory: {
        recommendation: "Increase server CPU instances, add memory to authoritative DNS daemons, and restart bind9 service.",
        likelyRootCause: "High-volume DNS query traffic overwhelming server daemon capacity.",
        confidence: "low",
        matchedPastIncidentIds: [],
        reasoning: "Agent attempts infrastructure scaling, which fails because the transit bandwidth link is saturated, not server CPU.",
        estimatedTimeToResolve: 45,
        pitfalls: "Compute scaling increases cloud bills without resolving upstream transit link saturation."
      },
      withMemory: {
        recommendation: "Activate Cloudflare Under Attack mode and enable Anycast BGP scrubbing with Geo-blocking.",
        likelyRootCause: "Anycast DNS amplification attack overwhelming upstream transit bandwidth (matched to INC-2024-005).",
        confidence: "high",
        matchedPastIncidentIds: ["INC-2024-005", "INC-2024-011"],
        reasoning: "Recalled INC-2024-005 failure of compute scaling. Directly redirects volumetric reflection flood to Anycast BGP scrubbing.",
        estimatedTimeToResolve: 12,
        benefits: "Restores DNS resolution within 12 minutes without wasteful compute scaling."
      }
    },
    phishing_credential_harvest: {
      withoutMemory: {
        recommendation: "Delete forwarding inbox rule and reset compromised user account password.",
        likelyRootCause: "Unauthorized mailbox rule forwarding corporate emails to external address.",
        confidence: "low",
        matchedPastIncidentIds: [],
        reasoning: "Without memory, agent assumes password reset is sufficient, ignoring OAuth enterprise application grants.",
        estimatedTimeToResolve: 40,
        pitfalls: "OAuth third-party consent grant remains authorized, allowing attacker to keep reading mail without password."
      },
      withMemory: {
        recommendation: "Revoke all active Okta/M365 sessions, invalidate OAuth refresh tokens, and enforce FIDO2 hardware keys.",
        likelyRootCause: "OAuth consent grant hijack and Evilginx session interception (matched to INC-2024-006).",
        confidence: "high",
        matchedPastIncidentIds: ["INC-2024-006", "INC-2024-012"],
        reasoning: "Recalled INC-2024-006 where password reset alone failed. Directly revokes OAuth application grant and forces hardware key.",
        estimatedTimeToResolve: 10,
        benefits: "Full credential and token revocation completed in 10 minutes."
      }
    }
  };

  const selected = compareMap[preset.key] || compareMap.unusual_outbound_traffic;
  const savedMinutes = Math.max(0, selected.withoutMemory.estimatedTimeToResolve - selected.withMemory.estimatedTimeToResolve);
  const percentFaster = Math.round((savedMinutes / selected.withoutMemory.estimatedTimeToResolve) * 100);

  return {
    preset,
    withoutMemory: selected.withoutMemory,
    withMemory: selected.withMemory,
    differences: {
      confidenceChange: `${selected.withoutMemory.confidence.toUpperCase()} ➔ ${selected.withMemory.confidence.toUpperCase()}`,
      matchedIncidents: selected.withMemory.matchedPastIncidentIds,
      fixSuggested: {
        without: selected.withoutMemory.recommendation,
        with: selected.withMemory.recommendation,
      },
      estimatedTimeToResolve: {
        without: selected.withoutMemory.estimatedTimeToResolve,
        with: selected.withMemory.estimatedTimeToResolve,
        savedMinutes,
        percentFaster,
      },
    },
  };
}

