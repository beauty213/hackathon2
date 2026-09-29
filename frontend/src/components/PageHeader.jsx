import React from 'react';

export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  action,
  badge,
}) {
  return (
    <header className="page-header">
      <div className="page-header-info">
        <div className="page-title-row">
          {Icon && (
            <div className="page-title-icon-wrap">
              <Icon size={22} className="page-title-icon" />
            </div>
          )}
          <h1>{title}</h1>
          {badge && <span className="page-header-badge">{badge}</span>}
        </div>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>

      {action && <div className="page-header-actions">{action}</div>}
    </header>
  );
}
