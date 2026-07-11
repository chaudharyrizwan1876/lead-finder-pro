import { SearchResponse } from '@/types';

interface StatsCardsProps {
  results: SearchResponse;
}

export default function StatsCards({ results }: StatsCardsProps) {
  const avgRating =
    results.data.filter((b) => b.rating).length > 0
      ? (
          results.data.filter((b) => b.rating).reduce((sum, b) => sum + (b.rating || 0), 0) /
          results.data.filter((b) => b.rating).length
        ).toFixed(1)
      : '—';

  const cards = [
    { label: 'Total leads', value: results.total, icon: 'ti-building-store', color: 'emerald' },
    { label: 'With email', value: results.withEmail, icon: 'ti-mail', color: 'blue' },
    { label: 'With phone', value: results.withPhone, icon: 'ti-phone', color: 'amber' },
    { label: 'No website', value: results.withoutWebsite, icon: 'ti-world-off', color: 'rose' },
  ];

  const colorMap: Record<string, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700' },
  };

  return (
    <div className="grid grid-cols-4 gap-2.5 mb-4">
      {cards.map((c) => (
        <div key={c.label} className={`${colorMap[c.color].bg} border border-gray-100 rounded-xl p-4`}>
          <div className={`text-[11px] ${colorMap[c.color].text} mb-1.5 flex items-center gap-1 font-medium`}>
            <i className={`ti ${c.icon}`} /> {c.label}
          </div>
          <div className="text-2xl font-semibold text-gray-900">{c.value}</div>
        </div>
      ))}
    </div>
  );
}