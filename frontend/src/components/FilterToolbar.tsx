interface FilterToolbarProps {
  total: number;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onExport: () => void;
  exporting: boolean;
}

const filters = ['All', 'Emails', 'Phone Numbers', 'No website', '4.5+ Rating'];

export default function FilterToolbar({
  total,
  activeFilter,
  onFilterChange,
  onExport,
  exporting,
}: FilterToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-[12px] text-gray-500 font-medium">{total} results</span>
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`h-7 px-2.5 text-[12px] rounded-full border transition-colors ${
              activeFilter === f
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-transparent text-gray-500 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
        <button
          onClick={onExport}
          disabled={exporting || total === 0}
          className="h-7 px-3 text-[12px] font-medium bg-gradient-to-r from-emerald-700 to-teal-700 text-white rounded-md flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
        >
          <i className="ti ti-download" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>
    </div>
  );
}