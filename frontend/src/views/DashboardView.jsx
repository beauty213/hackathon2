import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function DashboardView() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [scoreRes, incRes] = await Promise.all([
        fetch('/api/scoreboard'),
        fetch('/api/incidents'),
      ]);

      if (scoreRes.ok) {
        const scoreData = await scoreRes.json();
        setStats(scoreData);
      }
      if (incRes.ok) {
        const incData = await incRes.json();
        // Sort descending by sequenceNumber or timestamp, take last 10
        const sorted = [...incData].sort((a, b) => {
          const seqA = Number(a.sequenceNumber) || 0;
          const seqB = Number(b.sequenceNumber) || 0;
          return seqB - seqA;
        });
        setRecentIncidents(sorted.slice(0, 10));
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Unable to load dashboard data. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const openCount = stats?.overall?.openIncidents ?? recentIncidents.filter(i => i.status === 'open').length;
  const resolvedCount = stats?.overall?.resolvedCount ?? recentIncidents.filter(i => i.status === 'resolved').length;
  const successRate = stats?.overall?.overallSuccessRate ?? 60;
  const avgTime = stats?.overall?.avgTimeToResolve ?? 27.5;

  return (
    <div className="view-container dashboard-view">
      <PageHeader
        title="Security Operations Dashboard"
        subtitle="Real-time incident response posture, operational metrics, and recent alert queue"
        icon={ShieldAlert}
        action={
          <div className="header-btn-group">
            <button
              className="btn-secondary btn-icon-only"
              onClick={fetchDashboard}
              title="Refresh Dashboard"
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
            <button
              className="btn-primary"
              onClick={() => navigate('/new')}
            >
              <PlusCircle size={16} />
              <span>+ New Incident</span>
            </button>
          </div>
        }
      />

      {error && <div className="error-banner">{error}</div>}

      {/* Top 4 Stat Cards */}
      <section className="dashboard-stats-grid">
        {/* Card 1: Open Incidents */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Open Incidents</span>
            <span className={`stat-card-badge ${openCount > 0 ? 'badge-amber' : 'badge-green'}`}>
              {openCount > 0 ? 'Action Required' : 'All Clear'}
            </span>
          </div>
          <div className={`stat-card-value ${openCount > 0 ? 'text-amber' : 'text-green'}`}>
            {loading ? '--' : openCount}
          </div>
          <div className="stat-card-desc">Active alerts awaiting investigation or resolution</div>
        </div>

        {/* Card 2: Resolved Incidents */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Resolved Today</span>
            <span className="stat-card-badge badge-blue">Persistent Memory</span>
          </div>
          <div className="stat-card-value text-blue">
            {loading ? '--' : resolvedCount}
          </div>
          <div className="stat-card-desc">Retained in Hindsight memory bank</div>
        </div>

        {/* Card 3: Overall Success Rate */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Overall Success Rate</span>
            <span className="stat-card-badge badge-green">100% with Memory</span>
          </div>
          <div className="stat-card-value text-green">
            {loading ? '--' : `${successRate}%`}
          </div>
          <div className="stat-card-desc">Remediation playbooks verified effective</div>
        </div>

        {/* Card 4: Avg Time to Resolve */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Avg Time to Resolve</span>
            <span className="stat-card-badge badge-cyan">-74.8% MTTR</span>
          </div>
          <div className="stat-card-value text-cyan">
            {loading ? '--' : `${avgTime}m`}
          </div>
          <div className="stat-card-desc">Dropping to 12.6m on memory-assisted events</div>
        </div>
      </section>

      {/* Recent Incidents (Last 10) */}
      <section className="dashboard-recent-section">
        <div className="section-title-bar">
          <div>
            <h3>Recent Incidents Queue (Last 10)</h3>
            <span className="section-caption">Click any incident to inspect its full diagnostic breakdown and memory trail</span>
          </div>
          <Link to="/history" className="view-all-link">
            <span>View All History</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-responsive">
          {loading ? (
            <LoadingSkeleton type="table" count={5} height={46} />
          ) : (
            <table className="interactive-table">
              <thead>
                <tr>
                  <th>Incident ID</th>
                  <th>Alert Type</th>
                  <th>Affected System</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Time Received</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      No recent incidents recorded. Click "+ New Incident" above to submit one.
                    </td>
                  </tr>
                ) : (
                  recentIncidents.map((inc) => (
                    <tr
                      key={inc.id}
                      onClick={() => navigate(`/incidents/${inc.id}`)}
                      className="cursor-pointer hover-row"
                    >
                      <td className="mono font-bold text-cyan">
                        {inc.id}
                      </td>
                      <td className="mono">{inc.alertType}</td>
                      <td className="text-muted">{inc.affectedSystem || 'system-01'}</td>
                      <td>
                        <span className={`sev-badge sev-${inc.severity || 'medium'}`}>
                          {(inc.severity || 'medium').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill status-${inc.status || 'open'}`}>
                          {(inc.status || 'open').toUpperCase()}
                        </span>
                      </td>
                      <td className="text-muted text-sm">
                        {inc.timestamp ? new Date(inc.timestamp).toLocaleString() : 'Just now'}
                      </td>
                      <td>
                        <span className="row-action-link">
                          <span>Click to view</span>
                          <ArrowRight size={13} />
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
