import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';

export default function ResolveModal({
  isOpen,
  incident,
  defaultFix = '',
  defaultRootCause = '',
  onClose,
  onResolved,
}) {
  const [fixApplied, setFixApplied] = useState('');
  const [outcome, setOutcome] = useState('success');
  const [timeToResolve, setTimeToResolve] = useState(15);
  const [rootCause, setRootCause] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (incident) {
      setFixApplied(defaultFix || incident.fixApplied || 'Applied approved remediation policy');
      setRootCause(defaultRootCause || incident.rootCause || 'Identified root cause during diagnostic triage');
      setOutcome(incident.outcome || 'success');
      setTimeToResolve(incident.timeToResolveMinutes || 15);
      setError(null);
    }
  }, [incident, defaultFix, defaultRootCause]);

  if (!isOpen || !incident) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/incidents/${incident.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fixApplied,
          outcome,
          rootCause,
          timeToResolveMinutes: Number(timeToResolve),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || `Server returned ${res.status}`);
      }

      const data = await res.json();
      if (onResolved) {
        onResolved(data.incident);
      }
      onClose();
    } catch (err) {
      console.error('Failed to resolve incident:', err);
      setError(err.message || 'Failed to submit resolution');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>Resolve Incident & Update Institutional Memory</h3>
            <span className="modal-subtitle">Incident ID: {incident.id}</span>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <p className="modal-intro">
            Submitting this verified resolution retains the fix and root cause directly into
            <strong> Hindsight persistent memory</strong>, allowing the agent to immediately recall it for future incidents.
          </p>

          {error && <div className="error-banner">{error}</div>}

          <div className="form-group">
            <label>Remediation Fix Applied:</label>
            <input
              type="text"
              value={fixApplied}
              onChange={(e) => setFixApplied(e.target.value)}
              placeholder="e.g. Enforce IMDSv2 and deploy Calico network egress policy"
              required
            />
          </div>

          <div className="input-row">
            <div className="form-group flex-1">
              <label>Outcome:</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="modal-select"
              >
                <option value="success">Success (Fix succeeded on first attempt)</option>
                <option value="partial">Partial (Mitigated with remaining side-effects)</option>
                <option value="failed">Failed (Ineffective / Caused regressions)</option>
              </select>
            </div>

            <div className="form-group flex-1">
              <label>Time to Resolve (Minutes):</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={timeToResolve}
                onChange={(e) => setTimeToResolve(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Verified Root Cause:</label>
            <input
              type="text"
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="e.g. SSRF vulnerability in webhook URL parser"
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-save-resolve" disabled={submitting}>
              {submitting ? 'Saving to Hindsight...' : 'Save & Retain Memory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
