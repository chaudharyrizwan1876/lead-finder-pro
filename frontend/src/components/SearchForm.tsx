'use client';

import { useState } from 'react';
import { SearchParams } from '@/types';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  loading: boolean;
}

const businessTypes = [
  { value: 'dentist', label: 'Dentist' },
  { value: 'clinic', label: 'Clinic / Hospital' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Cafe / Bakery' },
  { value: 'gym', label: 'Gym / Fitness' },
  { value: 'hotel', label: 'Hotel / Guest house' },
  { value: 'lawyer', label: 'Lawyer / Law firm' },
  { value: 'real_estate', label: 'Real estate agency' },
  { value: 'salon', label: 'Salon / Spa' },
  { value: 'school', label: 'School / Academy' },
  { value: 'university', label: 'University / College' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'veterinary', label: 'Veterinary clinic' },
  { value: 'car_dealer', label: 'Car dealership' },
  { value: 'car_repair', label: 'Auto workshop' },
  { value: 'travel_agency', label: 'Travel agency' },
  { value: 'wedding_hall', label: 'Wedding hall / Banquet' },
  { value: 'photographer', label: 'Photography studio' },
  { value: 'bank', label: 'Bank / Finance' },
  { value: 'insurance', label: 'Insurance agency' },
  { value: 'furniture', label: 'Furniture store' },
  { value: 'electronics', label: 'Electronics store' },
  { value: 'clothing', label: 'Clothing / Boutique' },
  { value: 'supermarket', label: 'Supermarket / Grocery' },
  { value: 'jewelry', label: 'Jewelry store' },
  { value: 'gym_supplement', label: 'Supplement store' },
  { value: 'fitness_center', label: 'Fitness center / CrossFit' },
  { value: 'event_planner', label: 'Event planner' },
  { value: 'logistics', label: 'Logistics / Courier' },
  { value: 'construction', label: 'Construction company' },
  { value: 'architect', label: 'Architecture firm' },
  { value: 'accounting', label: 'Accounting firm' },
  { value: 'marketing_agency', label: 'Marketing agency' },
  { value: 'driving_school', label: 'Driving school' },
  { value: 'daycare', label: 'Daycare / Preschool' },
  { value: 'fast_food', label: 'Fast food chain' },
  { value: 'bakery', label: 'Bakery' },
];

export default function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [businessType, setBusinessType] = useState('dentist');
  const [city, setCity] = useState('Lahore');
  const [radius, setRadius] = useState(10);
  const [useGoogleMaps, setUseGoogleMaps] = useState(true);

  const handleSubmit = () => {
    if (!city.trim()) return;
    onSearch({ businessType, city, radius, useGoogleMaps });
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 mb-5 border border-emerald-100">
      <div className="grid grid-cols-[1.3fr_1.3fr_0.8fr_auto] gap-2.5">
        <div>
          <label className="text-[11px] text-gray-500 block mb-1.5 uppercase tracking-wide font-medium">
            Business type
          </label>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full h-9 text-[13px] bg-white border border-gray-300 rounded-md px-2"
          >
            {businessTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] text-gray-500 block mb-1.5 uppercase tracking-wide font-medium">
            City
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Lahore"
            className="w-full h-9 text-[13px] bg-white border border-gray-300 rounded-md px-2"
          />
        </div>
        <div>
          <label className="text-[11px] text-gray-500 block mb-1.5 uppercase tracking-wide font-medium">
            Radius
          </label>
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full h-9 text-[13px] bg-white border border-gray-300 rounded-md px-2"
          >
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={75}>75 km</option>
            <option value={100}>100 km</option>
            <option value={150}>150 km</option>
            <option value={200}>200 km</option>
            <option value={300}>300 km</option>
            <option value={500}>500 km</option>
          </select>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="h-9 px-4 text-[13px] font-medium bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-md flex items-center gap-1.5 self-end disabled:opacity-50 shadow-sm hover:shadow-md transition-shadow"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="checkbox"
          id="useGoogleMaps"
          checked={useGoogleMaps}
          onChange={(e) => setUseGoogleMaps(e.target.checked)}
        />
        <label htmlFor="useGoogleMaps" className="text-[12px] text-gray-600">
          Google Maps se bhi extra data nikalo (thoda time lagega)
        </label>
      </div>
    </div>
  );
}