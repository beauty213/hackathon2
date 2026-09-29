import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import NewIncidentView from './views/NewIncidentView';
import IncidentDetailView from './views/IncidentDetailView';
import SystemHistoryView from './views/SystemHistoryView';
import MemoryImpactPageView from './views/MemoryImpactPageView';

export default function App() {
  return (
    <Router>
      <div className="app-layout">
        {/* Persistent Navigation Sidebar */}
        <Sidebar />

        {/* Main Routed Content Area */}
        <main className="app-main-content">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/new" element={<NewIncidentView />} />
            <Route path="/incidents/:id" element={<IncidentDetailView />} />
            <Route path="/history" element={<SystemHistoryView />} />
            <Route path="/impact" element={<MemoryImpactPageView />} />
            {/* Aliases & Fallbacks */}
            <Route path="/analytics" element={<Navigate to="/impact" replace />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
