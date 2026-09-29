import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, PlusCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import MemoryImpactView from '../components/MemoryImpactView';

export default function MemoryImpactPageView() {
  const navigate = useNavigate();

  return (
    <div className="view-container memory-impact-view-page">
      <PageHeader
        title="Memory Impact & Learning Analysis"
        subtitle="Empirical proof that persistent memory improves agent speed, accuracy, and error avoidance over time"
        icon={TrendingUp}
        badge="Proof Metric"
        action={
          <button
            className="btn-primary"
            onClick={() => navigate('/new')}
          >
            <PlusCircle size={16} />
            <span>Test New Incident</span>
          </button>
        }
      />

      <MemoryImpactView onSwitchToTriage={() => navigate('/new')} />
    </div>
  );
}
