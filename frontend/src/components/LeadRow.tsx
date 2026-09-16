import { useState } from 'react';
import { Business, LeadStatus } from '@/types';

interface LeadRowProps {
  business: Business;
  onStatusUpdate?: (id: number, status: LeadStatus, notes: string | null) => void;
}

const statusOptions: { value: LeadStatus; label: string; className: string }[] = [
  { value: 'new', label: 'New', className: 'bg-gray-100 text-gray-600' },
  { value: 'contacted', label: 'Contacted', className: 'bg-blue-50 text-blue-700' },
  { value: 'replied', label: 'Replied', className: 'bg-amber-50 text-amber-700' },
  { value: 'converted', label: 'Converted', className: 'bg-emerald-50 text-emerald-700' },
  { value: 'not_interested', label: 'Not interested', className: 'bg-rose-50 text-rose-700' },
];

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

export default function LeadRow({ business, onStatusUpdate }: LeadRowProps) {
  const color = hashColor(business.name);
  const hasWebsite = !!business.website;
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState(business.notes || '');
  const currentStatus = business.status || 'new';

  const handleStatusChange = (status: LeadStatus) => {
    if (business.id == null || !onStatusUpdate) return;
    onStatusUpdate(business.id, status, business.notes ?? null);
  };

  const handleSaveNotes = () => {
    if (business.id == null || !onStatusUpdate) return;
    onStatusUpdate(business.id, currentStatus, notesDraft.trim() || null);
    setNotesOpen(false);
  };

  return (
    <div className="border-b border-gray-100 last:border-b-0">
    <div className="grid grid-cols-[36px_1.2fr_0.9fr_0.6fr_0.55fr_0.9fr] gap-3 items-center px-4 py-3 hover:bg-gray-50 transition-colors">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
        style={{ background: color.bg, color: color.text }}
      >
        {getInitials(business.name)}
      </div>

      <div className="min-w-0">
        <div className="text-[13px] font-medium mb-0.5 truncate text-gray-900 flex items-center gap-1.5">
          <span className="truncate">{business.name}</span>
          {business.isNew && (
            <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold uppercase tracking-wide">
              New
            </span>
          )}
        </div>
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

      <div className="flex flex-col items-end gap-1">
        <select
          value={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
          disabled={business.id == null}
          className={`text-[11px] font-medium rounded-full px-2 py-1 border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            statusOptions.find((s) => s.value === currentStatus)?.className || ''
          }`}
        >
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setNotesOpen((v) => !v)}
          disabled={business.id == null}
          className="text-[11px] text-gray-400 hover:text-gray-600 flex items-center gap-1 disabled:opacity-50"
        >
          <i className="ti ti-note" />
          {business.notes ? 'Notes' : 'Add note'}
        </button>
      </div>
    </div>

    {notesOpen && (
      <div className="px-4 pb-3 flex items-center gap-2 bg-gray-50">
        <input
          type="text"
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          placeholder="e.g. Called, no answer — follow up next week"
          className="flex-1 h-8 text-[12px] bg-white border border-gray-300 rounded-md px-2"
        />
        <button
          onClick={handleSaveNotes}
          className="h-8 px-3 text-[12px] font-medium bg-emerald-600 text-white rounded-md"
        >
          Save
        </button>
      </div>
    )}
    </div>
  );
}