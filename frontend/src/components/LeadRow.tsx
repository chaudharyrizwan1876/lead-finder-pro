import { Business } from '@/types';

interface LeadRowProps {
  business: Business;
}

const avatarColors = [
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#DBEAFE', text: '#1E40AF' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#FCE7F3', text: '#9D174D' },
  { bg: '#EDE9FE', text: '#5B21B6' },
  { bg: '#FFE4E6', text: '#9F1239' },
];

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function hashColor(name: string) {
  const sum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return avatarColors[sum % avatarColors.length];
}

export default function LeadRow({ business }: LeadRowProps) {
  const color = hashColor(business.name);
  const hasWebsite = !!business.website;

  return (
    <div className="grid grid-cols-[36px_1.3fr_1fr_0.7fr_0.6fr] gap-3 items-center px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
        style={{ background: color.bg, color: color.text }}
      >
        {getInitials(business.name)}
      </div>

      <div className="min-w-0">
        <div className="text-[13px] font-medium mb-0.5 truncate text-gray-900">{business.name}</div>
        <div className="text-[11px] text-gray-500 truncate">{business.address}</div>
      </div>

      <div className="flex flex-col gap-0.5">
        {business.phone ? (
          <span className="text-[12px] flex items-center gap-1 text-gray-700">
            <i className="ti ti-phone text-emerald-600" /> {business.phone}
          </span>
        ) : (
          <span className="text-[12px] text-gray-400 flex items-center gap-1">
            <i className="ti ti-phone-off" /> No
          </span>
        )}
        {business.email ? (
          <span
            className="text-[12px] text-emerald-700 flex items-center gap-1 truncate font-medium"
            title={business.emailSource === 'facebook' ? 'Facebook se mila' : 'Website se mila'}
          >
            <i className="ti ti-mail" /> {business.email}
            {business.emailSource === 'facebook' && (
              <i className="ti ti-brand-facebook text-blue-600 ml-0.5" />
            )}
          </span>
        ) : (
          <span className="text-[12px] text-gray-400 flex items-center gap-1">
            <i className="ti ti-mail-off" /> No
          </span>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        {hasWebsite ? (
          <a href={business.website || '#'} target="_blank" rel="noopener noreferrer" className="text-[12px] text-blue-600 flex items-center gap-1 truncate hover:underline">
            <i className="ti ti-world" /> Website
          </a>
        ) : (
          <span className="text-[12px] text-rose-500 font-medium flex items-center gap-1">
            <i className="ti ti-world-off" /> No website
          </span>
        )}
        {business.whatsapp && (
          <a href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-[12px] text-green-600 flex items-center gap-1 hover:underline">
            <i className="ti ti-brand-whatsapp" /> WhatsApp
          </a>
        )}
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className="text-[12px] text-amber-600 font-semibold">
          {business.rating ? `★ ${business.rating}` : '—'}
        </span>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            business.source === 'googlemaps' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {business.source === 'googlemaps' ? 'Maps' : 'OSM'}
        </span>
      </div>
    </div>
  );
}