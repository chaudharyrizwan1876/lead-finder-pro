'use client';

import { useState } from 'react';
import { Business } from '@/types';
import LeadRow from './LeadRow';
import FilterToolbar from './FilterToolbar';
import { exportCSV } from '@/lib/api';

interface LeadsListProps {
  businesses: Business[];
}

export default function LeadsList({ businesses }: LeadsListProps) {
  const [activeFilter, setActiveFilter] = useState('Sab');
  const [exporting, setExporting] = useState(false);

  const filtered = businesses.filter((b) => {
    if (activeFilter === 'Email waly') return !!b.email;
    if (activeFilter === 'Phone waly') return !!b.phone;
    if (activeFilter === 'No website') return !b.website;
    if (activeFilter === '4.5+ Rating') return (b.rating || 0) >= 4.5;
    return true;
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportCSV(filtered);
    } catch (err) {
      alert('Export fail ho gaya, dobara try karo');
    } finally {
      setExporting(false);
    }
  };

  if (businesses.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        <i className="ti ti-map-search text-4xl opacity-30 block mb-3" />
        Business type aur city dal ke search karo
      </div>
    );
  }

  return (
    <div>
      <FilterToolbar
        total={filtered.length}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onExport={handleExport}
        exporting={exporting}
      />
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {filtered.map((b, i) => (
          <LeadRow key={`${b.name}-${i}`} business={b} />
        ))}
      </div>
    </div>
  );
}