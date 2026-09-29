import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  History,
  Sparkles,
  Clock,
  Check,
  RefreshCw,
  Terminal,
  Layers,
  Database
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ResolveModal from '../components/ResolveModal';
import { getStaticIncidentDetail } from '../data/staticIncidents';

export default function IncidentDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(() => getStaticIncidentDetail(id));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);

  const fetchIncidentDetail = async () => {
    try {
      const res = await fetch(`/api/incidents/${id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setError(null);
      } else if (!data) {
        const fallback = getStaticIncidentDetail(id);
        if (fallback) {
          setData(fallback);
        } else {
          setError(`Incident ${id} not found`);
        }
      }
    } catch (err) {
      if (!data) {
        const fallback = getStaticIncidentDetail(id);
        if (fallback) {
          setData(fallback);
        } else {
          setError(err.message || 'Failed to load incident detail');
        }
      }
    }
  };

  useEffect(() => {
    if (id) {
      const staticInit = getStaticIncidentDetail(id);
      if (staticInit && !data) {
        setData(staticInit);
      }
      fetchIncidentDetail();
    }
  }, [id]);

  const incident = data?.incident;
  const memoryTrail = data?.memoryTrail || [];
  const whatIf = data?.whatIf || {};

  return (
    <div className="view-container incident-detail-view">
      <div className="breadcrumb-nav">
        <Link to="/" className="breadcrumb-link">Dashboard</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to="/history" className="breadcrumb-link">System History</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{id}</span>
      </div>

      <PageHeader
        title={`Incident ${id}`}
        subtitle={`Detailed forensic profile, institutional memory matches, and candidate fix analysis`}
        icon={ShieldAlert}
        action={
          <div className="header-btn-group">
            <button
              className="btn-secondary"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            {incident?.status === 'open' && (
              <button
                className="btn-primary"
                onClick={() => setShowResolveModal(true)}
              >
                <Check size={16} />
                <span>Resolve Incident</span>
              </button>
            )}
          </div>
        }
      />

      {loading ? (
        <LoadingSkeleton type="detail" />
      ) : error ? (
        <div className="error-banner">
          {error}
          <button className="btn-secondary ml-3" onClick={() => navigate('/history')}>
            Back to System History
          </button>
        </div>
      ) : incident ? (
        <div className="detail-layout">
          {/* Section 1: Incident Metadata Card */}
          <section className="detail-card metadata-card">
            <div className="detail-card-header">
              <div className="card-title-group">
                <h3>Incident Metadata & Parameters</h3>
                <span className="incident-id-tag mono">{incident.id}</span>
              </div>
              <div className="status-badges-group">
                <span className={`status-pill status-${incident.status}`}>
                  {(incident.status || 'open').toUpperCase()}
                </span>
                <span className={`sev-badge sev-${incident.severity}`}>
                  {(incident.severity || 'high').toUpperCase()} SEVERITY
                </span>
                {incident.confidence && (
                  <span className={`confidence-badge conf-${incident.confidence}`}>
                    {incident.confidence.toUpperCase()} CONFIDENCE
                  </span>
                )}
              </div>
            </div>

            <div className="metadata-grid">
              <div className="meta-item">
                <span className="meta-lbl">Alert Type</span>
                <span className="meta-val mono text-cyan">{incident.alertType}</span>
              </div>
              <div className="meta-item">
                <span className="meta-lbl">Affected System</span>
                <span className="meta-val mono">{incident.affectedSystem}</span>
              </div>
              <div className="meta-item">
                <span className="meta-lbl">Timestamp</span>
                <span className="meta-val text-muted">
                  {incident.timestamp ? new Date(incident.timestamp).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-lbl">Memory Assisted</span>
                <span className={`meta-val ${incident.memoryAssisted ? 'text-green font-bold' : 'text-muted'}`}>
                  {incident.memoryAssisted ? '✓ Yes (Hindsight Recalled)' : '✗ No (Unassisted / Novel)'}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-lbl">Resolution Outcome</span>
                <span className="meta-val">
                  {incident.outcome ? (
                    <span className={`outcome-pill outcome-${incident.outcome}`}>
                      {incident.outcome.toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-muted">Unresolved (Open)</span>
                  )}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-lbl">Time to Resolve</span>
                <span className="meta-val text-cyan font-bold">
                  {incident.timeToResolveMinutes ? `${incident.timeToResolveMinutes} minutes` : 'In Progress'}
                </span>
              </div>
            </div>

            {/* Verified Fix & Root Cause (If resolved) */}
            {incident.status === 'resolved' && (
              <div className="resolution-summary-box">
                <div className="res-row">
                  <span className="res-lbl">Fix Applied:</span>
                  <span className="res-val font-medium">{incident.fixApplied || 'N/A'}</span>
                </div>
                {incident.rootCause && (
                  <div className="res-row">
                    <span className="res-lbl">Root Cause:</span>
                    <span className="res-val text-muted">{incident.rootCause}</span>
                  </div>
                )}
              </div>
            )}

            {/* Raw Syslog Snippet */}
            <div className="raw-snippet-wrap">
              <span className="snippet-title">Security Syslog / Ingestion Payload:</span>
              <pre className="mono-code">{incident.rawLogSnippet || 'No log snippet provided'}</pre>
            </div>
          </section>

          {/* Section 2: Memory Trail Panel */}
          <section className="detail-card memory-trail-section">
            <div className="detail-card-header">
              <div className="card-title-group">
                <History size={18} className="text-green" />
                <h3>Recalled Memory Trail</h3>
              </div>
              <span className="count-pill">
                {memoryTrail.length} Past Incident(s) Matched
              </span>
            </div>

            {memoryTrail.length === 0 ? (
              <div className="empty-trail-box">
                <AlertTriangle size={32} className="text-muted" />
                <h4>No Institutional Matches Recorded</h4>
                <p>
                  Zero past incidents matched this alert pattern in Hindsight vector memory.
                  This was classified as a novel zero-day scenario.
                </p>
              </div>
            ) : (
              <div className="memory-timeline">
                {memoryTrail.map((past, idx) => (
                  <div key={past.id || idx} className="timeline-item">
                    <div className="timeline-marker">
                      <div className="marker-dot dot-success"></div>
                      {idx < memoryTrail.length - 1 && <div className="marker-line"></div>}
                    </div>

                    <div className="timeline-card">
                      <div className="timeline-card-header">
                        <div className="timeline-id-wrap">
                          <Link to={`/incidents/${past.id}`} className="incident-id-badge hover-underline">
                            {past.id}
                          </Link>
                          <span className="timeline-date">
                            {past.date ? new Date(past.date).toLocaleDateString() : 'Historical'}
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
            )}
          </section>

          {/* Section 3: What-If Ranked Fixes Panel */}
          <section className="detail-card whatif-section">
            <div className="detail-card-header">
              <div className="card-title-group">
                <Sparkles size={18} className="text-purple" />
                <h3>What-If Candidate Remediation Analysis</h3>
              </div>
              <span className="section-caption text-purple font-semibold">
                Ranked for alertType: {incident.alertType}
              </span>
            </div>

            {whatIf.summary && (
              <div className="whatif-ai-summary">
                <p><strong>LLM Comparative Summary:</strong> {whatIf.summary}</p>
              </div>
            )}

            <div className="table-responsive">
              <table className="interactive-table whatif-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Candidate Playbook Fix</th>
                    <th>Success Rate</th>
                    <th>Avg MTTR</th>
                    <th>Times Used</th>
                    <th>Sample Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {(whatIf.candidates || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No candidate remediation playbooks recorded for this alert type.
                      </td>
                    </tr>
                  ) : (
                    whatIf.candidates.map((cand) => (
                      <tr key={cand.fixApplied} className={cand.recommendedRank === 1 ? 'row-recommended' : ''}>
                        <td>
                          <span className={`rank-pill rank-${cand.recommendedRank}`}>
                            #{cand.recommendedRank}
                          </span>
                        </td>
                        <td className="fix-name-cell">
                          <strong>{cand.fixApplied}</strong>
                        </td>
                        <td>
                          <span className={cand.successRate >= 80 ? 'text-green font-bold' : cand.successRate > 0 ? 'text-amber' : 'text-red'}>
                            {cand.successRate}%
                          </span>
                        </td>
                        <td className="mono">{cand.avgTimeToResolve}m</td>
                        <td>{cand.timesUsed}x</td>
                        <td>
                          {cand.lowSampleSize ? (
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
          </section>
        </div>
      ) : null}

      {/* Resolve Modal */}
      {showResolveModal && incident && (
        <ResolveModal
          isOpen={showResolveModal}
          incident={incident}
          defaultFix={whatIf.candidates?.[0]?.fixApplied || incident.fixApplied}
          defaultRootCause={incident.rootCause}
          onClose={() => setShowResolveModal(false)}
          onResolved={(updated) => {
            setData((prev) => ({
              ...prev,
              incident: updated,
            }));
          }}
        />
      )}
    </div>
  );
}
