import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  ArrowUpDown,
  Brain,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function SystemHistoryView() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterMemory, setFilterMemory] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  // Sort State
  const [sortField, setSortField] = useState('sequenceNumber');
  const [sortAsc, setSortAsc] = useState(false); // default descending (newest first)

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/incidents');
      if (!res.ok) throw new Error('Failed to load incident history');
      const data = await res.json();
      setIncidents(data);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err.message || 'Failed to load system history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  // Unique alert types for dropdown
  const uniqueAlertTypes = useMemo(() => {
    const set = new Set(incidents.map((i) => i.alertType).filter(Boolean));
    return Array.from(set).sort();
  }, [incidents]);

  // Filter and Sort Pipeline
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = inc.id?.toLowerCase().includes(query);
        const matchesType = inc.alertType?.toLowerCase().includes(query);
        const matchesSys = inc.affectedSystem?.toLowerCase().includes(query);
        const matchesFix = inc.fixApplied?.toLowerCase().includes(query);
        if (!matchesId && !matchesType && !matchesSys && !matchesFix) return false;
      }

      // Filter by Type
      if (filterType !== 'ALL' && inc.alertType !== filterType) return false;

      // Filter by Status
      if (filterStatus !== 'ALL' && inc.status !== filterStatus) return false;

      // Filter by Severity
      if (filterSeverity !== 'ALL' && inc.severity !== filterSeverity) return false;

      // Filter by Memory
      if (filterMemory === 'YES' && !inc.memoryAssisted) return false;
      if (filterMemory === 'NO' && inc.memoryAssisted) return false;

      return true;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'sequenceNumber') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else if (sortField === 'timeToResolveMinutes') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else if (sortField === 'timestamp') {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [incidents, searchQuery, filterType, filterStatus, filterMemory, filterSeverity, sortField, sortAsc]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterType('ALL');
    setFilterStatus('ALL');
    setFilterMemory('ALL');
    setFilterSeverity('ALL');
  };

  return (
    <div className="view-container system-history-view">
      <PageHeader
        title="System History & Audit Log"
        subtitle="Comprehensive chronological audit trail of all security incidents recorded across the enterprise"
        icon={History}
        badge={`${incidents.length} Records`}
      />

      {error && <div className="error-banner">{error}</div>}

      {/* Filter Toolbar */}
      <section className="filter-toolbar-card">
        <div className="filter-row-primary">
          <div className="search-box-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by ID, alert type, system, or fix applied..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button className="btn-clear-search" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>

          <button className="btn-reset-filters" onClick={resetFilters} title="Reset all filters">
            <RotateCcw size={14} />
            <span>Reset Filters</span>
          </button>
        </div>

        <div className="filter-row-secondary">
          {/* Alert Type Filter */}
          <div className="filter-select-group">
            <label>Alert Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Types ({uniqueAlertTypes.length})</option>
              {uniqueAlertTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-select-group">
            <label>Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="filter-select-group">
            <label>Severity:</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Memory Assisted Filter */}
          <div className="filter-select-group">
            <label>Memory Assisted:</label>
            <select
              value={filterMemory}
              onChange={(e) => setFilterMemory(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All (Assisted & Unassisted)</option>
              <option value="YES">Yes (Hindsight Assisted)</option>
              <option value="NO">No (Unassisted / Initial)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Full Dense Incident Table */}
      <section className="history-table-section">
        <div className="table-status-bar">
          <span className="results-count">
            Showing <strong>{filteredIncidents.length}</strong> of {incidents.length} incidents
          </span>
          <span className="sort-hint text-muted">
            Sorted by <strong className="mono">{sortField}</strong> ({sortAsc ? 'ascending' : 'descending'})
          </span>
        </div>

        <div className="table-responsive">
          {loading ? (
            <LoadingSkeleton type="table" count={10} height={44} />
          ) : (
            <table className="interactive-table history-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('sequenceNumber')} className="sortable-th">
                    <div className="th-content">
                      <span>#</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => handleSort('id')} className="sortable-th">
                    <div className="th-content">
                      <span>Incident ID</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => handleSort('timestamp')} className="sortable-th">
                    <div className="th-content">
                      <span>Date / Time</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => handleSort('alertType')} className="sortable-th">
                    <div className="th-content">
                      <span>Alert Type</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th>Affected System</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Outcome</th>
                  <th onClick={() => handleSort('timeToResolveMinutes')} className="sortable-th">
                    <div className="th-content">
                      <span>MTTR</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th>Memory</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-5 text-muted">
                      No incidents match the active search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((inc) => (
                    <tr
                      key={inc.id}
                      onClick={() => navigate(`/incidents/${inc.id}`)}
                      className="cursor-pointer hover-row"
                    >
                      <td className="text-muted mono text-sm">
                        #{inc.sequenceNumber || '--'}
                      </td>
                      <td className="mono font-bold text-cyan">
                        {inc.id}
                      </td>
                      <td className="text-muted text-sm">
                        {inc.timestamp ? new Date(inc.timestamp).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="mono font-semibold">{inc.alertType}</td>
                      <td className="text-muted mono">{inc.affectedSystem || 'system-01'}</td>
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
                      <td>
                        {inc.outcome ? (
                          <span className={`outcome-pill outcome-${inc.outcome}`}>
                            {inc.outcome.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-muted text-sm">--</span>
                        )}
                      </td>
                      <td className="mono font-bold">
                        {inc.timeToResolveMinutes ? `${inc.timeToResolveMinutes}m` : '--'}
                      </td>
                      <td>
                        {inc.memoryAssisted ? (
                          <span className="memory-badge-yes" title="Memory Assisted (Hindsight)">
                            <Brain size={13} />
                            <span>Yes</span>
                          </span>
                        ) : (
                          <span className="memory-badge-no" title="Unassisted">
                            <span>No</span>
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="row-action-link">
                          <ArrowRight size={14} />
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
