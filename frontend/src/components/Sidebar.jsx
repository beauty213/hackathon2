import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  PlusCircle,
  History,
  TrendingUp,
  Brain,
  Zap,
  ExternalLink
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/new',
      label: 'New Incident',
      icon: PlusCircle,
      badge: 'Triage',
    },
    {
      to: '/history',
      label: 'System History',
      icon: History,
      badge: null,
    },
    {
      to: '/impact',
      label: 'Memory Impact',
      icon: TrendingUp,
      badge: 'Proof',
    },
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <ShieldAlert size={24} color="#fff" />
        </div>
        <div className="sidebar-title-group">
          <h2>SentinelMind</h2>
          <span className="sidebar-version">Autonomous SecOps v2</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">OPERATIONS</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
              end={item.to === '/'}
            >
              <Icon size={18} className="nav-icon" />
              <span className="nav-text">{item.label}</span>
              {item.badge && (
                <span className={`nav-badge ${item.badge === 'Proof' ? 'nav-badge-proof' : ''}`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Persistent Memory & AI Engine Info Footer */}
      <div className="sidebar-footer">
        <div className="system-status-card">
          <div className="status-row">
            <span className="status-indicator-dot online"></span>
            <span className="status-label">Agent Online</span>
          </div>

          <div className="engine-tag engine-hindsight">
            <Brain size={13} className="pulse-icon" />
            <span>Hindsight Active</span>
          </div>

          <div className="engine-tag engine-groq">
            <Zap size={13} />
            <span>Groq LPU (120B)</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
